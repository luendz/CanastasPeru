-- Condición por envase (p. ej. "Mochila: pedido mínimo 35 unidades"):
-- un texto, un activador para mostrarlo en la tienda y un mínimo de unidades por canasta
-- que se valida al agregar al carrito, en el carrito y al crear el pedido.

ALTER TABLE public.envases
  ADD COLUMN IF NOT EXISTS condicion text,
  ADD COLUMN IF NOT EXISTS mostrar_condicion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimo_unidades integer CHECK (minimo_unidades IS NULL OR minimo_unidades BETWEEN 1 AND 500);

CREATE OR REPLACE FUNCTION public.catalogo_web()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
          ), '[]'::jsonb),
          'contenido_fotos', coalesce((
            select jsonb_agg(jsonb_build_object('nombre', a.nombre, 'imagen', a.imagen, 'emoji', a.emoji, 'cantidad', r.cantidad) order by r.orden, a.nombre)
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
        select jsonb_agg(jsonb_build_object('id', t.id, 'nombre', t.nombre, 'imagen', t.imagen, 'descripcion', t.descripcion, 'recargo', t.recargo, 'condicion', t.condicion, 'mostrar_condicion', t.mostrar_condicion, 'minimo_unidades', t.minimo_unidades) order by t.orden, t.recargo)
        from public.envases t
      ), '[]'::jsonb),
      'zonas', coalesce((
        select jsonb_agg(jsonb_build_object('distrito', z.distrito, 'tarifa', z.tarifa) order by z.orden, z.distrito)
        from public.zonas_delivery z where z.activo
      ), '[]'::jsonb)
    ) as d
  )
  select d
  from datos;
$function$;
