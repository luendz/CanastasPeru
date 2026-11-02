-- ============================================================================
-- Las direcciones de las canastas Económicas coinciden con su nombre.
-- Las antiguas siguen funcionando: redirigen desde lib/slugs-antiguos.ts.
-- ============================================================================

update public.productos as p
set slug = c.nuevo
from (values
  ('canasta-clasica', 'canasta-economica-1'),
  ('box-navideno', 'canasta-economica-2'),
  ('canasta-premium', 'canasta-economica-3'),
  ('canasta-ejecutiva', 'canasta-economica-4')
) as c(antiguo, nuevo)
where p.slug = c.antiguo;

-- La canasta de muestra de la portada se guarda por su dirección.
update public.contenido
set valor = jsonb_set(valor, '{canastaDestacada}', to_jsonb(case valor ->> 'canastaDestacada'
  when 'canasta-clasica' then 'canasta-economica-1'
  when 'box-navideno' then 'canasta-economica-2'
  when 'canasta-premium' then 'canasta-economica-3'
  when 'canasta-ejecutiva' then 'canasta-economica-4'
end))
where valor ->> 'canastaDestacada' in ('canasta-clasica', 'box-navideno', 'canasta-premium', 'canasta-ejecutiva');
