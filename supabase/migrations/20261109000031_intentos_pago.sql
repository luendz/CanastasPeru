-- ============================================================================
-- Intentos de pago con tarjeta (Mercado Pago).
--
-- Antes, al elegir pagar con tarjeta, la web creaba la orden (con su número
-- OP-000X y los correos de "pedido registrado") ANTES de abrir Mercado Pago.
-- Si el cliente cerraba la pasarela sin pagar, quedaba un pedido fantasma.
--
-- Ahora:
-- - El checkout con tarjeta guarda un INTENTO (intentos_pago) con el carrito,
--   los datos del cliente y los montos ya calculados. No tiene número de orden
--   ni aparece en Órdenes. Su referencia (IP-…) va a Mercado Pago.
-- - Cuando Mercado Pago confirma un pago aprobado que cubre el total,
--   confirmar_intento_pago crea la orden con los montos del intento, la marca
--   como pagada y deja el intento como convertido.
-- - Los pagos manuales (Yape, transferencia…) siguen creando la orden al
--   momento con crear_orden_web.
--
-- crear_orden_web se divide en calcular_orden_web (valida y calcula) e
-- insertar_orden_web (guarda), que también usa la conversión del intento.
-- ============================================================================

-- Valida el pedido y calcula líneas, subtotal y delivery (no guarda nada).
create or replace function public.calcular_orden_web(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_item jsonb;
  v_canasta public.canastas;
  v_envase text;
  v_cantidad integer;
  v_precio numeric;
  v_lineas jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_delivery numeric := 0;
  v_unidades integer := 0;
  v_items jsonb := coalesce(p -> 'items', '[]'::jsonb);
  v_nombre text := nullif(btrim(p #>> '{cliente,nombre}'), '');
  v_tarjetas integer := coalesce(nullif(p #>> '{tarjetas,cantidad}', '')::integer, 0);
  v_precio_tarjeta numeric;
  v_articulo_tarjeta public.articulos;
  v_dedicatoria text := nullif(btrim(coalesce(p #>> '{tarjetas,dedicatoria}', p #>> '{entrega,dedicatoria}')), '');
begin
  if v_nombre is null or char_length(v_nombre) > 160 then
    raise exception 'Falta el nombre del cliente';
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 30 then
    raise exception 'El pedido debe tener entre 1 y 30 productos';
  end if;
  if v_tarjetas < 0 or v_tarjetas > 500 then
    raise exception 'Cantidad de tarjetas inválida';
  end if;

  if nullif(p #>> '{entrega,distrito}', '') is not null then
    select tarifa into v_delivery from public.zonas_delivery
    where distrito = p #>> '{entrega,distrito}' and activo;
    if not found then
      raise exception 'Distrito sin cobertura de delivery';
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(v_items) loop
    select * into v_canasta from public.canastas where slug = v_item ->> 'slug' and activo;
    if not found then
      raise exception 'Producto no disponible: %', v_item ->> 'slug';
    end if;
    v_cantidad := (v_item ->> 'cantidad')::integer;
    if v_cantidad is null or v_cantidad < 1 or v_cantidad > 500 then
      raise exception 'Cantidad inválida para %', v_canasta.nombre;
    end if;
    v_envase := coalesce(nullif(v_item ->> 'envase_id', ''), v_canasta.envase_base_id);
    if not exists (select 1 from public.canasta_envases where canasta_id = v_canasta.id and envase_id = v_envase and visible) then
      raise exception 'Envase no disponible para %', v_canasta.nombre;
    end if;
    v_precio := public.precio_canasta(v_canasta.id, v_envase);
    v_subtotal := v_subtotal + v_cantidad * v_precio;
    v_unidades := v_unidades + v_cantidad;
    v_lineas := v_lineas || jsonb_build_object(
      'canasta_id', v_canasta.id, 'nombre', v_canasta.nombre, 'envase', v_envase,
      'cantidad', v_cantidad, 'precio', v_precio
    );
  end loop;

  if v_unidades > 100 then
    v_delivery := 0;
  end if;

  if v_tarjetas > 0 then
    select coalesce((select nullif(valor ->> 'tarjetaPrecio', '')::numeric from public.contenido where clave = 'checkout'), 2) into v_precio_tarjeta;
    -- Se busca por nombre: la tarjeta no es un envase y puede tener cualquier tipo.
    select * into v_articulo_tarjeta from public.articulos where nombre ilike 'tarjeta%' order by nombre limit 1;
    v_subtotal := v_subtotal + v_tarjetas * v_precio_tarjeta;
    v_lineas := v_lineas || jsonb_build_object(
      'canasta_id', null, 'nombre', 'Tarjeta navideña de dedicatoria', 'envase', null,
      'cantidad', v_tarjetas, 'precio', v_precio_tarjeta,
      'contenido', case when v_articulo_tarjeta.id is not null
        then jsonb_build_array(jsonb_build_object('articulo_id', v_articulo_tarjeta.id, 'nombre', v_articulo_tarjeta.nombre, 'cantidad', 1))
        else '[]'::jsonb end
    );
  end if;

  return jsonb_build_object(
    'nombre', v_nombre, 'dedicatoria', v_dedicatoria,
    'lineas', v_lineas, 'subtotal', v_subtotal, 'delivery', v_delivery
  );
end;
$$;

-- Guarda la orden web con los montos ya calculados por calcular_orden_web.
create or replace function public.insertar_orden_web(p jsonb, c jsonb)
returns public.ordenes
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_orden public.ordenes;
begin
  insert into public.ordenes (
    origen, cliente_nombre, cliente_email, cliente_telefono,
    comprobante_tipo, comprobante_documento, comprobante_nombre, direccion_fiscal,
    distrito, direccion, referencia, fecha_entrega, horario,
    recibe_nombre, recibe_telefono, dedicatoria, metodo_pago, subtotal, delivery
  ) values (
    'web', c ->> 'nombre',
    left(nullif(btrim(p #>> '{cliente,email}'), ''), 160),
    left(nullif(btrim(p #>> '{cliente,telefono}'), ''), 40),
    case when p #>> '{comprobante,tipo}' = 'factura' then 'factura' else 'boleta' end,
    left(nullif(btrim(p #>> '{comprobante,documento}'), ''), 20),
    left(nullif(btrim(p #>> '{comprobante,nombre}'), ''), 200),
    left(nullif(btrim(p #>> '{comprobante,direccion_fiscal}'), ''), 300),
    nullif(p #>> '{entrega,distrito}', ''),
    left(nullif(btrim(p #>> '{entrega,direccion}'), ''), 300),
    left(nullif(btrim(p #>> '{entrega,referencia}'), ''), 300),
    nullif(p #>> '{entrega,fecha}', '')::date,
    left(nullif(p #>> '{entrega,horario}', ''), 40),
    left(nullif(btrim(p #>> '{entrega,recibe_nombre}'), ''), 160),
    left(nullif(btrim(p #>> '{entrega,recibe_telefono}'), ''), 40),
    left(c ->> 'dedicatoria', 240),
    left(nullif(p ->> 'metodo_pago', ''), 40),
    (c ->> 'subtotal')::numeric,
    (c ->> 'delivery')::numeric
  ) returning * into v_orden;

  insert into public.orden_items (orden_id, canasta_id, canasta_nombre, envase_id, cantidad, precio_unitario, contenido)
  select v_orden.id, nullif(l ->> 'canasta_id', '')::uuid, l ->> 'nombre', l ->> 'envase', (l ->> 'cantidad')::integer, (l ->> 'precio')::numeric,
    case when l ? 'contenido' then l -> 'contenido' end
  from jsonb_array_elements(c -> 'lineas') as l;

  return v_orden;
end;
$$;

-- Pedido web con pago manual: se crea la orden al momento (mismo resultado que antes).
create or replace function public.crear_orden_web(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_orden public.ordenes;
begin
  v_orden := public.insertar_orden_web(p, public.calcular_orden_web(p));
  return jsonb_build_object('numero', v_orden.numero, 'total', v_orden.total);
end;
$$;

create table public.intentos_pago (
  id uuid primary key default gen_random_uuid(),
  referencia text not null unique,
  datos jsonb not null,
  calculo jsonb not null,
  total numeric(10, 2) not null,
  cliente_nombre text not null,
  cliente_email text,
  cliente_telefono text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'convertido')),
  orden_id uuid references public.ordenes (id) on delete set null,
  orden_numero text,
  mp_payment_id text,
  mp_estado text,
  mp_estado_detalle text,
  mp_actualizado_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.intentos_pago is 'Checkouts con tarjeta (Mercado Pago). Solo pasan a ser orden cuando el pago se aprueba.';

create index intentos_pago_pendientes on public.intentos_pago (created_at desc) where estado = 'pendiente';

alter table public.intentos_pago enable row level security;
create policy "Admins ven intentos de pago" on public.intentos_pago for select to authenticated using ((select public.es_admin()));
create policy "Admins borran intentos de pago" on public.intentos_pago for delete to authenticated using ((select public.es_admin()));

-- Checkout con tarjeta: valida, calcula y guarda el intento. No crea orden.
create or replace function public.crear_intento_pago(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_calculo jsonb := public.calcular_orden_web(p);
  v_intento public.intentos_pago;
begin
  insert into public.intentos_pago (referencia, datos, calculo, total, cliente_nombre, cliente_email, cliente_telefono)
  values (
    'IP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    p,
    v_calculo,
    (v_calculo ->> 'subtotal')::numeric + (v_calculo ->> 'delivery')::numeric,
    v_calculo ->> 'nombre',
    left(nullif(btrim(p #>> '{cliente,email}'), ''), 160),
    left(nullif(btrim(p #>> '{cliente,telefono}'), ''), 40)
  ) returning * into v_intento;

  return jsonb_build_object('referencia', v_intento.referencia, 'total', v_intento.total);
end;
$$;

/*
 * Registra un pago de Mercado Pago de un intento. Con un pago aprobado que
 * cubre el total, crea la orden (una sola vez) y la marca como pagada.
 * Devuelve { estado, numero, orden_id, nueva }: nueva = true solo en la
 * llamada que creó la orden (para enviar los correos una vez).
 */
create or replace function public.confirmar_intento_pago(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_intento public.intentos_pago;
  v_orden public.ordenes;
  v_pago text := left(p ->> 'payment_id', 40);
  v_estado text := left(p ->> 'estado', 40);
  v_monto numeric := coalesce((p ->> 'monto')::numeric, 0);
begin
  if v_pago is null or v_estado is null then
    raise exception 'Faltan datos del pago';
  end if;

  select * into v_intento from public.intentos_pago where referencia = p ->> 'referencia' for update;
  if not found then
    return jsonb_build_object('estado', 'intento_no_encontrado');
  end if;

  -- Ya es orden: los avisos siguientes (reembolsos, contracargos…) van a la orden.
  if v_intento.estado = 'convertido' then
    if v_intento.orden_numero is not null then
      perform public.registrar_pago_mp(jsonb_build_object(
        'numero', v_intento.orden_numero, 'payment_id', v_pago, 'estado', v_estado,
        'estado_detalle', p ->> 'estado_detalle', 'monto', v_monto));
    end if;
    return jsonb_build_object('estado', v_estado, 'numero', v_intento.orden_numero, 'orden_id', v_intento.orden_id, 'nueva', false);
  end if;

  update public.intentos_pago set
    mp_payment_id = v_pago,
    mp_estado = v_estado,
    mp_estado_detalle = left(p ->> 'estado_detalle', 80),
    mp_actualizado_at = now()
  where id = v_intento.id;

  if v_estado <> 'approved' or v_monto < v_intento.total - 0.01 then
    return jsonb_build_object('estado', v_estado, 'numero', null, 'orden_id', null, 'nueva', false);
  end if;

  v_orden := public.insertar_orden_web(v_intento.datos, v_intento.calculo);
  perform public.registrar_pago_mp(jsonb_build_object(
    'numero', v_orden.numero, 'payment_id', v_pago, 'estado', v_estado,
    'estado_detalle', p ->> 'estado_detalle', 'monto', v_monto));

  update public.intentos_pago set estado = 'convertido', orden_id = v_orden.id, orden_numero = v_orden.numero
  where id = v_intento.id;

  return jsonb_build_object('estado', v_estado, 'numero', v_orden.numero, 'orden_id', v_orden.id, 'nueva', true);
end;
$$;

-- Funciones internas: solo las llaman otras funciones security definer.
revoke execute on function public.calcular_orden_web(jsonb) from public, anon, authenticated;
revoke execute on function public.insertar_orden_web(jsonb, jsonb) from public, anon, authenticated;
-- La web (anon) crea órdenes manuales e intentos; solo el servidor confirma pagos.
grant execute on function public.crear_orden_web(jsonb) to anon, authenticated;
revoke execute on function public.crear_intento_pago(jsonb) from public;
grant execute on function public.crear_intento_pago(jsonb) to anon, authenticated;
revoke execute on function public.confirmar_intento_pago(jsonb) from public, anon, authenticated;
grant execute on function public.confirmar_intento_pago(jsonb) to service_role;
