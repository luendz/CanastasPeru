-- ============================================================================
-- Los envases que no tenían producto pasan a estar en Productos, como empaques.
-- El costo queda sin definir (null) hasta registrarlo: no es lo mismo que costo 0.
-- ============================================================================

with nuevos as (
  select * from (values
    ('cesta-azul', '0000083', '🧺'),
    ('caja-organizadora-premium', '0000084', '🎁'),
    ('canasta-mimbre-ejecutiva', '0000085', '🧺'),
    ('caja-navidena-regalos', '0000086', '🎁')
  ) as n(tipo_id, sku, emoji)
),
creados as (
  insert into public.insumos (nombre, sku, tipo, categoria, emoji, imagen)
  select t.nombre, n.sku, 'empaque', 'Empaque', n.emoji, t.imagen
  from nuevos n
  join public.tipos_canasta t on t.id = n.tipo_id and t.insumo_id is null
  returning id, sku
)
update public.tipos_canasta t
set insumo_id = c.id
from creados c
join nuevos n on n.sku = c.sku
where t.id = n.tipo_id;
