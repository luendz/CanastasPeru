-- ============================================================================
-- Web: catálogo por líneas, tarjeta navideña en el carrito y cotización.
--
-- 1. Canastas que faltan (Premium 2-4, Ejecutiva 1-4, Box Navideño 1-4):
--    se crean ocultas y con precio 0, para completarlas en el panel.
-- 2. Tarjeta navideña: el pedido web puede llevar N tarjetas con
--    dedicatoria. El precio lo fija el panel (Contenido → Pago y entrega),
--    nunca el navegador; la tarjeta descuenta su insumo del inventario.
-- 3. Cotización web con distrito.
-- 4. Sección de contenido "nosotros".
-- ============================================================================

-- 1. Canastas pendientes de completar
insert into public.productos (slug, nombre, categoria, precio, tipo_canasta_base, activo, orden, descripcion)
select x.slug, x.nombre, x.categoria, 0, 'caja-navidena', false, x.orden, ''
from (values
  ('canasta-premium-2', 'Canasta Premium 2', 'Premium', 6),
  ('canasta-premium-3', 'Canasta Premium 3', 'Premium', 7),
  ('canasta-premium-4', 'Canasta Premium 4', 'Premium', 8),
  ('canasta-ejecutiva-1', 'Canasta Ejecutiva 1', 'Ejecutiva', 9),
  ('canasta-ejecutiva-2', 'Canasta Ejecutiva 2', 'Ejecutiva', 10),
  ('canasta-ejecutiva-3', 'Canasta Ejecutiva 3', 'Ejecutiva', 11),
  ('canasta-ejecutiva-4', 'Canasta Ejecutiva 4', 'Ejecutiva', 12),
  ('box-navideno-1', 'Box Navideño 1', 'Box Navideño', 13),
  ('box-navideno-2', 'Box Navideño 2', 'Box Navideño', 14),
  ('box-navideno-3', 'Box Navideño 3', 'Box Navideño', 15),
  ('box-navideno-4', 'Box Navideño 4', 'Box Navideño', 16)
) as x(slug, nombre, categoria, orden)
where not exists (select 1 from public.productos p where p.slug = x.slug or p.nombre = x.nombre);

