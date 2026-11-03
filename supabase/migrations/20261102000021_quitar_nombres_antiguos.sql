-- ============================================================================
-- Se aplica cuando el código con los nombres nuevos ya está publicado: quita los
-- nombres antiguos que la migración 20 mantuvo durante la publicación.
-- ============================================================================

-- El catálogo solo responde con los nombres nuevos.
do $$
declare
  v_def text := pg_get_functiondef('public.catalogo_web()'::regprocedure);
begin
  v_def := replace(v_def, E'\n          ''tipo_canasta_base'', c.envase_base_id,', '');
  v_def := replace(v_def, 'select d || jsonb_build_object(''productos'', d -> ''canastas'', ''tipos_canasta'', d -> ''envases'')', 'select d');
  execute v_def;
end $$;

-- El pedido solo acepta envase_id.
do $$
declare
  v_def text := pg_get_functiondef('public.crear_orden_web(jsonb)'::regprocedure);
begin
  v_def := replace(v_def, ', nullif(v_item ->> ''tipo_canasta'', '''')', '');
  execute v_def;
end $$;
