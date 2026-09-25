// Tipos de las filas de la base usadas por el panel (ver supabase/migrations).

export type EstadoOrden = "nueva" | "pendiente" | "preparacion" | "entregada" | "anulada";
export type EstadoPago = "pendiente" | "pagado";
export type Canal = "web" | "whatsapp" | "correo";

/** Por dónde llegó el pedido o la cotización. */
export const CANALES: { id: Canal; label: string }[] = [
  { id: "web", label: "Web" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "correo", label: "Correo" },
];
export const labelCanal = (id: string) => CANALES.find((c) => c.id === id)?.label ?? id;
export type EstadoCotizacion = "pendiente" | "enviada" | "aprobada" | "rechazada";
export type CategoriaCompra = "produccion" | "marketing";

export type Orden = {
  id: string;
  numero: string;
  origen: "web" | "cotizacion" | "manual";
  canal: Canal;
  cotizacion_id: string | null;
  estado: EstadoOrden;
  estado_pago: EstadoPago;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_telefono: string | null;
  comprobante_tipo: "boleta" | "factura";
  comprobante_documento: string | null;
  comprobante_nombre: string | null;
  direccion_fiscal: string | null;
  distrito: string | null;
  direccion: string | null;
  referencia: string | null;
  fecha_entrega: string | null;
  horario: string | null;
  recibe_nombre: string | null;
  recibe_telefono: string | null;
  dedicatoria: string | null;
  metodo_pago: string | null;
  subtotal: number;
  delivery: number;
  total: number;
  notas: string | null;
  created_at: string;
};

/** Producto dentro de una canasta personalizada. */
export type ContenidoLinea = { insumo_id: string; nombre: string; cantidad: number };

export type OrdenItem = {
  id: string;
  orden_id: string;
  producto_id: string | null;
  producto_nombre: string;
  tipo_canasta: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  /** Solo en canastas personalizadas: sus productos. */
  contenido: ContenidoLinea[] | null;
};

export type Cotizacion = {
  id: string;
  numero: string;
  estado: EstadoCotizacion;
  canal: Canal;
  empresa: string;
  ruc: string | null;
  contacto: string;
  cargo: string | null;
  email: string | null;
  telefono: string | null;
  cantidad_estimada: number | null;
  presupuesto: string | null;
  fecha_requerida: string | null;
  lugar_entrega: string | null;
  canastas_base: string[];
  personalizacion: string[];
  requerimientos: string | null;
  valida_hasta: string | null;
  notas: string | null;
  created_at: string;
};

export type CotizacionItem = OrdenItem & { cotizacion_id: string };

export type Compra = {
  id: string;
  fecha: string;
  categoria: CategoriaCompra;
  subcategoria: string | null;
  proveedor: string | null;
  descripcion: string;
  insumo_id: string | null;
  cantidad: number;
  costo_unitario: number;
  total: number;
  comprobante: string | null;
  notas: string | null;
  created_at: string;
};

export type Producto = { id: string; slug: string; nombre: string; categoria: string; precio: number; tipo_canasta_base: string; activo: boolean };
export type TipoCanasta = { id: string; nombre: string; recargo: number };
export type Insumo = { id: string; nombre: string; unidad: string; tipo: "producto" | "empaque" | "otro"; stock_inicial: number; stock_minimo: number };
export type Receta = { producto_id: string; insumo_id: string; cantidad: number };
export type CosteoCanasta = { producto_id: string; slug: string; nombre: string; precio: number; costo: number; margen: number; margen_pct: number | null; insumos_sin_costo: number };
export type CostoInsumo = { insumo_id: string; nombre: string; unidad: string; tipo: string; cantidad_comprada: number; costo_promedio: number | null };
export type InventarioFila = { insumo_id: string; nombre: string; unidad: string; tipo: string; stock_minimo: number; stock_inicial: number; stock: number; requerido_pendiente: number };

export const ESTADOS_ORDEN: { id: EstadoOrden; label: string }[] = [
  // Una orden "nueva" pasa sola a "pendiente" a las 24 horas (tarea programada en la base).
  { id: "nueva", label: "Nuevo" },
  { id: "pendiente", label: "Pendiente" },
  { id: "preparacion", label: "En preparación" },
  { id: "entregada", label: "Entregado" },
  { id: "anulada", label: "Anulado" },
];

export const ESTADOS_COTIZACION: { id: EstadoCotizacion; label: string }[] = [
  { id: "pendiente", label: "Pendiente" },
  { id: "enviada", label: "Enviada" },
  { id: "aprobada", label: "Aprobada" },
  { id: "rechazada", label: "Rechazada" },
];

export const labelEstado = (id: string) =>
  [...ESTADOS_ORDEN, ...ESTADOS_COTIZACION].find((e) => e.id === id)?.label ?? id;
