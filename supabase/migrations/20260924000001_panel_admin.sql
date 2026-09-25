-- ============================================================================
-- MKA · Panel de administración
-- Catálogo, compras y costos, órdenes de pedido, cotizaciones, recetas por
-- canasta e inventario derivado.
--
-- Seguridad:
--   * Todas las tablas tienen RLS. Solo los administradores (tabla admins)
--     pueden leer y escribir datos de gestión.
--   * La web pública NO escribe en las tablas: usa las funciones
--     crear_orden_web y crear_cotizacion_web, que validan los datos y
--     recalculan precios en el servidor (nunca se confía en el navegador).
--   * El stock y los costos se calculan con vistas a partir de compras y
--     pedidos, para que nunca se desincronicen.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  created_at timestamptz not null default now()
);

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- updated_at automático
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.tipos_canasta (
  id text primary key,
  nombre text not null,
  recargo numeric(10, 2) not null default 0 check (recargo >= 0)
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  categoria text not null,
  precio numeric(10, 2) not null check (precio >= 0),
  tipo_canasta_base text not null references public.tipos_canasta (id),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.zonas_delivery (
  distrito text primary key,
  tarifa numeric(10, 2) not null check (tarifa >= 0),
  activo boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Insumos y recetas (costeo por canasta)
-- ---------------------------------------------------------------------------
create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  unidad text not null default 'unidad',
  tipo text not null default 'producto' check (tipo in ('producto', 'empaque', 'otro')),
  stock_inicial numeric(12, 2) not null default 0,
  stock_minimo numeric(12, 2) not null default 0 check (stock_minimo >= 0),
  created_at timestamptz not null default now()
);

create table public.recetas (
  producto_id uuid not null references public.productos (id) on delete cascade,
  insumo_id uuid not null references public.insumos (id) on delete restrict,
  cantidad numeric(10, 2) not null check (cantidad > 0),
  primary key (producto_id, insumo_id)
);
create index recetas_insumo_idx on public.recetas (insumo_id);

-- ---------------------------------------------------------------------------
-- Compras (costos de producción y de marketing)
-- ---------------------------------------------------------------------------
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  categoria text not null check (categoria in ('produccion', 'marketing')),
  subcategoria text,
  proveedor text,
  descripcion text not null check (char_length(descripcion) between 1 and 300),
  insumo_id uuid references public.insumos (id) on delete set null,
  cantidad numeric(12, 2) not null default 1 check (cantidad > 0),
  costo_unitario numeric(12, 2) not null check (costo_unitario >= 0),
  total numeric(14, 2) generated always as (round(cantidad * costo_unitario, 2)) stored,
  comprobante text,
  notas text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Solo las compras de producción pueden sumar stock a un insumo.
  constraint compras_insumo_solo_produccion check (insumo_id is null or categoria = 'produccion')
);
create index compras_fecha_idx on public.compras (fecha);
create index compras_insumo_idx on public.compras (insumo_id);

-- ---------------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------------
create sequence public.cotizaciones_numero_seq;

create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('COT-' || lpad(nextval('public.cotizaciones_numero_seq')::text, 4, '0')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'enviada', 'aprobada', 'rechazada')),
  empresa text not null,
  ruc text,
  contacto text not null,
  cargo text,
  email text,
  telefono text,
  cantidad_estimada integer check (cantidad_estimada is null or cantidad_estimada > 0),
  presupuesto text,
  fecha_requerida date,
  lugar_entrega text,
  canastas_base text[] not null default '{}',
  personalizacion text[] not null default '{}',
  requerimientos text,
  valida_hasta date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger cotizaciones_updated_at before update on public.cotizaciones
  for each row execute function public.tocar_updated_at();

create table public.cotizacion_items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  producto_nombre text not null,
  tipo_canasta text references public.tipos_canasta (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal numeric(14, 2) generated always as (cantidad * precio_unitario) stored
);
create index cotizacion_items_cotizacion_idx on public.cotizacion_items (cotizacion_id);
create index cotizacion_items_producto_idx on public.cotizacion_items (producto_id);

-- ---------------------------------------------------------------------------
-- Órdenes de pedido
-- ---------------------------------------------------------------------------
create sequence public.ordenes_numero_seq;

