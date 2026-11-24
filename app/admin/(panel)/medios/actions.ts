"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { BUCKET_MEDIOS, MEDIOS_DE_LA_WEB, urlPublicaMedio, urlStorageMedio, type Medio } from "@/lib/medios";

/** Biblioteca completa: imágenes de la web + subidas al bucket. */
export async function listarMedios(): Promise<Medio[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.storage.from(BUCKET_MEDIOS).list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw new Error(error.message);
  const subidas: Medio[] = (data ?? [])
    .filter((f) => f.id && !f.name.startsWith("."))
    .map((f) => ({
      url: urlPublicaMedio(f.name),
      nombre: f.name,
      origen: "subida",
      ruta: f.name,
      bytes: (f.metadata as { size?: number } | null)?.size,
      creado: f.created_at ?? undefined,
    }));
  return [...subidas, ...MEDIOS_DE_LA_WEB];
}

/** Dónde se usa una imagen (para no borrar una que la web muestra), con su dirección nueva (/media/…) o antigua (directa a Supabase). */
async function usosDe(ruta: string) {
  const { supabase } = await requireAdmin();
  const urls = [urlPublicaMedio(ruta), urlStorageMedio(ruta)];
  const usa = (v: unknown) => urls.some((u) => JSON.stringify(v ?? null).includes(u));
  const [{ data: insumos }, { data: tipos }, { data: contenido }, { data: productos }] = await Promise.all([
    supabase.from("articulos").select("nombre").in("imagen", urls),
    supabase.from("envases").select("nombre").in("imagen", urls),
    supabase.from("contenido").select("clave, valor"),
    supabase.from("canastas").select("nombre, composicion, imagen"),
  ]);
  const usos = [
    ...(insumos ?? []).map((i) => `insumo ${i.nombre}`),
    ...(tipos ?? []).map((t) => `tipo de canasta ${t.nombre}`),
    ...(productos ?? []).filter((p) => usa(p.composicion)).map((p) => `composición de ${p.nombre}`),
    ...(productos ?? []).filter((p) => urls.includes(p.imagen)).map((p) => `foto de ${p.nombre}`),
    ...(contenido ?? []).filter((c) => usa(c.valor)).map((c) => `contenido: ${c.clave}`),
  ];
  return usos;
}

export async function eliminarMedio(ruta: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  if (!ruta || ruta.includes("/")) return { error: "Archivo inválido." };

  const usos = await usosDe(ruta);
  if (usos.length) return { error: `No se puede borrar: se usa en ${usos.join(", ")}.` };

  const { error } = await supabase.storage.from(BUCKET_MEDIOS).remove([ruta]);
  if (error) return { error: error.message };
  revalidatePath("/admin/medios");
  return { ok: true };
}
