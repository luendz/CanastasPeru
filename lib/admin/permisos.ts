/*
 * Catálogo de secciones del panel y de las acciones que se pueden permitir
 * en cada una. La clave de una sección ("ordenes") da acceso a entrar; la de
 * una acción ("ordenes.estado") permite hacerla. Se guardan en rol_permisos.
 * El rol Administrador las tiene todas y además gestiona usuarios y roles.
 */

export type Accion = { id: string; nombre: string };
export type Seccion = { id: string; nombre: string; href: string; acciones: Accion[] };

export const SECCIONES: Seccion[] = [
  { id: "inicio", nombre: "Inicio", href: "/admin", acciones: [{ id: "montos", nombre: "Ver montos y ganancias" }] },
  {
    id: "ordenes", nombre: "Órdenes", href: "/admin/ordenes",
    acciones: [
      { id: "montos", nombre: "Ver montos y totales" },
      { id: "estado", nombre: "Cambiar estado" },
      { id: "pagar", nombre: "Marcar como pagada" },
      { id: "comprobantes", nombre: "Ver comprobantes de pago" },
      { id: "editar", nombre: "Editar datos del cliente y la entrega" },
      { id: "pdf", nombre: "Descargar PDF" },
      { id: "eliminar", nombre: "Eliminar y restaurar" },
      { id: "intentos", nombre: "Ver pagos no completados" },
    ],
  },
  {
    id: "cotizaciones", nombre: "Cotizaciones", href: "/admin/cotizaciones",
    acciones: [
      { id: "crear", nombre: "Crear cotizaciones" },
      { id: "editar", nombre: "Editar productos y datos" },
      { id: "aprobar", nombre: "Aprobar (pasa a orden)" },
      { id: "pdf", nombre: "Descargar PDF" },
      { id: "eliminar", nombre: "Eliminar y restaurar" },
    ],
  },
  {
    id: "catalogo", nombre: "Catálogo", href: "/admin/catalogo",
    acciones: [
      { id: "editar", nombre: "Editar textos y fotos de canastas" },
      { id: "precios", nombre: "Cambiar precios" },
      { id: "visibilidad", nombre: "Crear, activar y ocultar canastas" },
      { id: "envases", nombre: "Gestionar envases" },
      { id: "composicion", nombre: "Editar composición" },
      { id: "delivery", nombre: "Zonas y tarifas de delivery" },
    ],
  },
  {
    id: "contenido", nombre: "Contenido web", href: "/admin/contenido",
    acciones: [
      { id: "editar", nombre: "Editar textos e imágenes" },
      { id: "restaurar", nombre: "Restaurar valores originales" },
    ],
  },
  { id: "suscriptores", nombre: "Suscriptores", href: "/admin/suscriptores", acciones: [{ id: "exportar", nombre: "Copiar y descargar correos" }] },
  {
    id: "articulos", nombre: "Artículos", href: "/admin/productos",
    acciones: [
      { id: "editar", nombre: "Crear y editar artículos" },
      { id: "eliminar", nombre: "Eliminar artículos" },
      { id: "costos", nombre: "Ver costos" },
      { id: "medios", nombre: "Subir y borrar imágenes" },
    ],
  },
  {
    id: "compras", nombre: "Costos totales", href: "/admin/compras",
    acciones: [
      { id: "registrar", nombre: "Registrar y editar compras" },
      { id: "eliminar", nombre: "Eliminar compras" },
    ],
  },
  { id: "costeo", nombre: "Costeo por canasta", href: "/admin/costeo", acciones: [{ id: "editar", nombre: "Editar recetas" }] },
  { id: "produccion", nombre: "Producción e inventario", href: "/admin/produccion", acciones: [{ id: "stock", nombre: "Actualizar stock" }] },
  { id: "reportes", nombre: "Reportes Excel", href: "/admin/reportes", acciones: [{ id: "descargar", nombre: "Descargar reportes" }] },
];

/** Todas las claves válidas (secciones y acciones). */
export const CLAVES = new Set(SECCIONES.flatMap((s) => [s.id, ...s.acciones.map((a) => `${s.id}.${a.id}`)]));

export type MisPermisos = { rol: string; administrador: boolean; permisos: string[] };

/** ¿Este usuario puede usar este permiso (sección o acción)? */
export const puede = (p: MisPermisos | null | undefined, clave: string) => Boolean(p && (p.administrador || p.permisos.includes(clave)));

/** Sección del panel a la que corresponde una ruta (/admin/medios cuenta como Artículos). */
export function seccionDeRuta(ruta: string): Seccion | undefined {
  if (ruta === "/admin" || ruta === "/admin/") return SECCIONES[0];
  if (ruta.startsWith("/admin/medios")) return SECCIONES.find((s) => s.id === "articulos");
  return SECCIONES.find((s) => s.href !== "/admin" && ruta.startsWith(s.href));
}
