-- ============================================================================
-- Todo administrable desde el panel: imágenes y contenido de la web.
--
-- 1. Biblioteca de medios: bucket público "media" en Supabase Storage.
--    Cualquiera puede ver las imágenes (son de la web), pero solo los
--    administradores pueden subir, reemplazar, listar o borrar.
-- 2. Insumos con imagen y emoji: la composición de cada canasta toma la
--    imagen del insumo, así cambiar una foto la cambia en todas las canastas.
-- 3. Contenido de la web (textos, marca, contacto, checkout, cotización) en
--    la tabla contenido, una fila por sección, de lectura pública.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Biblioteca de medios
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins listan medios" on storage.objects
  for select to authenticated using (bucket_id = 'media' and (select public.es_admin()));
create policy "Admins suben medios" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.es_admin()));
create policy "Admins reemplazan medios" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.es_admin())) with check (bucket_id = 'media' and (select public.es_admin()));
create policy "Admins borran medios" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.es_admin()));

-- ---------------------------------------------------------------------------
-- 2. Imagen y emoji de cada insumo
-- ---------------------------------------------------------------------------
alter table public.insumos
  add column imagen text,
  add column emoji text not null default '📦';

update public.insumos i set imagen = v.imagen, emoji = v.emoji
from (values
  ('Panetón', '/productos/paneton.png', '🍞'),
  ('Champagne', '/productos/chanpagne.png', '🍾'),
  ('Galletas navideñas', '/productos/galletas-navidad.png', '🍪'),
  ('Duraznos', '/productos/durazno.png', '🍑'),
  ('Atún', '/productos/atun.png', '🥫'),
  ('Leche', '/productos/leche.png', '🥛'),
  ('Aceite', '/productos/aceite.png', '🫗'),
  ('Arroz', '/productos/arroz.png', '🍚'),
  ('Azúcar', '/productos/azucar.png', '🧂'),
  ('Fideos', '/productos/fideos.png', '🍝'),
  ('Cesta azul', '/canastas/cesta.png', '🧺'),
  ('Caja navideña', '/canastas/caja.png', '🎁'),
  ('Cesta gris con tapa', '/canastas/cesta-2.png', '🧺'),
  ('Cesta símil ratán', '/canastas/cesta-3.png', '🧺'),
  ('Tarjeta de dedicatoria', null, '💌'),
  ('Cinta y lazo', null, '🎀')
) as v(nombre, imagen, emoji)
where i.nombre = v.nombre;

-- La web lee la composición con la imagen y el emoji actuales de cada insumo.
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

-- ---------------------------------------------------------------------------
-- 3. Contenido de la web
-- ---------------------------------------------------------------------------
create table public.contenido (
  clave text primary key check (clave in ('marca', 'anuncios', 'portada', 'catalogo', 'producto', 'contacto', 'checkout', 'cotizacion', 'pie')),
  valor jsonb not null default '{}'::jsonb check (jsonb_typeof(valor) = 'object'),
  updated_at timestamptz not null default now()
);
create trigger contenido_updated_at before update on public.contenido
  for each row execute function public.tocar_updated_at();

alter table public.contenido enable row level security;
create policy "Contenido visible" on public.contenido for select to anon, authenticated using (true);
create policy "Admins crean contenido" on public.contenido for insert to authenticated with check ((select public.es_admin()));
create policy "Admins editan contenido" on public.contenido for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));

-- Las secciones empiezan vacías: la web usa sus textos por defecto hasta que
-- se edite algo en el panel (lib/contenido.ts combina ambos).
insert into public.contenido (clave) values
  ('marca'), ('anuncios'), ('portada'), ('catalogo'), ('producto'), ('contacto'), ('checkout'), ('cotizacion'), ('pie');
