-- ============================================================================
-- Orden de los productos de cada canasta.
--
-- - recetas.orden define en qué orden salen los productos de una canasta en el
--   panel, los PDF y "lo que trae" de la web. Se edita en Panel → Costeo.
-- - Punto de partida: el panetón primero y el resto en orden alfabético, con
--   los insumos que no son producto (empaque, otros) al final.
-- - Las cotizaciones sin aprobar con lista propia también pasan a tener el
--   panetón primero; las aprobadas y las órdenes conservan su orden.
-- ============================================================================

alter table public.recetas add column orden integer not null default 0;

with numeradas as (
  select r.producto_id, r.insumo_id,
    row_number() over (
      partition by r.producto_id
      order by translate(lower(i.nombre), 'ó', 'o') like '%paneton%' desc, i.tipo <> 'producto', i.nombre
    ) as posicion
  from public.recetas r
  join public.insumos i on i.id = r.insumo_id
)
update public.recetas r set orden = n.posicion
from numeradas n
where n.producto_id = r.producto_id and n.insumo_id = r.insumo_id;

update public.cotizacion_items it set contenido = (
  select jsonb_agg(e.item order by translate(lower(e.item ->> 'nombre'), 'ó', 'o') like '%paneton%' desc, e.pos)
  from jsonb_array_elements(it.contenido) with ordinality as e(item, pos)
)
from public.cotizaciones c
where c.id = it.cotizacion_id
  and c.estado <> 'aprobada'
  and jsonb_array_length(it.contenido) > 0;

-- "Lo que trae" en la web sigue el orden de la receta.
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
