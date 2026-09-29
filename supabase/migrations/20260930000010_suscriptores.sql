-- ============================================================================
-- Suscripción a novedades (pie de página de la web).
-- Los visitantes solo pueden suscribirse con la función pública; la lista
-- solo la ven los administradores.
-- ============================================================================

create table public.suscriptores (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 160),
  created_at timestamptz not null default now()
);
alter table public.suscriptores enable row level security;
create policy "Admins ven suscriptores" on public.suscriptores for select to authenticated using ((select public.es_admin()));
create policy "Admins borran suscriptores" on public.suscriptores for delete to authenticated using ((select public.es_admin()));

create or replace function public.suscribir_novedades(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
begin
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 160 then
    raise exception 'Correo inválido';
  end if;
  insert into public.suscriptores (email) values (v_email) on conflict (email) do nothing;
  return true;
end;
$$;
revoke execute on function public.suscribir_novedades(text) from public;
grant execute on function public.suscribir_novedades(text) to anon, authenticated;
