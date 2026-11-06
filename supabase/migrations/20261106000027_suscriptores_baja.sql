-- ============================================================================
-- Bajas de suscriptores desde Brevo.
--
-- Cuando alguien se da de baja (o marca un correo como spam) en Brevo, Brevo
-- avisa a la web por webhook y la web guarda la fecha en baja_at. El panel lo
-- muestra como "Dado de baja" y no lo incluye al copiar o descargar correos.
--
-- Solo el servidor (secret key) escribe baja_at; volver a suscribirse desde la
-- web no la borra, igual que en Brevo, que sigue respetando la baja.
-- ============================================================================

alter table public.suscriptores add column baja_at timestamptz;

comment on column public.suscriptores.baja_at is 'Fecha en que se dio de baja en Brevo; null si sigue suscrito.';
