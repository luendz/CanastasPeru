-- ============================================================================
-- Nombres que dicen lo que guarda cada tabla:
--   productos      -> canastas
--   tipos_canasta  -> envases
--   insumos        -> articulos
--   recetas        -> canasta_articulos
-- Las columnas, vistas y funciones que los mencionan cambian con ellas.
--
-- catalogo_web y crear_orden_web siguen aceptando los nombres antiguos para que
-- la tienda no falle mientras se publica el código nuevo. La migración 21 los quita.
-- ============================================================================

-- ---------------------------------------------------------------- Tablas
alter table public.productos rename to canastas;
alter table public.tipos_canasta rename to envases;
alter table public.insumos rename to articulos;
alter table public.recetas rename to canasta_articulos;

-- ---------------------------------------------------------------- Columnas
alter table public.canastas rename column tipo_canasta_base to envase_base_id;
alter table public.envases rename column insumo_id to articulo_id;
alter table public.canasta_articulos rename column producto_id to canasta_id;
alter table public.canasta_articulos rename column insumo_id to articulo_id;
alter table public.canasta_envases rename column producto_id to canasta_id;
alter table public.canasta_envases rename column tipo_canasta to envase_id;
alter table public.compras rename column insumo_id to articulo_id;
alter table public.orden_items rename column producto_id to canasta_id;
alter table public.orden_items rename column producto_nombre to canasta_nombre;
alter table public.orden_items rename column tipo_canasta to envase_id;
alter table public.cotizacion_items rename column producto_id to canasta_id;
alter table public.cotizacion_items rename column producto_nombre to canasta_nombre;
alter table public.cotizacion_items rename column tipo_canasta to envase_id;

-- ---------------------------------------------------------------- Restricciones, índices y políticas
do $$
declare
  r record;
  nuevo text;
begin
  for r in
    select c.conrelid::regclass as tabla, c.conname as nombre
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where n.nspname = 'public' and c.conname ~ '(productos|tipos_canasta|tipo_canasta|insumo|recetas|producto)'
  loop
    nuevo := replace(replace(replace(replace(replace(replace(replace(replace(r.nombre,
      'tipos_canasta', 'envases'), 'tipo_canasta_base', 'envase_base_id'), 'tipo_canasta', 'envase_id'),
      'productos', 'canastas'), 'recetas', 'canasta_articulos'), 'insumos', 'articulos'),
      'insumo', 'articulo'), 'producto', 'canasta');
    execute format('alter table %s rename constraint %I to %I', r.tabla, r.nombre, nuevo);
  end loop;

  for r in
    select i.indexname as nombre
    from pg_indexes i
    where i.schemaname = 'public'
      and i.indexname ~ '(productos|tipos_canasta|tipo_canasta|insumo|recetas|producto)'
  loop
    nuevo := replace(replace(replace(replace(replace(replace(replace(replace(r.nombre,
      'tipos_canasta', 'envases'), 'tipo_canasta_base', 'envase_base_id'), 'tipo_canasta', 'envase_id'),
      'productos', 'canastas'), 'recetas', 'canasta_articulos'), 'insumos', 'articulos'),
      'insumo', 'articulo'), 'producto', 'canasta');
    execute format('alter index public.%I rename to %I', r.nombre, nuevo);
  end loop;
end $$;

alter policy "Admins gestionan productos" on public.canastas rename to "Admins gestionan canastas";
alter policy "Productos activos visibles" on public.canastas rename to "Canastas activas visibles";
alter policy "Admins gestionan tipos" on public.envases rename to "Admins gestionan envases";
alter policy "Admins gestionan insumos" on public.articulos rename to "Admins gestionan articulos";
alter policy "Admins gestionan recetas" on public.canasta_articulos rename to "Admins gestionan el armado";

