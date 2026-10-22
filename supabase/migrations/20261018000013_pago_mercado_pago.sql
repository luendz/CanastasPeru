-- ============================================================================
-- Pago en línea con Mercado Pago (Checkout Pro).
--
-- - El checkout crea la orden como siempre y lleva al cliente a pagar en
--   Mercado Pago, con el número de orden como referencia externa.
-- - Mercado Pago avisa cada cambio de un pago a la web (webhook). La web
--   consulta el pago en la API de Mercado Pago y lo registra aquí con
--   registrar_pago_mp, que solo puede ejecutar el servidor (secret key).
-- - La orden pasa a estado_pago = 'pagado' solo con un pago aprobado que
--   cubra el total; un reembolso o contracargo la regresa a 'pendiente'.
-- ============================================================================

alter table public.ordenes
  add column mp_payment_id text,
  add column mp_estado text,
  add column mp_estado_detalle text,
  add column mp_actualizado_at timestamptz;

comment on column public.ordenes.mp_payment_id is 'Último pago de Mercado Pago asociado a la orden.';
comment on column public.ordenes.mp_estado is 'Estado del pago en Mercado Pago: approved, pending, in_process, rejected, refunded…';

create or replace function public.registrar_pago_mp(p jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_orden public.ordenes;
  v_pago text := left(p ->> 'payment_id', 40);
  v_estado text := left(p ->> 'estado', 40);
  v_monto numeric := coalesce((p ->> 'monto')::numeric, 0);
begin
  if v_pago is null or v_estado is null then
    raise exception 'Faltan datos del pago';
  end if;

  select * into v_orden from public.ordenes where numero = p ->> 'numero' for update;
  if not found then
    return 'orden_no_encontrada';
  end if;

  -- Avisos atrasados de otro intento (por ejemplo, un pago rechazado antes del
  -- aprobado) no deben pisar una orden que ya está pagada.
  if v_orden.estado_pago = 'pagado'
     and v_orden.mp_payment_id is distinct from v_pago
     and v_estado <> 'approved' then
    return 'ignorado';
  end if;

  update public.ordenes set
    mp_payment_id = v_pago,
    mp_estado = v_estado,
    mp_estado_detalle = left(p ->> 'estado_detalle', 80),
    mp_actualizado_at = now(),
    estado_pago = case
      when v_estado = 'approved' and v_monto >= v_orden.total - 0.01 then 'pagado'
      when v_estado in ('refunded', 'charged_back', 'cancelled') and v_orden.mp_payment_id = v_pago then 'pendiente'
      else v_orden.estado_pago
    end
  where id = v_orden.id;

  return v_estado;
end;
$$;

revoke execute on function public.registrar_pago_mp(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_pago_mp(jsonb) to service_role;
