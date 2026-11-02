-- ============================================================================
-- Envases y precios por canasta.
--
-- - Cada canasta tiene sus envases, cada uno con su precio de venta. El precio
--   ya no sale de un recargo igual para todas las canastas.
-- - El envase se relaciona con su producto (insumo de tipo empaque), de donde
--   sale el costo de presentación: última factura o costo de referencia. Si no
--   hay ninguno, se usa el costo manual de esa canasta.
-- - Costo de la canasta = receta + presentación del envase. Es el único costeo:
--   productos.costo_viveres y costo_presentacion dejan de usarse.
-- - Punto de partida: los mismos envases y los mismos precios de la tienda.
-- ============================================================================

alter table public.tipos_canasta add column insumo_id uuid references public.insumos (id) on delete set null;

update public.tipos_canasta t set insumo_id = i.id
from public.insumos i
where i.tipo = 'empaque' and (t.id, i.nombre) in (
  ('caja-navidena', 'Caja navideña mediana'),
  ('cesta-gris', 'Cesta gris con tapa'),
  ('cesta-ratan', 'Cesta símil ratán')
);

create table public.canasta_envases (
  producto_id uuid not null references public.productos (id) on delete cascade,
  tipo_canasta text not null references public.tipos_canasta (id) on delete restrict,
  precio numeric(10, 2) not null check (precio >= 0),
  costo_manual numeric(10, 2) check (costo_manual is null or costo_manual >= 0),
  visible boolean not null default true,
  orden integer not null default 0,
  primary key (producto_id, tipo_canasta)
);
create index canasta_envases_tipo_idx on public.canasta_envases (tipo_canasta);

alter table public.canasta_envases enable row level security;
create policy "Admins gestionan envases de canasta" on public.canasta_envases for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Mismos precios de hoy: el envase principal primero, y su costo manual se conserva.
insert into public.canasta_envases (producto_id, tipo_canasta, precio, costo_manual, orden)
select p.id, t.id, p.precio + t.recargo - base.recargo,
  case when t.id = p.tipo_canasta_base then p.costo_presentacion end,
  case when t.id = p.tipo_canasta_base then 0 else t.orden end
from public.productos p
join public.tipos_canasta base on base.id = p.tipo_canasta_base
cross join public.tipos_canasta t;

-- Precio con el envase elegido. Un envase que la canasta no tiene (solo posible
-- en cotizaciones) se sigue calculando con la diferencia de recargos.
create or replace function public.precio_canasta(p_producto_id uuid, p_tipo text)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select e.precio from public.canasta_envases e where e.producto_id = p.id and e.tipo_canasta = p_tipo),
    p.precio + coalesce(sel.recargo, base.recargo) - base.recargo
  )
  from public.productos p
  join public.tipos_canasta base on base.id = p.tipo_canasta_base
  left join public.tipos_canasta sel on sel.id = p_tipo
  where p.id = p_producto_id;
$$;

-- Costo de los productos de cada canasta: última compra o costo de referencia.
create view public.v_receta_canasta with (security_invoker = true) as
select
  p.id as producto_id,
  round(coalesce(sum(r.cantidad * coalesce(ci.costo_actual, i.costo_referencia)), 0), 2) as costo,
  count(r.insumo_id) filter (where coalesce(ci.costo_actual, i.costo_referencia) is null) as sin_costo
from public.productos p
left join public.recetas r on r.producto_id = p.id
left join public.insumos i on i.id = r.insumo_id
left join public.v_costo_insumos ci on ci.insumo_id = r.insumo_id
group by p.id;

-- Cálculo de cada envase de cada canasta.
create view public.v_envases_canasta with (security_invoker = true) as
with envases as (
  select
    e.producto_id, e.tipo_canasta, e.precio, e.costo_manual, e.visible, e.orden,
    t.nombre as tipo_nombre, t.insumo_id, coalesce(t.imagen, i.imagen) as imagen, i.nombre as insumo_nombre,
    round(coalesce(ci.costo_actual, i.costo_referencia), 2) as costo_producto,
    rc.costo as costo_receta,
    (e.tipo_canasta = p.tipo_canasta_base) as principal
  from public.canasta_envases e
  join public.productos p on p.id = e.producto_id
  join public.tipos_canasta t on t.id = e.tipo_canasta
  join public.v_receta_canasta rc on rc.producto_id = e.producto_id
  left join public.insumos i on i.id = t.insumo_id
  left join public.v_costo_insumos ci on ci.insumo_id = t.insumo_id
),
con_costo as (
  select *, coalesce(costo_producto, costo_manual) as costo_presentacion from envases
)
select
  producto_id, tipo_canasta, tipo_nombre, insumo_id, insumo_nombre, imagen, precio, costo_manual, visible, orden, principal,
  costo_presentacion,
  case when costo_producto is not null then 'producto' when costo_manual is not null then 'manual' end as fuente_costo,
  costo_receta,
  costo_receta + costo_presentacion as costo_total,
  precio - (costo_receta + costo_presentacion) as utilidad,
  case when precio > 0 then round((precio - (costo_receta + costo_presentacion)) / precio * 100, 1) end as margen_pct
