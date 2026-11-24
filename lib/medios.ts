import { SUPABASE_URL } from "@/lib/supabase/config";

/** Bucket público de Supabase Storage con las imágenes subidas desde el panel. */
export const BUCKET_MEDIOS = "media";
export const TIPOS_IMAGEN = ["image/png", "image/jpeg", "image/webp", "image/gif"];
/** Límite del bucket para el archivo ya comprimido. */
export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;
/** Límite del archivo original elegido: se comprime antes de subir, así que puede ser mayor. */
export const MAX_BYTES_ORIGINAL = 25 * 1024 * 1024;

export type Medio = {
  url: string;
  nombre: string;
  origen: "web" | "subida";
  /** Ruta dentro del bucket (solo imágenes subidas). */
  ruta?: string;
  bytes?: number;
  creado?: string;
};

/** Imágenes que vienen con la web (carpeta public/). Se pueden usar pero no borrar. */
export const MEDIOS_DE_LA_WEB: Medio[] = [
  "/marca/mka-logo-color.webp",
  "/marca/mka-logo-blanco.webp",
  "/marca/mka-icono-2026.png",
  "/imgs_general/banner-1.webp",
  "/imgs_general/banner-1-v2.webp",
  "/imgs_general/banner-2.webp",
  "/imgs_general/banner-3-v2.webp",
  "/imgs_general/banner-4.webp",
  "/imgs_general/tarjeta-navidad.webp",
  "/imgs_general/marcas/logo-molitalia.webp",
  "/imgs_general/marcas/logo-sayon.webp",
  "/imgs_general/marcas/logo-costa.webp",
  "/imgs_general/marcas/logo-gloria.webp",
  "/imgs_general/marcas/logo-alicorp.webp",
  "/imgs_general/marcas/logo-nestle.webp",
  "/imgs_general/marcas/logo-laive.webp",
  "/imgs_general/marcas/logo-winters.webp",
  "/imgs_general/marcas/logo-paisana.webp",
  "/imgs_general/marcas/logo-primor.webp",
  "/imgs_general/marcas/logo-sol-del-cusco.webp",
  "/imgs_general/marcas/logo-bimbo.webp",
  "/imgs_general/marcas/logo-queirolo.webp",
  "/imgs_general/marcas/logo-costeno.webp",
  "/imgs_general/marcas/logo-santis.webp",
  "/imgs_general/marcas/logo-valle-norte.webp",
  "/imgs_general/marcas/logo-dulfina.webp",
  "/canastas/cesta.png",
  "/canastas/caja.png",
  "/canastas/cesta-2.png",
  "/canastas/cesta-3.png",
  "/canastas/caja-organizadora-premium.webp",
  "/canastas/canasta-mimbre-ejecutiva.webp",
  "/canastas/caja-navidena-regalos.webp",
  "/productos/paneton.png",
  "/productos/chanpagne.png",
  "/productos/galletas-navidad.png",
  "/productos/durazno.png",
  "/productos/atun.png",
  "/productos/leche.png",
  "/productos/aceite.png",
  "/productos/arroz.png",
  "/productos/azucar.png",
  "/productos/fideos.png",
].map((url) => ({ url, nombre: url.split("/").pop() ?? url, origen: "web" as const }));

/**
 * Dirección con la que la web muestra una imagen subida: pasa por la ruta /media
 * del propio sitio, que la guarda en la caché de Cloudflare. Así Supabase entrega
 * cada archivo una sola vez y no gasta su cuota de transferencia (egress) en cada visita.
 */
export const urlPublicaMedio = (ruta: string) => `/media/${ruta}`;

/** Dirección directa del archivo en Supabase Storage (solo para la ruta /media y datos antiguos). */
export const urlStorageMedio = (ruta: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_MEDIOS}/${ruta}`;

/** Ruta dentro del bucket si la dirección es de una imagen subida, en su forma nueva (/media/…) o antigua (directa a Supabase). */
export function rutaDeMedio(url: string): string | null {
  for (const prefijo of [urlPublicaMedio(""), urlStorageMedio("")]) {
    if (url.startsWith(prefijo) && url.length > prefijo.length) return url.slice(prefijo.length);
  }
  return null;
}

/** Lado mayor y calidad con que se guardan las imágenes subidas desde el panel. */
export const LADO_MAXIMO_IMAGEN = 1600;
const CALIDAD_WEBP = 0.85;

/**
 * Reduce una imagen en el navegador antes de subirla: la convierte a WebP (mantiene
 * la transparencia) con un lado mayor de LADO_MAXIMO_IMAGEN. Una foto de 1–3 MB queda
 * en unos 100–200 KB. Los GIF (pueden ser animados) y los casos en que no se gana
 * nada se suben tal cual.
 */
export async function comprimirImagen(archivo: File): Promise<File> {
  if (archivo.type === "image/gif" || typeof createImageBitmap !== "function") return archivo;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(archivo);
  } catch {
    return archivo;
  }
  const escala = Math.min(1, LADO_MAXIMO_IMAGEN / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return archivo;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", CALIDAD_WEBP));
  // Navegadores sin WebP devuelven PNG: en ese caso, o si no pesa menos, se sube el original.
  if (!blob || blob.type !== "image/webp" || blob.size >= archivo.size) return archivo;
  return new File([blob], archivo.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

/** Nombre de archivo seguro y único para subir al bucket. */
export function rutaParaSubir(nombreOriginal: string, tipo: string) {
  const ext = tipo === "image/jpeg" ? "jpg" : tipo.split("/")[1] ?? "png";
  const base = nombreOriginal
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "imagen";
  return `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
}
