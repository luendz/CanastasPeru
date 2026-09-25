-- ============================================================================
-- Catálogo de la web desde la base
--
-- La tienda deja de leer canastas, precios, tipos de canasta y distritos de
-- lib/mock-data.ts: ahora todo sale de aquí, así el precio mostrado y el
-- cobrado vienen de la misma fuente.
--
-- "Lo que trae" cada canasta se deriva de su receta (insumos de tipo
-- producto), la misma que usa el costeo: si cambia la receta, cambia la web.
--
-- La web lee todo con catalogo_web(): solo canastas activas y datos
-- públicos (nunca stock, costos ni compras).
-- ============================================================================

alter table public.productos
  add column descripcion text not null default '',
  add column precio_anterior numeric(10, 2) check (precio_anterior is null or precio_anterior > 0),
  add column insignia text,
  add column emoji text not null default '🧺',
  add column orden integer not null default 0,
  -- Posición de cada producto sobre la canasta (la genera /dev/composicion).
  add column composicion jsonb not null default '[]'::jsonb check (jsonb_typeof(composicion) = 'array');

alter table public.tipos_canasta
  add column imagen text,
  add column descripcion text,
  add column orden integer not null default 0;

alter table public.zonas_delivery
  add column orden integer not null default 0;

-- ---------------------------------------------------------------------------
-- Datos actuales de la web
-- ---------------------------------------------------------------------------
update public.tipos_canasta set imagen = '/canastas/cesta.png', descripcion = 'Abierta y ligera', orden = 1 where id = 'cesta-azul';
update public.tipos_canasta set imagen = '/canastas/caja.png', descripcion = 'Estampado festivo', orden = 2 where id = 'caja-navidena';
update public.tipos_canasta set imagen = '/canastas/cesta-2.png', descripcion = 'Con tapa, reutilizable', orden = 3 where id = 'cesta-gris';
update public.tipos_canasta set imagen = '/canastas/cesta-3.png', descripcion = 'Acabado tejido, con tapa', orden = 4 where id = 'cesta-ratan';

update public.zonas_delivery z set orden = o.orden
from (values ('Miraflores', 1), ('San Isidro', 2), ('Santiago de Surco', 3), ('San Borja', 4),
             ('La Molina', 5), ('Jesús María', 6), ('Lince', 7), ('San Miguel', 8)) as o(distrito, orden)
where z.distrito = o.distrito;

update public.productos set
  orden = 1,
  descripcion = 'Formato compacto, moderno y fácil de personalizar para campañas corporativas.',
  emoji = '🎁',
  precio_anterior = 99.9,
  insignia = null,
  composicion = '[{"name": "Panetón", "emoji": "🍞", "image": "/productos/paneton.png", "top": 72.4, "left": 33.3, "size": 137, "rotate": -7, "zIndex": 12}, {"name": "Galletas navideñas", "emoji": "🍪", "image": "/productos/galletas-navidad.png", "top": 80.8, "left": 52, "size": 130, "rotate": 9, "zIndex": 17}, {"name": "Leche", "emoji": "🥛", "image": "/productos/leche.png", "top": 81, "left": 41.2, "size": 93, "rotate": -5, "zIndex": 19}, {"name": "Fideos", "emoji": "🍝", "image": "/productos/fideos.png", "top": 71.5, "left": 47.9, "size": 85, "zIndex": 15}, {"name": "Azúcar", "emoji": "🧂", "image": "/productos/azucar.png", "top": 73, "left": 59, "size": 108, "rotate": 13, "zIndex": 15}]'::jsonb
where slug = 'box-navideno';

update public.productos set
  orden = 2,
  descripcion = 'Una selección práctica y tradicional para regalos familiares o empresariales.',
  emoji = '🧺',
  precio_anterior = null,
  insignia = 'Más vendida',
  composicion = '[{"name": "Panetón", "emoji": "🍞", "image": "/productos/paneton.png", "top": 73.3, "left": 40.6, "size": 134, "rotate": -7, "zIndex": 10}, {"name": "Aceite", "emoji": "🫗", "image": "/productos/aceite.png", "top": 65.6, "left": 50, "size": 133, "zIndex": 11}, {"name": "Arroz", "emoji": "🍚", "image": "/productos/arroz.png", "top": 74.7, "left": 34.4, "size": 99, "rotate": -13, "zIndex": 13}, {"name": "Azúcar", "emoji": "🧂", "image": "/productos/azucar.png", "top": 75.2, "left": 62.8, "size": 103, "rotate": 13, "zIndex": 14}, {"name": "Atún", "emoji": "🥫", "image": "/productos/atun.png", "top": 81.2, "left": 49.6, "size": 75, "zIndex": 15}, {"name": "Fideos", "emoji": "🍝", "image": "/productos/fideos.png", "top": 72.8, "left": 57.5, "size": 77, "rotate": 4, "zIndex": 9}]'::jsonb
