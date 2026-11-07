-- ============================================================================
-- Eliminación lógica de órdenes y cotizaciones.
--
-- "Eliminar" en el panel ya no borra: guarda la fecha en eliminado_at. Lo
-- eliminado no aparece en listas, panel, reportes, inventario ni seguimiento, y
-- se puede restaurar desde el filtro "Eliminadas". Su número no se reutiliza.
-- ============================================================================

alter table public.ordenes add column eliminado_at timestamptz;
alter table public.cotizaciones add column eliminado_at timestamptz;

comment on column public.ordenes.eliminado_at is 'Fecha en que se eliminó desde el panel; null si está vigente.';
comment on column public.cotizaciones.eliminado_at is 'Fecha en que se eliminó desde el panel; null si está vigente.';

-- El inventario no cuenta los productos de órdenes eliminadas.
create or replace view public.v_consumo_articulos with (security_invoker = true) as
select articulo_id, estado, sum(cantidad) as cantidad
from (
  select r.articulo_id, o.estado, oi.cantidad::numeric * r.cantidad as cantidad
  from public.orden_items oi
  join public.ordenes o on o.id = oi.orden_id
  join public.canasta_articulos r on r.canasta_id = oi.canasta_id
  where o.estado <> 'anulada' and o.eliminado_at is null and oi.contenido is null
  union all
  select (e.value ->> 'articulo_id')::uuid, o.estado, oi.cantidad::numeric * (e.value ->> 'cantidad')::numeric
  from public.orden_items oi
  join public.ordenes o on o.id = oi.orden_id
  cross join lateral jsonb_array_elements(oi.contenido) e(value)
  where o.estado <> 'anulada' and o.eliminado_at is null and oi.contenido is not null and (e.value ->> 'articulo_id') is not null
) x
group by articulo_id, estado;

-- El cliente no encuentra en /seguimiento una orden eliminada.
create or replace function public.seguimiento_pedido(p_numero text, p_contacto text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_digitos text := ltrim(regexp_replace(coalesce(p_numero, ''), '\D', '', 'g'), '0');
  v_contacto text := lower(trim(coalesce(p_contacto, '')));
  v_tel text := right(regexp_replace(coalesce(p_contacto, ''), '\D', '', 'g'), 9);
  v_numero text;
  v_orden public.ordenes;
begin
  if v_digitos = '' or length(v_digitos) > 9 or length(v_contacto) < 6 or length(v_contacto) > 160 then
    return null;
  end if;
  v_numero := 'OP-' || case when length(v_digitos) >= 4 then v_digitos else lpad(v_digitos, 4, '0') end;

  select * into v_orden from public.ordenes o
  where o.numero = v_numero
    and o.eliminado_at is null
    and (
      (position('@' in v_contacto) > 0 and lower(trim(o.cliente_email)) = v_contacto)
      or (length(v_tel) >= 7 and right(regexp_replace(coalesce(o.cliente_telefono, ''), '\D', '', 'g'), 9) = v_tel)
    );
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'numero', v_orden.numero,
    'nombre', split_part(trim(v_orden.cliente_nombre), ' ', 1),
    'estado', v_orden.estado,
    'estado_pago', v_orden.estado_pago,
    'creado', v_orden.created_at,
    'actualizado', v_orden.updated_at,
    'fecha_entrega', v_orden.fecha_entrega,
    'horario', v_orden.horario,
    'distrito', v_orden.distrito,
    'metodo_pago', v_orden.metodo_pago,
    'subtotal', v_orden.subtotal,
    'delivery', v_orden.delivery,
    'total', v_orden.total,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', i.canasta_nombre,
        'envase', e.nombre,
        'cantidad', i.cantidad,
        'subtotal', i.subtotal
      ) order by i.canasta_nombre)
      from public.orden_items i
      left join public.envases e on e.id = i.envase_id
      where i.orden_id = v_orden.id
    ), '[]'::jsonb)
  );
end;
$$;
