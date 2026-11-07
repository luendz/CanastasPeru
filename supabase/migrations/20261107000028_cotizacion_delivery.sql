-- ============================================================================
-- Delivery en las cotizaciones.
--
-- La cotización guarda la tarifa del distrito elegido (Catálogo → Delivery por
-- distrito) en "delivery". Se toma sola al crear la cotización o al cambiar el
-- distrito; si el distrito no está en la lista, queda en 0. Como en la tienda,
-- con más de 100 canastas el delivery es gratis: la web y el PDF lo muestran así
-- y al aprobar, la orden nace con ese delivery y su distrito.
-- ============================================================================

alter table public.cotizaciones
  add column delivery numeric(10,2) not null default 0 check (delivery >= 0);

comment on column public.cotizaciones.delivery is 'Tarifa de delivery del distrito elegido (gratis con más de 100 canastas).';

create or replace function public.cotizacion_tarifa_delivery()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if tg_op = 'INSERT' or new.distrito is distinct from old.distrito then
    new.delivery := coalesce((select z.tarifa from public.zonas_delivery z where z.distrito = new.distrito and z.activo), 0);
  end if;
  return new;
end;
$$;

create trigger cotizaciones_delivery
  before insert or update of distrito on public.cotizaciones
  for each row execute function public.cotizacion_tarifa_delivery();

-- Las cotizaciones que ya tienen un distrito de la lista toman su tarifa.
update public.cotizaciones c set delivery = z.tarifa
from public.zonas_delivery z where z.distrito = c.distrito and z.activo;

-- Al aprobar, la orden lleva el distrito y el delivery (0 con más de 100 canastas).
create or replace function public.aprobar_cotizacion(p_cotizacion_id uuid)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_cot public.cotizaciones;
  v_orden_id uuid;
  v_unidades integer;
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

  select coalesce(sum(cantidad), 0) into v_unidades from public.cotizacion_items where cotizacion_id = v_cot.id;

  insert into public.ordenes (
    origen, canal, cotizacion_id, cliente_nombre, cliente_email, cliente_telefono,
    comprobante_tipo, comprobante_documento, comprobante_nombre,
    fecha_entrega, direccion, distrito, notas, subtotal, delivery
  ) values (
    'cotizacion', v_cot.canal, v_cot.id,
    v_cot.contacto || ' · ' || v_cot.empresa, v_cot.email, v_cot.telefono,
    case when v_cot.ruc is not null then 'factura' else 'boleta' end,
    v_cot.ruc, v_cot.empresa,
    v_cot.fecha_requerida,
    v_cot.lugar_entrega,
    v_cot.distrito,
    v_cot.requerimientos,
    (select coalesce(sum(subtotal), 0) from public.cotizacion_items where cotizacion_id = v_cot.id),
    case when v_unidades > 100 then 0 else v_cot.delivery end
  ) returning id into v_orden_id;

  insert into public.orden_items (orden_id, canasta_id, canasta_nombre, envase_id, cantidad, precio_unitario, contenido)
  select v_orden_id, canasta_id, canasta_nombre, envase_id, cantidad, precio_unitario, contenido
  from public.cotizacion_items where cotizacion_id = v_cot.id;

  update public.cotizaciones set estado = 'aprobada' where id = v_cot.id;
  return v_orden_id;
end;
$$;
