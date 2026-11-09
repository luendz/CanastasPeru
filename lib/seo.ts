/*
 * Ayudas para buscadores (Google): URL pública, URLs absolutas y datos
 * estructurados (JSON-LD) que Google lee para entender el negocio y los
 * productos (nombre, foto, precio en soles).
 */

/** Dominio público del sitio, sin barra final. */
export const SITIO = (process.env.SITIO_URL?.trim() || "https://mkacanastas.com").replace(/\/+$/, "");

/** Convierte una ruta (/producto/x, /imgs/…) en URL absoluta del sitio. */
export const absoluta = (ruta: string) => (/^https?:\/\//.test(ruta) ? ruta : `${SITIO}${ruta.startsWith("/") ? "" : "/"}${ruta}`);

/** Páginas del sitio que no deben aparecer en Google (carrito, pago, panel…). */
export const RUTAS_PRIVADAS = ["/admin", "/api", "/carrito", "/checkout", "/confirmacion", "/buscar", "/suscribir"];

/** Script JSON-LD listo para insertar en la página. */
export function jsonLd(datos: Record<string, unknown>) {
  // "<" escapado: el texto del catálogo nunca puede cerrar la etiqueta <script>.
  return { __html: JSON.stringify(datos).replace(/</g, "\\u003c") };
}
