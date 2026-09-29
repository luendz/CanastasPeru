import { SUPABASE_URL } from "@/lib/supabase/config";

/** Bucket público de Supabase Storage con las imágenes subidas desde el panel. */
export const BUCKET_MEDIOS = "media";
export const TIPOS_IMAGEN = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;

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
  "/marca/mka-logo.webp",
  "/marca/mka-icono.png",
  "/imgs_general/banner-1.webp",
  "/imgs_general/banner-2.webp",
  "/imgs_general/banner-3-v2.webp",
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
  "/canastas/cesta.png",
  "/canastas/caja.png",
  "/canastas/cesta-2.png",
  "/canastas/cesta-3.png",
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

export const urlPublicaMedio = (ruta: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_MEDIOS}/${ruta}`;

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
