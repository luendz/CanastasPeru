// Tipos de las filas de la base usadas por el panel (ver supabase/migrations).

export type EstadoOrden = "nueva" | "pagada" | "preparacion" | "en_ruta" | "entregada" | "anulada";
export type EstadoPago = "pendiente" | "pagado";
export type EstadoCotizacion = "pendiente" | "enviada" | "aprobada" | "rechazada";
export type CategoriaCompra = "produccion" | "marketing";

export type Orden = {
  id: string;
  numero: string;
  origen: "web" | "cotizacion" | "manual";
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

export type OrdenItem = {
  id: string;
  orden_id: string;
  producto_id: string | null;
  producto_nombre: string;
  tipo_canasta: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type Cotizacion = {
  id: string;
  numero: string;
  estado: EstadoCotizacion;
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
  { id: "nueva", label: "Nueva" },
  { id: "pagada", label: "Pagada" },
  { id: "preparacion", label: "En preparación" },
  { id: "en_ruta", label: "En ruta" },
  { id: "entregada", label: "Entregada" },
  { id: "anulada", label: "Anulada" },
];

export const ESTADOS_COTIZACION: { id: EstadoCotizacion; label: string }[] = [
  { id: "pendiente", label: "Pendiente" },
  { id: "enviada", label: "Enviada" },
  { id: "aprobada", label: "Aprobada" },
  { id: "rechazada", label: "Rechazada" },
];

export const labelEstado = (id: string) =>
  [...ESTADOS_ORDEN, ...ESTADOS_COTIZACION].find((e) => e.id === id)?.label ?? id;
