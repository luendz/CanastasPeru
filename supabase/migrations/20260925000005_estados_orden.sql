-- ============================================================================
-- Estados de las órdenes según el flujo del negocio:
--
--   Nuevo (primer día) → Pendiente → En preparación → Entregado   (+ Anulada)
--
-- - "Pagada" deja de ser un estado: el cobro se lleva solo en estado_pago.
-- - "En ruta" se elimina del flujo.
-- - Una orden nueva pasa sola a "pendiente" 24 horas después de creada
--   (tarea programada con pg_cron cada 15 minutos).
-- ============================================================================

-- 1. Llevar las órdenes existentes a los estados nuevos.
alter table public.ordenes drop constraint ordenes_estado_check;

update public.ordenes set estado = 'pendiente' where estado = 'pagada';
update public.ordenes set estado = 'preparacion' where estado = 'en_ruta';
update public.ordenes set estado = 'pendiente' where estado = 'nueva' and created_at < now() - interval '1 day';

alter table public.ordenes add constraint ordenes_estado_check
  check (estado in ('nueva', 'pendiente', 'preparacion', 'entregada', 'anulada'));

-- 2. Paso automático de "nueva" a "pendiente".
create or replace function public.pasar_ordenes_a_pendiente()
returns integer
language sql
security definer
set search_path = ''
as $$
  with cambiadas as (
    update public.ordenes set estado = 'pendiente'
    where estado = 'nueva' and created_at < now() - interval '1 day'
    returning 1
  )
  select count(*)::integer from cambiadas;
$$;
revoke execute on function public.pasar_ordenes_a_pendiente() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('ordenes-nuevas-a-pendiente', '*/15 * * * *', 'select public.pasar_ordenes_a_pendiente()');

-- 3. Inventario: se descuenta desde "en preparación"; lo nuevo y pendiente queda como requerido.
create or replace view public.v_inventario with (security_invoker = true) as
select
  i.id as insumo_id,
  i.nombre,
  i.unidad,
  i.tipo,
  i.stock_minimo,
  i.stock_inicial
    + coalesce((select sum(c.cantidad) from public.compras c where c.insumo_id = i.id), 0)
    - coalesce((select sum(v.cantidad) from public.v_consumo_insumos v where v.insumo_id = i.id and v.estado in ('preparacion', 'entregada')), 0) as stock,
  coalesce((select sum(v.cantidad) from public.v_consumo_insumos v where v.insumo_id = i.id and v.estado in ('nueva', 'pendiente')), 0) as requerido_pendiente
from public.insumos i;

-- 4. Canal por el que llegó el pedido: web, WhatsApp o correo.
--    Las compras de la tienda son siempre "web"; en cotizaciones y órdenes
--    creadas desde el panel se elige, y al aprobar una cotización se copia.
alter table public.cotizaciones add column canal text not null default 'web' check (canal in ('web', 'whatsapp', 'correo'));
alter table public.ordenes add column canal text not null default 'web' check (canal in ('web', 'whatsapp', 'correo'));
update public.ordenes o set canal = c.canal from public.cotizaciones c where o.cotizacion_id = c.id;

create or replace function public.aprobar_cotizacion(p_cotizacion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cot public.cotizaciones;
  v_orden_id uuid;
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_cot from public.cotizaciones where id = p_cotizacion_id for update;
  if not found then
    raise exception 'Cotización no encontrada';
  end if;
  if v_cot.estado = 'aprobada' then
    raise exception 'La cotización ya fue aprobada';
  end if;
  if not exists (select 1 from public.cotizacion_items where cotizacion_id = v_cot.id) then
    raise exception 'Agrega al menos una canasta con precio antes de aprobar';
  end if;

  insert into public.ordenes (
    origen, canal, cotizacion_id, cliente_nombre, cliente_email, cliente_telefono,
    comprobante_tipo, comprobante_documento, comprobante_nombre,
    fecha_entrega, notas, subtotal
  ) values (
    'cotizacion', v_cot.canal, v_cot.id,
    v_cot.contacto || ' · ' || v_cot.empresa, v_cot.email, v_cot.telefono,
    case when v_cot.ruc is not null then 'factura' else 'boleta' end,
    v_cot.ruc, v_cot.empresa,
    v_cot.fecha_requerida,
    nullif(concat_ws(' · ', v_cot.lugar_entrega, v_cot.requerimientos), ''),
    (select coalesce(sum(subtotal), 0) from public.cotizacion_items where cotizacion_id = v_cot.id)
  ) returning id into v_orden_id;

  insert into public.orden_items (orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario)
  select v_orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario
  from public.cotizacion_items where cotizacion_id = v_cot.id;

  update public.cotizaciones set estado = 'aprobada' where id = v_cot.id;
  return v_orden_id;
end;
$$;
