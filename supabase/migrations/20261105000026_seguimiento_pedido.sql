-- ============================================================================
-- Seguimiento de pedido para clientes (página pública /seguimiento).
--
-- El cliente escribe su número de pedido (OP-0012, 0012 o 12) y el correo o
-- el celular con el que compró. Solo si ambos coinciden se devuelve el estado
-- del pedido. No se devuelven dirección, documento ni datos de quien recibe.
--
-- La tabla ordenes sigue cerrada para anon: esta función es la única puerta.
-- ============================================================================

create or replace function public.seguimiento_pedido(p_numero text, p_contacto text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
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

revoke execute on function public.seguimiento_pedido(text, text) from public;
grant execute on function public.seguimiento_pedido(text, text) to anon, authenticated;
