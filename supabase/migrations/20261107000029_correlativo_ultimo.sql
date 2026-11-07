-- ============================================================================
-- Correlativos de órdenes (OP-0001) y cotizaciones (COT-0001): el siguiente
-- número es el último que existe + 1.
--
-- Antes salían de una secuencia, que nunca retrocede: si se borraba la última
-- orden, su número se perdía. Ahora, si se elimina la última, el número vuelve
-- a estar disponible. Un candado por tabla evita números repetidos cuando dos
-- pedidos llegan a la vez. La función es security definer para ver todas las
-- filas aunque quien inserte (la web) no pueda leerlas.
-- ============================================================================

create or replace function public.siguiente_numero()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_prefijo text := tg_argv[0];
  v_n integer;
begin
  if new.numero is null or new.numero = '' then
    perform pg_advisory_xact_lock(hashtext('numero:' || tg_table_name));
    execute format(
      'select coalesce(max(substring(numero from %L)::integer), 0) + 1 from public.%I',
      '^' || v_prefijo || '-(\d+)$', tg_table_name
    ) into v_n;
    new.numero := v_prefijo || '-' || lpad(v_n::text, greatest(4, length(v_n::text)), '0');
  end if;
  return new;
end;
$$;

revoke all on function public.siguiente_numero() from public, anon, authenticated;

alter table public.ordenes alter column numero drop default;
alter table public.cotizaciones alter column numero drop default;

create trigger ordenes_numero
  before insert on public.ordenes
  for each row execute function public.siguiente_numero('OP');

create trigger cotizaciones_numero
  before insert on public.cotizaciones
  for each row execute function public.siguiente_numero('COT');

drop sequence public.ordenes_numero_seq;
drop sequence public.cotizaciones_numero_seq;
