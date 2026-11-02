-- ============================================================================
-- Descripción completa de la canasta, además de la corta.
-- La corta va debajo del nombre; la completa, debajo de la foto del producto.
-- ============================================================================

alter table public.productos add column descripcion_completa text not null default '';

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
        'descripcion_completa', p.descripcion_completa,
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