-- 2. Pedido web con tarjetas navideñas
create or replace function public.crear_orden_web(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_orden public.ordenes;
  v_item jsonb;
  v_producto public.productos;
  v_tipo text;
  v_cantidad integer;
  v_precio numeric;
  v_lineas jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_delivery numeric := 0;
  v_items jsonb := coalesce(p -> 'items', '[]'::jsonb);
  v_nombre text := nullif(btrim(p #>> '{cliente,nombre}'), '');
  v_tarjetas integer := coalesce(nullif(p #>> '{tarjetas,cantidad}', '')::integer, 0);
  v_precio_tarjeta numeric;
  v_insumo_tarjeta public.insumos;
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
    select * into v_producto from public.productos where slug = v_item ->> 'slug' and activo;
    if not found then
      raise exception 'Producto no disponible: %', v_item ->> 'slug';
    end if;
    v_cantidad := (v_item ->> 'cantidad')::integer;
    if v_cantidad is null or v_cantidad < 1 or v_cantidad > 500 then
      raise exception 'Cantidad inválida para %', v_producto.nombre;
    end if;
    v_tipo := coalesce(nullif(v_item ->> 'tipo_canasta', ''), v_producto.tipo_canasta_base);
    if not exists (select 1 from public.tipos_canasta where id = v_tipo) then
      raise exception 'Tipo de canasta inválido';
    end if;
    v_precio := public.precio_canasta(v_producto.id, v_tipo);
    v_subtotal := v_subtotal + v_cantidad * v_precio;
    v_lineas := v_lineas || jsonb_build_object(
      'producto_id', v_producto.id, 'nombre', v_producto.nombre, 'tipo', v_tipo,
      'cantidad', v_cantidad, 'precio', v_precio
    );
  end loop;

  -- Tarjetas: precio del panel (por defecto S/ 2.00) y su insumo, si existe.
  if v_tarjetas > 0 then
    select coalesce((select nullif(valor ->> 'tarjetaPrecio', '')::numeric from public.contenido where clave = 'checkout'), 2) into v_precio_tarjeta;
    select * into v_insumo_tarjeta from public.insumos where tipo = 'empaque' and nombre ilike 'tarjeta%' order by nombre limit 1;
    v_subtotal := v_subtotal + v_tarjetas * v_precio_tarjeta;
    v_lineas := v_lineas || jsonb_build_object(
      'producto_id', null, 'nombre', 'Tarjeta navideña de dedicatoria', 'tipo', null,
      'cantidad', v_tarjetas, 'precio', v_precio_tarjeta,
      'contenido', case when v_insumo_tarjeta.id is not null
        then jsonb_build_array(jsonb_build_object('insumo_id', v_insumo_tarjeta.id, 'nombre', v_insumo_tarjeta.nombre, 'cantidad', 1))
        else '[]'::jsonb end
    );
  end if;

  insert into public.ordenes (
    origen, cliente_nombre, cliente_email, cliente_telefono,
    comprobante_tipo, comprobante_documento, comprobante_nombre, direccion_fiscal,
    distrito, direccion, referencia, fecha_entrega, horario,
    recibe_nombre, recibe_telefono, dedicatoria, metodo_pago, subtotal, delivery
  ) values (
    'web', v_nombre,
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
    left(v_dedicatoria, 240),
    left(nullif(p ->> 'metodo_pago', ''), 40),
    v_subtotal,
    v_delivery
  ) returning * into v_orden;

  insert into public.orden_items (orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario, contenido)
  select v_orden.id, nullif(l ->> 'producto_id', '')::uuid, l ->> 'nombre', l ->> 'tipo', (l ->> 'cantidad')::integer, (l ->> 'precio')::numeric,
    case when l ? 'contenido' then l -> 'contenido' end
  from jsonb_array_elements(v_lineas) as l;

  return jsonb_build_object('numero', v_orden.numero, 'total', v_orden.total);
end;
$$;

-- 3. Cotización web con distrito (la referencia va junto a la dirección)
create or replace function public.crear_cotizacion_web(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero text;
  v_empresa text := nullif(btrim(p ->> 'empresa'), '');
  v_contacto text := nullif(btrim(p ->> 'contacto'), '');
begin
  if v_empresa is null or v_contacto is null then
    raise exception 'Faltan la empresa o el contacto';
  end if;

  insert into public.cotizaciones (
    empresa, ruc, contacto, cargo, email, telefono, cantidad_estimada, presupuesto,
    fecha_requerida, lugar_entrega, distrito, canastas_base, personalizacion, requerimientos
  ) values (
    left(v_empresa, 200),
    left(nullif(btrim(p ->> 'ruc'), ''), 11),
    left(v_contacto, 160),
    left(nullif(btrim(p ->> 'cargo'), ''), 120),
    left(nullif(btrim(p ->> 'email'), ''), 160),
    left(nullif(btrim(p ->> 'telefono'), ''), 40),
    nullif(p ->> 'cantidad_estimada', '')::integer,
    left(nullif(p ->> 'presupuesto', ''), 60),
    nullif(p ->> 'fecha_requerida', '')::date,
    left(nullif(btrim(p ->> 'lugar_entrega'), ''), 300),
    left(nullif(btrim(p ->> 'distrito'), ''), 120),
    coalesce(array(select left(x, 120) from jsonb_array_elements_text(coalesce(p -> 'canastas_base', '[]')) x limit 10), '{}'),
    coalesce(array(select left(x, 120) from jsonb_array_elements_text(coalesce(p -> 'personalizacion', '[]')) x limit 10), '{}'),
    left(nullif(btrim(p ->> 'requerimientos'), ''), 3000)
  ) returning numero into v_numero;

  return jsonb_build_object('numero', v_numero);
end;
$$;

-- 4. Página "Nosotros" editable
alter table public.contenido drop constraint contenido_clave_check;
alter table public.contenido add constraint contenido_clave_check
  check (clave in ('marca', 'anuncios', 'portada', 'catalogo', 'producto', 'contacto', 'checkout', 'cotizacion', 'pie', 'nosotros'));
insert into public.contenido (clave) values ('nosotros') on conflict (clave) do nothing;