create table public.ordenes (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('OP-' || lpad(nextval('public.ordenes_numero_seq')::text, 4, '0')),
  origen text not null check (origen in ('web', 'cotizacion', 'manual')),
  cotizacion_id uuid unique references public.cotizaciones (id) on delete set null,
  estado text not null default 'nueva' check (estado in ('nueva', 'pagada', 'preparacion', 'en_ruta', 'entregada', 'anulada')),
  estado_pago text not null default 'pendiente' check (estado_pago in ('pendiente', 'pagado')),
  cliente_nombre text not null,
  cliente_email text,
  cliente_telefono text,
  comprobante_tipo text not null default 'boleta' check (comprobante_tipo in ('boleta', 'factura')),
  comprobante_documento text,
  comprobante_nombre text,
  direccion_fiscal text,
  distrito text,
  direccion text,
  referencia text,
  fecha_entrega date,
  horario text,
  recibe_nombre text,
  recibe_telefono text,
  dedicatoria text,
  metodo_pago text,
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  delivery numeric(10, 2) not null default 0 check (delivery >= 0),
  total numeric(14, 2) generated always as (subtotal + delivery) stored,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ordenes_created_idx on public.ordenes (created_at);
create index ordenes_estado_idx on public.ordenes (estado);
create trigger ordenes_updated_at before update on public.ordenes
  for each row execute function public.tocar_updated_at();

create table public.orden_items (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references public.ordenes (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  producto_nombre text not null,
  tipo_canasta text references public.tipos_canasta (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal numeric(14, 2) generated always as (cantidad * precio_unitario) stored
);
create index orden_items_orden_idx on public.orden_items (orden_id);
create index orden_items_producto_idx on public.orden_items (producto_id);

-- ---------------------------------------------------------------------------
-- RLS: solo administradores; catálogo de lectura pública
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.tipos_canasta enable row level security;
alter table public.productos enable row level security;
alter table public.zonas_delivery enable row level security;
alter table public.insumos enable row level security;
alter table public.recetas enable row level security;
alter table public.compras enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.cotizacion_items enable row level security;
alter table public.ordenes enable row level security;
alter table public.orden_items enable row level security;

create policy "Cada admin ve su propia fila" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Catálogo visible" on public.tipos_canasta for select to anon, authenticated using (true);
create policy "Productos activos visibles" on public.productos for select to anon, authenticated using (activo or (select public.es_admin()));
create policy "Zonas activas visibles" on public.zonas_delivery for select to anon, authenticated using (activo or (select public.es_admin()));

create policy "Admins gestionan tipos" on public.tipos_canasta for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan productos" on public.productos for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan zonas" on public.zonas_delivery for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan insumos" on public.insumos for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan recetas" on public.recetas for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan compras" on public.compras for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan cotizaciones" on public.cotizaciones for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan items de cotización" on public.cotizacion_items for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan órdenes" on public.ordenes for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "Admins gestionan items de orden" on public.orden_items for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));

-- ---------------------------------------------------------------------------
-- Funciones públicas de la web (validan y recalculan precios en el servidor)
-- ---------------------------------------------------------------------------

-- Precio unitario de una canasta con el tipo de canasta elegido.
create or replace function public.precio_canasta(p_producto_id uuid, p_tipo text)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select p.precio + coalesce(sel.recargo, base.recargo) - base.recargo
  from public.productos p
  join public.tipos_canasta base on base.id = p.tipo_canasta_base
  left join public.tipos_canasta sel on sel.id = p_tipo
  where p.id = p_producto_id;
$$;

/*
  Crea una orden desde el checkout de la web.
  p = {
    cliente: { nombre, email, telefono },
    comprobante: { tipo, documento, nombre, direccion_fiscal },
    entrega: { distrito, direccion, referencia, fecha, horario, recibe_nombre, recibe_telefono, dedicatoria },
    metodo_pago,
    items: [{ slug, cantidad, tipo_canasta }]
  }
  Devuelve { numero, total }.
*/
create or replace function public.crear_orden_web(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_orden public.ordenes;
  v_item jsonb;
  v_producto public.productos;
  v_tipo text;
  v_cantidad integer;
  v_precio numeric;
  v_lineas jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_delivery numeric := 0;
  v_items jsonb := coalesce(p -> 'items', '[]'::jsonb);
  v_nombre text := nullif(btrim(p #>> '{cliente,nombre}'), '');
begin
  -- 1. Validar todo antes de crear la orden, para no consumir números de pedido en intentos fallidos.
  if v_nombre is null or char_length(v_nombre) > 160 then
    raise exception 'Falta el nombre del cliente';
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 30 then
    raise exception 'El pedido debe tener entre 1 y 30 productos';
  end if;

  if nullif(p #>> '{entrega,distrito}', '') is not null then
    select tarifa into v_delivery from public.zonas_delivery
    where distrito = p #>> '{entrega,distrito}' and activo;
    if not found then
      raise exception 'Distrito sin cobertura de delivery';
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(v_items) loop
    select * into v_producto from public.productos where slug = v_item ->> 'slug' and activo;
    if not found then
      raise exception 'Producto no disponible: %', v_item ->> 'slug';
    end if;
    v_cantidad := (v_item ->> 'cantidad')::integer;
    if v_cantidad is null or v_cantidad < 1 or v_cantidad > 500 then
      raise exception 'Cantidad inválida para %', v_producto.nombre;
    end if;
    v_tipo := coalesce(nullif(v_item ->> 'tipo_canasta', ''), v_producto.tipo_canasta_base);
    if not exists (select 1 from public.tipos_canasta where id = v_tipo) then
      raise exception 'Tipo de canasta inválido';
    end if;
    -- El precio siempre sale del catálogo; se ignora cualquier precio enviado.
    v_precio := public.precio_canasta(v_producto.id, v_tipo);
    v_subtotal := v_subtotal + v_cantidad * v_precio;
    v_lineas := v_lineas || jsonb_build_object(
      'producto_id', v_producto.id, 'nombre', v_producto.nombre, 'tipo', v_tipo,
      'cantidad', v_cantidad, 'precio', v_precio
    );
  end loop;

  -- 2. Crear la orden y sus líneas.
  insert into public.ordenes (
    origen, cliente_nombre, cliente_email, cliente_telefono,
    comprobante_tipo, comprobante_documento, comprobante_nombre, direccion_fiscal,
    distrito, direccion, referencia, fecha_entrega, horario,
    recibe_nombre, recibe_telefono, dedicatoria, metodo_pago, subtotal, delivery
  ) values (
    'web', v_nombre,
    left(nullif(btrim(p #>> '{cliente,email}'), ''), 160),
    left(nullif(btrim(p #>> '{cliente,telefono}'), ''), 40),
    case when p #>> '{comprobante,tipo}' = 'factura' then 'factura' else 'boleta' end,
    left(nullif(btrim(p #>> '{comprobante,documento}'), ''), 20),
    left(nullif(btrim(p #>> '{comprobante,nombre}'), ''), 200),
    left(nullif(btrim(p #>> '{comprobante,direccion_fiscal}'), ''), 300),
    nullif(p #>> '{entrega,distrito}', ''),
    left(nullif(btrim(p #>> '{entrega,direccion}'), ''), 300),
    left(nullif(btrim(p #>> '{entrega,referencia}'), ''), 300),
    nullif(p #>> '{entrega,fecha}', '')::date,
    left(nullif(p #>> '{entrega,horario}', ''), 40),
    left(nullif(btrim(p #>> '{entrega,recibe_nombre}'), ''), 160),
    left(nullif(btrim(p #>> '{entrega,recibe_telefono}'), ''), 40),
    left(nullif(btrim(p #>> '{entrega,dedicatoria}'), ''), 240),
    left(nullif(p ->> 'metodo_pago', ''), 40),
    v_subtotal,
    v_delivery
  ) returning * into v_orden;

  insert into public.orden_items (orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario)
  select v_orden.id, (l ->> 'producto_id')::uuid, l ->> 'nombre', l ->> 'tipo', (l ->> 'cantidad')::integer, (l ->> 'precio')::numeric
  from jsonb_array_elements(v_lineas) as l;

  return jsonb_build_object('numero', v_orden.numero, 'total', v_orden.total);
end;
$$;

/*
  Registra una solicitud del formulario de empresas.
  Devuelve { numero }.
*/
create or replace function public.crear_cotizacion_web(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero text;
  v_empresa text := nullif(btrim(p ->> 'empresa'), '');
  v_contacto text := nullif(btrim(p ->> 'contacto'), '');
begin
  if v_empresa is null or v_contacto is null then
    raise exception 'Faltan la empresa o el contacto';
  end if;

  insert into public.cotizaciones (
    empresa, ruc, contacto, cargo, email, telefono, cantidad_estimada, presupuesto,
    fecha_requerida, lugar_entrega, canastas_base, personalizacion, requerimientos
  ) values (
    left(v_empresa, 200),
    left(nullif(btrim(p ->> 'ruc'), ''), 11),
    left(v_contacto, 160),
    left(nullif(btrim(p ->> 'cargo'), ''), 120),
    left(nullif(btrim(p ->> 'email'), ''), 160),
    left(nullif(btrim(p ->> 'telefono'), ''), 40),
    nullif(p ->> 'cantidad_estimada', '')::integer,
    left(nullif(p ->> 'presupuesto', ''), 60),
    nullif(p ->> 'fecha_requerida', '')::date,
    left(nullif(p ->> 'lugar_entrega', ''), 120),
    coalesce(array(select left(x, 120) from jsonb_array_elements_text(coalesce(p -> 'canastas_base', '[]')) x limit 10), '{}'),
    coalesce(array(select left(x, 120) from jsonb_array_elements_text(coalesce(p -> 'personalizacion', '[]')) x limit 10), '{}'),
    left(nullif(btrim(p ->> 'requerimientos'), ''), 2000)
  ) returning numero into v_numero;

  return jsonb_build_object('numero', v_numero);
end;
$$;

-- ---------------------------------------------------------------------------
-- Funciones del panel (solo administradores)
-- ---------------------------------------------------------------------------

-- Aprueba una cotización y crea su orden de pedido con los mismos productos.
create or replace function public.aprobar_cotizacion(p_cotizacion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cot public.cotizaciones;
  v_orden_id uuid;
begin
  if not public.es_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_cot from public.cotizaciones where id = p_cotizacion_id for update;
  if not found then
    raise exception 'Cotización no encontrada';
  end if;
  if v_cot.estado = 'aprobada' then
    raise exception 'La cotización ya fue aprobada';
  end if;
  if not exists (select 1 from public.cotizacion_items where cotizacion_id = v_cot.id) then
    raise exception 'Agrega al menos una canasta con precio antes de aprobar';
  end if;

  insert into public.ordenes (
    origen, cotizacion_id, cliente_nombre, cliente_email, cliente_telefono,
    comprobante_tipo, comprobante_documento, comprobante_nombre,
    fecha_entrega, notas, subtotal
  ) values (
    'cotizacion', v_cot.id,
    v_cot.contacto || ' · ' || v_cot.empresa, v_cot.email, v_cot.telefono,
    case when v_cot.ruc is not null then 'factura' else 'boleta' end,
    v_cot.ruc, v_cot.empresa,
    v_cot.fecha_requerida,
    nullif(concat_ws(' · ', v_cot.lugar_entrega, v_cot.requerimientos), ''),
    (select coalesce(sum(subtotal), 0) from public.cotizacion_items where cotizacion_id = v_cot.id)
  ) returning id into v_orden_id;

  insert into public.orden_items (orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario)
  select v_orden_id, producto_id, producto_nombre, tipo_canasta, cantidad, precio_unitario
  from public.cotizacion_items where cotizacion_id = v_cot.id;

  update public.cotizaciones set estado = 'aprobada' where id = v_cot.id;
  return v_orden_id;
end;
$$;

revoke execute on function public.crear_orden_web(jsonb) from public;
revoke execute on function public.crear_cotizacion_web(jsonb) from public;
revoke execute on function public.aprobar_cotizacion(uuid) from public, anon;
revoke execute on function public.precio_canasta(uuid, text) from public;
grant execute on function public.crear_orden_web(jsonb) to anon, authenticated;
grant execute on function public.crear_cotizacion_web(jsonb) to anon, authenticated;
grant execute on function public.aprobar_cotizacion(uuid) to authenticated;
grant execute on function public.precio_canasta(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vistas de gestión (respetan RLS: solo admins ven datos)
-- ---------------------------------------------------------------------------

-- Costo promedio ponderado de cada insumo según las compras de producción.
create view public.v_costo_insumos with (security_invoker = true) as
select
  i.id as insumo_id,
  i.nombre,
  i.unidad,
  i.tipo,
  coalesce(sum(c.cantidad), 0) as cantidad_comprada,
  case when coalesce(sum(c.cantidad), 0) > 0 then round(sum(c.total) / sum(c.cantidad), 2) end as costo_promedio
from public.insumos i
left join public.compras c on c.insumo_id = i.id
group by i.id;

-- Costo, precio y margen de cada canasta según su receta.
create view public.v_costeo_canastas with (security_invoker = true) as
select
  p.id as producto_id,
  p.slug,
  p.nombre,
  p.precio,
  round(coalesce(sum(r.cantidad * ci.costo_promedio), 0), 2) as costo,
  round(p.precio - coalesce(sum(r.cantidad * ci.costo_promedio), 0), 2) as margen,
  case when p.precio > 0 then round((p.precio - coalesce(sum(r.cantidad * ci.costo_promedio), 0)) / p.precio * 100, 1) end as margen_pct,
  count(r.insumo_id) filter (where ci.costo_promedio is null) as insumos_sin_costo
from public.productos p
left join public.recetas r on r.producto_id = p.id
left join public.v_costo_insumos ci on ci.insumo_id = r.insumo_id
group by p.id;

-- Unidades de cada insumo por orden, según la receta de cada canasta.
create view public.v_consumo_insumos with (security_invoker = true) as
select
  r.insumo_id,
  o.estado,
  sum(oi.cantidad * r.cantidad) as cantidad
from public.orden_items oi
join public.ordenes o on o.id = oi.orden_id
join public.recetas r on r.producto_id = oi.producto_id
where o.estado <> 'anulada'
group by r.insumo_id, o.estado;

-- Stock actual y lo que falta para cubrir los pedidos pendientes.
-- Se descuenta del stock cuando la orden pasa a "en preparación".
create view public.v_inventario with (security_invoker = true) as
select
  i.id as insumo_id,
  i.nombre,
  i.unidad,
  i.tipo,
  i.stock_minimo,
  i.stock_inicial
    + coalesce((select sum(c.cantidad) from public.compras c where c.insumo_id = i.id), 0)
    - coalesce((select sum(v.cantidad) from public.v_consumo_insumos v where v.insumo_id = i.id and v.estado in ('preparacion', 'en_ruta', 'entregada')), 0)
    as stock,
  coalesce((select sum(v.cantidad) from public.v_consumo_insumos v where v.insumo_id = i.id and v.estado in ('nueva', 'pagada')), 0)
    as requerido_pendiente
from public.insumos i;

-- ---------------------------------------------------------------------------
-- Datos iniciales (catálogo actual de la web)
-- ---------------------------------------------------------------------------
insert into public.tipos_canasta (id, nombre, recargo) values
  ('cesta-azul', 'Cesta azul', 0),
  ('caja-navidena', 'Caja navideña', 8),
  ('cesta-gris', 'Cesta gris con tapa', 10),
  ('cesta-ratan', 'Cesta símil ratán', 20);

insert into public.productos (slug, nombre, categoria, precio, tipo_canasta_base) values
  ('box-navideno', 'Box Navideño', 'Boxes', 89.90, 'caja-navidena'),
  ('canasta-clasica', 'Canasta Clásica', 'Económica', 119.90, 'cesta-azul'),
  ('canasta-premium', 'Canasta Premium', 'Premium', 159.90, 'cesta-gris'),
  ('canasta-ejecutiva', 'Canasta Ejecutiva', 'Ejecutiva', 239.90, 'cesta-ratan');

insert into public.zonas_delivery (distrito, tarifa) values
  ('Miraflores', 15), ('San Isidro', 15), ('Santiago de Surco', 18), ('San Borja', 15),
  ('La Molina', 22), ('Jesús María', 15), ('Lince', 12), ('San Miguel', 18);

insert into public.insumos (nombre, unidad, tipo) values
  ('Panetón', 'unidad', 'producto'), ('Champagne', 'botella', 'producto'),
  ('Galletas navideñas', 'paquete', 'producto'), ('Duraznos', 'lata', 'producto'),
  ('Atún', 'lata', 'producto'), ('Leche', 'lata', 'producto'),
  ('Aceite', 'botella', 'producto'), ('Arroz', 'bolsa', 'producto'),
  ('Azúcar', 'bolsa', 'producto'), ('Fideos', 'paquete', 'producto'),
  ('Cesta azul', 'unidad', 'empaque'), ('Caja navideña', 'unidad', 'empaque'),
  ('Cesta gris con tapa', 'unidad', 'empaque'), ('Cesta símil ratán', 'unidad', 'empaque'),
  ('Tarjeta de dedicatoria', 'unidad', 'empaque'), ('Cinta y lazo', 'unidad', 'empaque');

-- Recetas: una unidad de cada producto que trae la canasta, su empaque, tarjeta y lazo.
insert into public.recetas (producto_id, insumo_id, cantidad)
select p.id, i.id, 1
from (values
  ('box-navideno', array['Panetón', 'Galletas navideñas', 'Leche', 'Fideos', 'Azúcar', 'Caja navideña']),
  ('canasta-clasica', array['Panetón', 'Arroz', 'Azúcar', 'Aceite', 'Atún', 'Fideos', 'Cesta azul']),
  ('canasta-premium', array['Panetón', 'Champagne', 'Galletas navideñas', 'Duraznos', 'Atún', 'Leche', 'Cesta gris con tapa']),
  ('canasta-ejecutiva', array['Champagne', 'Panetón', 'Galletas navideñas', 'Duraznos', 'Aceite', 'Leche', 'Atún', 'Cesta símil ratán'])
) as r(slug, insumos)
cross join lateral unnest(r.insumos || array['Tarjeta de dedicatoria', 'Cinta y lazo']) as x(insumo)
join public.productos p on p.slug = r.slug
join public.insumos i on i.nombre = x.insumo;
