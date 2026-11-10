-- ============================================================================
-- Roles y permisos del panel.
--
-- - roles: roles editables. "Administrador" (es_administrador) es fijo: tiene
--   todos los permisos, gestiona usuarios y roles, y no se puede borrar.
-- - rol_permisos: lo que puede hacer cada rol. Una clave por sección
--   ("ordenes": puede entrar) y por acción ("ordenes.estado": puede cambiar
--   el estado). El catálogo de claves vive en lib/admin/permisos.ts.
-- - admins: cada usuario del panel tiene un rol y puede quedar sin acceso
--   (activo = false) sin borrarlo.
--
-- es_admin() pasa a exigir un usuario ACTIVO: quien queda sin acceso pierde
-- en el acto todos los datos protegidos por RLS. Los permisos por sección en
-- las políticas de cada tabla llegan en una entrega posterior.
-- ============================================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique check (char_length(btrim(nombre)) between 1 and 60),
  es_administrador boolean not null default false,
  created_at timestamptz not null default now()
);

-- Un solo rol Administrador.
create unique index roles_un_administrador on public.roles (es_administrador) where es_administrador;

create table public.rol_permisos (
  rol_id uuid not null references public.roles (id) on delete cascade,
  permiso text not null check (permiso ~ '^[a-z]+(\.[a-z_]+)?$'),
  primary key (rol_id, permiso)
);

insert into public.roles (nombre, es_administrador) values ('Administrador', true);

alter table public.admins
  add column rol_id uuid references public.roles (id),
  add column activo boolean not null default true;

update public.admins set rol_id = (select id from public.roles where es_administrador);
alter table public.admins alter column rol_id set not null;

-- Acceso al panel: usuario registrado y activo.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()) and activo);
$$;

-- Rol Administrador y activo: gestiona usuarios y roles.
create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.admins a join public.roles r on r.id = a.rol_id
    where a.user_id = (select auth.uid()) and a.activo and r.es_administrador
  );
$$;

-- ¿El usuario de la sesión tiene este permiso? El Administrador los tiene todos.
create or replace function public.tiene_permiso(p text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.admins a join public.roles r on r.id = a.rol_id
    where a.user_id = (select auth.uid()) and a.activo
      and (r.es_administrador or exists (select 1 from public.rol_permisos rp where rp.rol_id = r.id and rp.permiso = p))
  );
$$;

-- Rol y permisos del usuario de la sesión (para armar el menú del panel).
create or replace function public.mis_permisos()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  select jsonb_build_object(
    'rol', r.nombre,
    'administrador', r.es_administrador,
    'permisos', coalesce((select jsonb_agg(rp.permiso order by rp.permiso) from public.rol_permisos rp where rp.rol_id = r.id), '[]'::jsonb)
  )
  from public.admins a join public.roles r on r.id = a.rol_id
  where a.user_id = (select auth.uid()) and a.activo;
$$;

revoke execute on function public.es_administrador() from public;
revoke execute on function public.tiene_permiso(text) from public;
revoke execute on function public.mis_permisos() from public;
grant execute on function public.es_administrador() to anon, authenticated;
grant execute on function public.tiene_permiso(text) to anon, authenticated;
grant execute on function public.mis_permisos() to authenticated;

alter table public.roles enable row level security;
alter table public.rol_permisos enable row level security;

-- Todo usuario activo del panel lee los roles; solo el Administrador los cambia.
create policy "Panel lee roles" on public.roles for select to authenticated using ((select public.es_admin()));
create policy "Administrador gestiona roles" on public.roles for all to authenticated
  using ((select public.es_administrador()) and not es_administrador)
  with check ((select public.es_administrador()) and not es_administrador);
create policy "Panel lee permisos" on public.rol_permisos for select to authenticated using ((select public.es_admin()));
create policy "Administrador gestiona permisos" on public.rol_permisos for all to authenticated
  using ((select public.es_administrador()) and rol_id not in (select id from public.roles where es_administrador))
  with check ((select public.es_administrador()) and rol_id not in (select id from public.roles where es_administrador));
