-- ============================================================================
-- Datos para el PDF de cotización comercial.
--
-- - Cotización: asesor comercial, forma de pago, horario de entrega y
--   distrito (se completan en el panel).
-- - Insumos: presentación del producto (marca y tamaño), p. ej.
--   "Milano Sayon 750 g", para detallar cada canasta en el PDF.
-- ============================================================================

alter table public.cotizaciones
  add column asesor text,
  add column forma_pago text,
  add column horario_entrega text,
  add column distrito text;

alter table public.insumos add column presentacion text;
