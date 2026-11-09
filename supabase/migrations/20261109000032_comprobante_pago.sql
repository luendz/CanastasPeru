-- ============================================================================
-- Comprobante de pago (Yape / Plin con QR).
--
-- Tras un pedido con pago por QR, el cliente sube la captura de su pago desde
-- la página de confirmación. La sube el servidor (secret key) a un bucket
-- privado y guarda la ruta en la orden; el panel la muestra con un enlace
-- firmado. La orden sigue "pendiente" hasta que el negocio verifique el pago.
-- ============================================================================

alter table public.ordenes
  add column comprobante_pago text,
  add column comprobante_pago_at timestamptz;

comment on column public.ordenes.comprobante_pago is 'Ruta en el bucket privado "comprobantes" de la captura de pago que subió el cliente.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Solo los administradores ven las capturas; nadie las sube con la clave pública.
create policy "Admins ven comprobantes de pago" on storage.objects
  for select to authenticated
  using (bucket_id = 'comprobantes' and (select public.es_admin()));
