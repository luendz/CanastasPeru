-- ============================================================================
-- Canasta personalizada en cotizaciones.
--
-- Una línea de cotización u orden puede no venir del catálogo: entonces
-- lleva su propia lista de productos en "contenido":
--   [{ "insumo_id": uuid, "nombre": text, "cantidad": number }, ...]
-- Al aprobar la cotización el contenido pasa a la orden, y el inventario
-- descuenta esos insumos igual que las recetas de las canastas del catálogo.
-- ============================================================================

alter table public.cotizacion_items add column contenido jsonb check (contenido is null or jsonb_typeof(contenido) = 'array');
alter table public.orden_items add column contenido jsonb check (contenido is null or jsonb_typeof(contenido) = 'array');

-- Consumo de insumos: recetas de catálogo + contenido de canastas personalizadas.
create or replace view public.v_consumo_insumos with (security_invoker = true) as
select x.insumo_id, x.estado, sum(x.cantidad) as cantidad
from (
  select r.insumo_id, o.estado, oi.cantidad::numeric * r.cantidad as cantidad
  from public.orden_items oi
  join public.ordenes o on o.id = oi.orden_id
  join public.recetas r on r.producto_id = oi.producto_id
  where o.estado <> 'anulada' and oi.contenido is null
  union all
  select (e ->> 'insumo_id')::uuid, o.estado, oi.cantidad::numeric * (e ->> 'cantidad')::numeric
  from public.orden_items oi
  join public.ordenes o on o.id = oi.orden_id
  cross join lateral jsonb_array_elements(oi.contenido) e
  where o.estado <> 'anulada' and oi.contenido is not null and (e ->> 'insumo_id') is not null
) x
group by x.insumo_id, x.estado;

-- Al aprobar, el contenido de cada línea pasa a la orden.
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
    fecha_entrega, direccion, notas, subtotal
  ) values (
    'cotizacion', v_cot.canal, v_cot.id,
    v_cot.contacto || ' · ' || v_cot.empresa, v_cot.email, v_cot.telefono,
    case when v_cot.ruc is not null then 'factura' else 'boleta' end,
    v_cot.ruc, v_cot.empresa,
    v_cot.fecha_requerida,
    v_cot.lugar_entrega,
    v_cot.requerimientos,
    (select coalesce(sum(subtotal), 0) from public.cotizacion_items where cotizacion_id = v_cot.id)
  ) returning id into v_orden_id;

  insert into public.orden_items (orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario, contenido)
  select v_orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario, contenido
  from public.cotizacion_items where cotizacion_id = v_cot.id;

  update public.cotizaciones set estado = 'aprobada' where id = v_cot.id;
  return v_orden_id;
end;
$$;
