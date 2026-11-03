-- El tipo de artículo "empaque" pasa a llamarse "envase", como en el panel.
-- La categoría de compras "empaque" (Empaque y presentación) es otra cosa y no cambia.

alter table public.articulos drop constraint articulos_tipo_check;
update public.articulos set tipo = 'envase' where tipo = 'empaque';
alter table public.articulos add constraint articulos_tipo_check check (tipo in ('producto', 'envase', 'otro'));

CREATE OR REPLACE FUNCTION public.crear_orden_web(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_orden public.ordenes;
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

  insert into public.orden_items (orden_id, canasta_id, canasta_nombre, envase_id, cantidad, precio_unitario, contenido)
  select v_orden.id, nullif(l ->> 'canasta_id', '')::uuid, l ->> 'nombre', l ->> 'envase', (l ->> 'cantidad')::integer, (l ->> 'precio')::numeric,
    case when l ? 'contenido' then l -> 'contenido' end
  from jsonb_array_elements(v_lineas) as l;

  return jsonb_build_object('numero', v_orden.numero, 'total', v_orden.total);
end;
$function$;