from con_costo;

-- El costeo de cada canasta es el de su envase principal.
create or replace view public.v_costeo_canastas with (security_invoker = true) as
with base as (
  select
    p.id, p.slug, p.nombre, p.precio,
    rc.costo as costo_receta, rc.sin_costo,
    coalesce(e.costo_presentacion, 0) as presentacion
  from public.productos p
  join public.v_receta_canasta rc on rc.producto_id = p.id
  left join public.v_envases_canasta e on e.producto_id = p.id and e.principal
)
select
  id as producto_id,
  slug,
  nombre,
  precio,
  (costo_receta + presentacion)::numeric as costo,
  round(precio - (costo_receta + presentacion), 2) as margen,
  case when precio > 0 then round((precio - (costo_receta + presentacion)) / precio * 100, 1) end as margen_pct,
  sin_costo as insumos_sin_costo,
  costo_receta::numeric(10, 2) as costo_viveres,
  presentacion::numeric(10, 2) as costo_presentacion,
  costo_receta,
  'receta'::text as fuente
from base;

revoke all on public.v_receta_canasta, public.v_envases_canasta from anon;
grant select on public.v_receta_canasta, public.v_envases_canasta to authenticated;

-- La web solo vende los envases visibles de cada canasta, a su precio.
create or replace function public.catalogo_web()
returns jsonb
language sql
stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'productos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', p.slug,
        'nombre', p.nombre,
        'categoria', p.categoria,
        'precio', p.precio,
        'precio_anterior', p.precio_anterior,
        'insignia', p.insignia,
        'emoji', p.emoji,
        'descripcion', p.descripcion,
        'tipo_canasta_base', p.tipo_canasta_base,
        'imagen_base', t.imagen,
        'envases', coalesce((
          select jsonb_agg(jsonb_build_object('id', e.tipo_canasta, 'precio', e.precio) order by e.orden, e.tipo_canasta)
          from public.canasta_envases e
          where e.producto_id = p.id and e.visible
        ), '[]'::jsonb),
        'composicion', coalesce((
          select jsonb_agg(
            e.item
              || case when ins.imagen is not null then jsonb_build_object('image', ins.imagen) else '{}'::jsonb end
              || case when ins.emoji is not null then jsonb_build_object('emoji', ins.emoji) else '{}'::jsonb end
            order by e.pos)
          from jsonb_array_elements(p.composicion) with ordinality as e(item, pos)
          left join public.insumos ins on ins.nombre = e.item ->> 'name'
        ), '[]'::jsonb),
        'contenido', coalesce((
          select jsonb_agg(i.nombre order by r.orden, i.nombre)
          from public.recetas r
          join public.insumos i on i.id = r.insumo_id and i.tipo = 'producto'
          where r.producto_id = p.id
        ), '[]'::jsonb)
      ) order by p.orden, p.precio)
      from public.productos p
      join public.tipos_canasta t on t.id = p.tipo_canasta_base
      where p.activo
    ), '[]'::jsonb),
    'tipos_canasta', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'nombre', t.nombre, 'imagen', t.imagen, 'descripcion', t.descripcion, 'recargo', t.recargo) order by t.orden, t.recargo)
      from public.tipos_canasta t
    ), '[]'::jsonb),
    'zonas', coalesce((
      select jsonb_agg(jsonb_build_object('distrito', z.distrito, 'tarifa', z.tarifa) order by z.orden, z.distrito)
      from public.zonas_delivery z where z.activo
    ), '[]'::jsonb)
  );
$$;

-- El pedido solo acepta un envase visible de esa canasta.
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
  v_unidades integer := 0;
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
    if not exists (select 1 from public.canasta_envases where producto_id = v_producto.id and tipo_canasta = v_tipo and visible) then
      raise exception 'Envase no disponible para %', v_producto.nombre;
    end if;
    v_precio := public.precio_canasta(v_producto.id, v_tipo);
    v_subtotal := v_subtotal + v_cantidad * v_precio;
    v_unidades := v_unidades + v_cantidad;
    v_lineas := v_lineas || jsonb_build_object(
      'producto_id', v_producto.id, 'nombre', v_producto.nombre, 'tipo', v_tipo,
      'cantidad', v_cantidad, 'precio', v_precio
    );
  end loop;

  -- Más de 100 canastas: delivery gratis.
  if v_unidades > 100 then
    v_delivery := 0;
  end if;

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