-- ---------------------------------------------------------------- Contenido guardado en las líneas
update public.orden_items
set contenido = (
  select jsonb_agg(
    case when e ? 'insumo_id' then (e - 'insumo_id') || jsonb_build_object('articulo_id', e -> 'insumo_id') else e end
    order by pos)
  from jsonb_array_elements(contenido) with ordinality as x(e, pos)
)
where contenido::text like '%insumo_id%';

update public.cotizacion_items
set contenido = (
  select jsonb_agg(
    case when e ? 'insumo_id' then (e - 'insumo_id') || jsonb_build_object('articulo_id', e -> 'insumo_id') else e end
    order by pos)
  from jsonb_array_elements(contenido) with ordinality as x(e, pos)
)
where contenido::text like '%insumo_id%';

-- ---------------------------------------------------------------- Vistas
alter view public.v_consumo_insumos rename to v_consumo_articulos;
alter view public.v_consumo_articulos rename column insumo_id to articulo_id;

alter view public.v_costo_insumos rename to v_costo_articulos;
alter view public.v_costo_articulos rename column insumo_id to articulo_id;

alter view public.v_receta_canasta rename to v_armado_canasta;
alter view public.v_armado_canasta rename column producto_id to canasta_id;

alter view public.v_inventario rename column insumo_id to articulo_id;

alter view public.v_costeo_canastas rename column producto_id to canasta_id;
alter view public.v_costeo_canastas rename column insumos_sin_costo to articulos_sin_costo;

alter view public.v_envases_canasta rename column producto_id to canasta_id;
alter view public.v_envases_canasta rename column tipo_canasta to envase_id;
alter view public.v_envases_canasta rename column tipo_nombre to envase_nombre;
alter view public.v_envases_canasta rename column insumo_id to articulo_id;
alter view public.v_envases_canasta rename column insumo_nombre to articulo_nombre;

-- El consumo lee del contenido guardado, que ahora usa articulo_id.
create or replace view public.v_consumo_articulos with (security_invoker = true) as
select articulo_id, estado, sum(cantidad) as cantidad
from (
  select r.articulo_id, o.estado, oi.cantidad::numeric * r.cantidad as cantidad
  from public.orden_items oi
  join public.ordenes o on o.id = oi.orden_id
  join public.canasta_articulos r on r.canasta_id = oi.canasta_id
  where o.estado <> 'anulada' and oi.contenido is null
  union all
  select (e.value ->> 'articulo_id')::uuid, o.estado, oi.cantidad::numeric * (e.value ->> 'cantidad')::numeric
  from public.orden_items oi
  join public.ordenes o on o.id = oi.orden_id
  cross join lateral jsonb_array_elements(oi.contenido) e(value)
  where o.estado <> 'anulada' and oi.contenido is not null and (e.value ->> 'articulo_id') is not null
) x
group by articulo_id, estado;

-- ---------------------------------------------------------------- Funciones
drop function public.precio_canasta(uuid, text);

create function public.precio_canasta(p_canasta_id uuid, p_envase_id text)
returns numeric
language sql
stable
set search_path to ''
as $function$
  select coalesce(
    (select e.precio from public.canasta_envases e where e.canasta_id = c.id and e.envase_id = p_envase_id),
    c.precio + coalesce(sel.recargo, base.recargo) - base.recargo
  )
  from public.canastas c
  join public.envases base on base.id = c.envase_base_id
  left join public.envases sel on sel.id = p_envase_id
  where c.id = p_canasta_id;
$function$;

revoke all on function public.precio_canasta(uuid, text) from public, anon;
grant execute on function public.precio_canasta(uuid, text) to authenticated, service_role;

alter function public.renombrar_insumo_en_composicion() rename to renombrar_articulo_en_composicion;
alter trigger insumos_renombrar_composicion on public.articulos rename to articulos_renombrar_composicion;

