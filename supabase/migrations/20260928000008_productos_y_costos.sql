-- ============================================================================
-- Productos y costos totales (observaciones del cliente, bloque panel).
--
-- Productos (tabla insumos):
--   - SKU, categoría y presentación de compra (unidad, paquete, caja…, con
--     cuántas unidades trae). El nombre pasa a ser la descripción completa:
--     "Lentejita Bebé Komilón 400 g".
--   - El costo es el de la compra más reciente (no un promedio) y el
--     inventario se sigue calculando con las compras y los pedidos.
--   - Si se cambia el nombre de un producto, la composición visual de las
--     canastas se actualiza sola.
--
-- Costos totales (tabla compras): 5 tipos de costo o gasto y registro por
-- comprobante, con la compra por presentación (paquete de 20 unidades a
-- S/ 60 → S/ 3 por unidad) e IGV.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Productos
-- ---------------------------------------------------------------------------
alter table public.insumos
  add column sku text,
  add column categoria text,
  add column presentacion_compra text not null default 'unidad',
  add column unidades_por_presentacion numeric(10, 2) not null default 1 check (unidades_por_presentacion > 0);

-- La "presentación" (marca y tamaño) se une al nombre: una sola descripción.
update public.insumos set nombre = nombre || ' ' || presentacion where presentacion is not null and presentacion <> '';
-- La columna queda vacía y en desuso (se borrará más adelante).
update public.insumos set presentacion = null;

-- SKU correlativo para lo ya registrado (se puede cambiar en el panel).
with numerados as (select id, row_number() over (order by tipo, nombre) as n from public.insumos)
update public.insumos i set sku = lpad(n::text, 7, '0') from numerados where numerados.id = i.id;
alter table public.insumos alter column sku set not null;
alter table public.insumos add constraint insumos_sku_key unique (sku);

update public.insumos set categoria = case tipo when 'empaque' then 'Empaque' else 'Abarrotes' end where categoria is null;
update public.insumos set presentacion_compra = 'Unidad' where presentacion_compra = 'unidad';
alter table public.insumos alter column presentacion_compra set default 'Unidad';

-- Renombrar un producto actualiza la composición visual de las canastas.
create or replace function public.renombrar_insumo_en_composicion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.nombre is distinct from old.nombre then
    update public.productos p
    set composicion = (
      select coalesce(jsonb_agg(
        case when e ->> 'name' = old.nombre then jsonb_set(e, '{name}', to_jsonb(new.nombre)) else e end
        order by pos), '[]'::jsonb)
      from jsonb_array_elements(p.composicion) with ordinality as x(e, pos)
    )
    where p.composicion @> jsonb_build_array(jsonb_build_object('name', old.nombre));
  end if;
  return new;
end;
$$;
revoke execute on function public.renombrar_insumo_en_composicion() from public, anon, authenticated;

create trigger insumos_renombrar_composicion
  after update of nombre on public.insumos
  for each row execute function public.renombrar_insumo_en_composicion();

-- ---------------------------------------------------------------------------
-- Costos totales
-- ---------------------------------------------------------------------------
alter table public.compras drop constraint compras_categoria_check;
do $$
declare c record;
begin
  -- La regla antigua "insumo solo en producción" no tiene nombre fijo.
  for c in select conname from pg_constraint where conrelid = 'public.compras'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%insumo_id IS NULL%' loop
    execute format('alter table public.compras drop constraint %I', c.conname);
  end loop;
end $$;

update public.compras set categoria = case
  when categoria = 'marketing' then 'marketing'
  when subcategoria ilike 'empaque%' or subcategoria ilike 'present%' then 'empaque'
  when subcategoria ilike 'log%' or subcategoria ilike 'movil%' or subcategoria ilike 'transp%' then 'logistica'
  when subcategoria ilike 'admin%' then 'administrativos'
  else 'mercaderia'
end;

alter table public.compras add constraint compras_categoria_check
  check (categoria in ('mercaderia', 'empaque', 'logistica', 'marketing', 'administrativos'));

alter table public.compras
  add column tipo_documento text not null default 'factura' check (tipo_documento in ('factura', 'boleta', 'recibo', 'nota_venta', 'sin_comprobante')),
  add column ruc_proveedor text,
  add column presentacion text not null default 'Unidad',
  add column cantidad_presentaciones numeric(12, 2),
  add column unidades_por_presentacion numeric(10, 2) not null default 1 check (unidades_por_presentacion > 0),
  add column precio_presentacion numeric(12, 4),
  add column incluye_igv boolean not null default true,
  add column afecto_igv boolean not null default true;

update public.compras set cantidad_presentaciones = cantidad, precio_presentacion = costo_unitario where cantidad_presentaciones is null;

-- Costo unitario con más decimales (S/ 17 ÷ 6 = 2.833333…), para que el
-- total calculado coincida con lo pagado. Las vistas dependen del total.
drop view public.v_costeo_canastas;
drop view public.v_costo_insumos;
alter table public.compras drop column total;
alter table public.compras alter column costo_unitario type numeric(14, 6);
alter table public.compras add column total numeric(14, 2) generated always as (round(cantidad * costo_unitario, 2)) stored;

-- Costo del producto: el de la compra más reciente.
create view public.v_costo_insumos with (security_invoker = true) as
select
  i.id as insumo_id,
  i.nombre,
  i.unidad,
  i.tipo,
  coalesce(sum(c.cantidad), 0) as cantidad_comprada,
  case when coalesce(sum(c.cantidad), 0) > 0 then round(sum(c.total) / sum(c.cantidad), 2) end as costo_promedio,
  (select round(u.total / u.cantidad, 4) from public.compras u where u.insumo_id = i.id order by u.fecha desc, u.created_at desc limit 1) as costo_actual
from public.insumos i
left join public.compras c on c.insumo_id = i.id
group by i.id;

create view public.v_costeo_canastas with (security_invoker = true) as
select
  p.id as producto_id,
  p.slug,
  p.nombre,
  p.precio,
  round(coalesce(sum(r.cantidad * ci.costo_actual), 0), 2) as costo,
  round(p.precio - coalesce(sum(r.cantidad * ci.costo_actual), 0), 2) as margen,
  case when p.precio > 0 then round((p.precio - coalesce(sum(r.cantidad * ci.costo_actual), 0)) / p.precio * 100, 1) end as margen_pct,
  count(r.insumo_id) filter (where ci.costo_actual is null) as insumos_sin_costo
from public.productos p
left join public.recetas r on r.producto_id = p.id
left join public.v_costo_insumos ci on ci.insumo_id = r.insumo_id
group by p.id;
