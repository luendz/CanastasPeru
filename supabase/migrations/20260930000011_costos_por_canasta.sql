-- ============================================================================
-- Costo de cada canasta según la tabla del cliente.
--
-- Cada canasta guarda su costo de víveres y su costo de presentación
-- (empaque, cinta, tarjeta…), que se editan en Panel → Catálogo. El costeo
-- usa esos montos; si una canasta no los tiene, sigue calculando con su
-- receta y el costo de la última compra de cada producto.
-- ============================================================================

alter table public.productos
  add column costo_viveres numeric(10, 2) check (costo_viveres is null or costo_viveres >= 0),
  add column costo_presentacion numeric(10, 2) check (costo_presentacion is null or costo_presentacion >= 0);

create or replace view public.v_costeo_canastas with (security_invoker = true) as
with receta as (
  select
    p.id,
    round(coalesce(sum(r.cantidad * ci.costo_actual), 0), 2) as costo,
    count(r.insumo_id) filter (where ci.costo_actual is null) as sin_costo
  from public.productos p
  left join public.recetas r on r.producto_id = p.id
  left join public.v_costo_insumos ci on ci.insumo_id = r.insumo_id
  group by p.id
),
base as (
  select
    p.id, p.slug, p.nombre, p.precio, p.costo_viveres, p.costo_presentacion,
    receta.costo as costo_receta,
    receta.sin_costo,
    (p.costo_viveres is not null or p.costo_presentacion is not null) as usa_tabla
  from public.productos p
  join receta on receta.id = p.id
)
select
  id as producto_id,
  slug,
  nombre,
  precio,
  case when usa_tabla then coalesce(costo_viveres, 0) + coalesce(costo_presentacion, 0) else costo_receta end as costo,
  round(precio - case when usa_tabla then coalesce(costo_viveres, 0) + coalesce(costo_presentacion, 0) else costo_receta end, 2) as margen,
  case when precio > 0 then round((precio - case when usa_tabla then coalesce(costo_viveres, 0) + coalesce(costo_presentacion, 0) else costo_receta end) / precio * 100, 1) end as margen_pct,
  case when usa_tabla then 0 else sin_costo end as insumos_sin_costo,
  costo_viveres,
  costo_presentacion,
  costo_receta,
  case when usa_tabla then 'tabla' else 'receta' end as fuente
from base;