where slug = 'canasta-clasica';

update public.productos set
  orden = 3,
  descripcion = 'Presentación premium con productos seleccionados y lista para regalar.',
  emoji = '🧺',
  precio_anterior = 179.9,
  insignia = 'Recomendada',
  composicion = '[{"name": "Panetón", "emoji": "🍞", "image": "/productos/paneton.png", "top": 76.4, "left": 41.7, "size": 145, "rotate": -6, "zIndex": 12}, {"name": "Champagne", "emoji": "🍾", "image": "/productos/chanpagne.png", "top": 64.4, "left": 50.5, "size": 160, "zIndex": 11}, {"name": "Galletas navideñas", "emoji": "🍪", "image": "/productos/galletas-navidad.png", "top": 75.6, "left": 56.4, "size": 116, "rotate": 4, "zIndex": 14}, {"name": "Duraznos", "emoji": "🍑", "image": "/productos/durazno.png", "top": 81.2, "left": 39.2, "size": 86, "rotate": -5, "zIndex": 15}, {"name": "Atún", "emoji": "🥫", "image": "/productos/atun.png", "top": 82.7, "left": 50.2, "size": 52, "zIndex": 15}, {"name": "Leche", "emoji": "🥛", "image": "/productos/leche.png", "top": 80.9, "left": 59.4, "size": 79, "rotate": 10, "zIndex": 16}]'::jsonb
where slug = 'canasta-premium';

update public.productos set
  orden = 4,
  descripcion = 'Pensada para clientes, ejecutivos y equipos que buscan una presentación especial.',
  emoji = '🧺',
  precio_anterior = null,
  insignia = 'Empresas',
  composicion = '[{"name": "Champagne", "emoji": "🍾", "image": "/productos/chanpagne.png", "top": 68.9, "left": 49.7, "size": 129, "rotate": -9, "zIndex": 11}, {"name": "Panetón", "emoji": "🍞", "image": "/productos/paneton.png", "top": 79.6, "left": 42.2, "size": 108, "rotate": -6, "zIndex": 12}, {"name": "Galletas navideñas", "emoji": "🍪", "image": "/productos/galletas-navidad.png", "top": 77.2, "left": 62.2, "size": 112, "rotate": 8, "zIndex": 13}, {"name": "Aceite", "emoji": "🫗", "image": "/productos/aceite.png", "top": 69.8, "left": 54, "size": 128, "rotate": 4, "zIndex": 13}, {"name": "Duraznos", "emoji": "🍑", "image": "/productos/durazno.png", "top": 82.7, "left": 48.8, "size": 74, "rotate": -6, "zIndex": 15}, {"name": "Leche", "emoji": "🥛", "image": "/productos/leche.png", "top": 84.3, "left": 52.3, "size": 55, "rotate": -2, "zIndex": 16}, {"name": "Atún", "emoji": "🥫", "image": "/productos/atun.png", "top": 85, "left": 58.3, "size": 52, "rotate": 5, "zIndex": 16}]'::jsonb
where slug = 'canasta-ejecutiva';

-- ---------------------------------------------------------------------------
-- Lectura pública del catálogo
-- ---------------------------------------------------------------------------
create or replace function public.catalogo_web()
returns jsonb
language sql
stable
security definer
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
        'composicion', p.composicion,
        -- Lo que trae: productos de la receta, en el orden en que se ven en la canasta.
        'contenido', coalesce((
          select jsonb_agg(i.nombre order by coalesce(c.pos, 999), i.nombre)
          from public.recetas r
          join public.insumos i on i.id = r.insumo_id and i.tipo = 'producto'
          left join lateral (
            select e.pos from jsonb_array_elements(p.composicion) with ordinality as e(item, pos)
            where e.item ->> 'name' = i.nombre limit 1
          ) c on true
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

revoke execute on function public.catalogo_web() from public;
grant execute on function public.catalogo_web() to anon, authenticated;
