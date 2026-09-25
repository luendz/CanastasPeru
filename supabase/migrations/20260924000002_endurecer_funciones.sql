-- Endurecimiento tras el linter de seguridad de Supabase.
--
-- es_admin y precio_canasta no necesitan privilegios elevados: con RLS, cada
-- usuario solo ve su fila en admins y el catálogo activo es de lectura pública.
-- Pasan a SECURITY INVOKER; precio_canasta deja de estar expuesta a anónimos.
-- Cuando las llaman crear_orden_web o aprobar_cotizacion (SECURITY DEFINER),
-- se ejecutan con los permisos de esas funciones, así que siguen funcionando.
--
-- crear_orden_web y crear_cotizacion_web siguen siendo SECURITY DEFINER y
-- ejecutables por anon a propósito: son la puerta de la tienda pública y
-- validan todo y recalculan precios en el servidor.

alter function public.es_admin() security invoker;
alter function public.precio_canasta(uuid, text) security invoker;

revoke execute on function public.precio_canasta(uuid, text) from anon;
-- es_admin se sigue concediendo a anon: las políticas de lectura pública
-- (productos, zonas) la evalúan. Como SECURITY INVOKER, a un anónimo le
-- devuelve siempre false.
grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.precio_canasta(uuid, text) to authenticated;