create or replace function public.renombrar_articulo_en_composicion()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.nombre is distinct from old.nombre then
    update public.canastas c
    set composicion = (
      select coalesce(jsonb_agg(
        case when e ->> 'name' = old.nombre then jsonb_set(e, '{name}', to_jsonb(new.nombre)) else e end
        order by pos), '[]'::jsonb)
      from jsonb_array_elements(c.composicion) with ordinality as x(e, pos)
    )
    where c.composicion @> jsonb_build_array(jsonb_build_object('name', old.nombre));
  end if;
  return new;
end;
$function$;

create or replace function public.aprobar_cotizacion(p_cotizacion_id uuid)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
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

  insert into public.orden_items (orden_id, canasta_id, canasta_nombre, envase_id, cantidad, precio_unitario, contenido)
  select v_orden_id, canasta_id, canasta_nombre, envase_id, cantidad, precio_unitario, contenido
  from public.cotizacion_items where cotizacion_id = v_cot.id;

  update public.cotizaciones set estado = 'aprobada' where id = v_cot.id;
  return v_orden_id;
end;
$function$;

create or replace function public.catalogo_web()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  with datos as (
    select jsonb_build_object(
      'canastas', coalesce((
        select jsonb_agg(jsonb_build_object(
          'slug', c.slug,
          'nombre', c.nombre,
          'categoria', c.categoria,
          'precio', c.precio,
          'precio_anterior', c.precio_anterior,
          'insignia', c.insignia,
          'emoji', c.emoji,
          'descripcion', c.descripcion,
          'descripcion_completa', c.descripcion_completa,
          'envase_base_id', c.envase_base_id,
          'tipo_canasta_base', c.envase_base_id,
          'imagen_base', t.imagen,
          'ajuste_envase', c.ajuste_envase,
          'envases', coalesce((
            select jsonb_agg(jsonb_build_object('id', e.envase_id, 'precio', e.precio) order by e.orden, e.envase_id)
            from public.canasta_envases e
            where e.canasta_id = c.id and e.visible
          ), '[]'::jsonb),
          'composicion', coalesce((
            select jsonb_agg(
              e.item
                || case when art.imagen is not null then jsonb_build_object('image', art.imagen) else '{}'::jsonb end
                || case when art.emoji is not null then jsonb_build_object('emoji', art.emoji) else '{}'::jsonb end
              order by e.pos)
            from jsonb_array_elements(c.composicion) with ordinality as e(item, pos)
            left join public.articulos art on art.nombre = e.item ->> 'name'
          ), '[]'::jsonb),
          'contenido', coalesce((
            select jsonb_agg(a.nombre order by r.orden, a.nombre)
            from public.canasta_articulos r
            join public.articulos a on a.id = r.articulo_id and a.tipo = 'producto'
            where r.canasta_id = c.id
          ), '[]'::jsonb)
        ) order by c.orden, c.precio)
        from public.canastas c
        join public.envases t on t.id = c.envase_base_id
        where c.activo
      ), '[]'::jsonb),
      'envases', coalesce((
        select jsonb_agg(jsonb_build_object('id', t.id, 'nombre', t.nombre, 'imagen', t.imagen, 'descripcion', t.descripcion, 'recargo', t.recargo) order by t.orden, t.recargo)
        from public.envases t
      ), '[]'::jsonb),
      'zonas', coalesce((
        select jsonb_agg(jsonb_build_object('distrito', z.distrito, 'tarifa', z.tarifa) order by z.orden, z.distrito)
        from public.zonas_delivery z where z.activo
      ), '[]'::jsonb)
    ) as d
  )
  select d || jsonb_build_object('productos', d -> 'canastas', 'tipos_canasta', d -> 'envases')
  from datos;
$function$;

create or replace function public.crear_orden_web(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
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
    v_envase := coalesce(nullif(v_item ->> 'envase_id', ''), nullif(v_item ->> 'tipo_canasta', ''), v_canasta.envase_base_id);
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
    select * into v_articulo_tarjeta from public.articulos where tipo = 'empaque' and nombre ilike 'tarjeta%' order by nombre limit 1;
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
