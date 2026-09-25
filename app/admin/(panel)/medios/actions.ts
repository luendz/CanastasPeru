"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { BUCKET_MEDIOS, MEDIOS_DE_LA_WEB, urlPublicaMedio, type Medio } from "@/lib/medios";

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

/** Dónde se usa una imagen (para no borrar una que la web muestra). */
async function usosDe(url: string) {
  const { supabase } = await requireAdmin();
  const [{ data: insumos }, { data: tipos }, { data: contenido }, { data: productos }] = await Promise.all([
    supabase.from("insumos").select("nombre").eq("imagen", url),
    supabase.from("tipos_canasta").select("nombre").eq("imagen", url),
    supabase.from("contenido").select("clave, valor"),
    supabase.from("productos").select("nombre, composicion"),
  ]);
  const usos = [
    ...(insumos ?? []).map((i) => `insumo ${i.nombre}`),
    ...(tipos ?? []).map((t) => `tipo de canasta ${t.nombre}`),
    ...(productos ?? []).filter((p) => JSON.stringify(p.composicion).includes(url)).map((p) => `composición de ${p.nombre}`),
    ...(contenido ?? []).filter((c) => JSON.stringify(c.valor).includes(url)).map((c) => `contenido: ${c.clave}`),
  ];
  return usos;
}

export async function eliminarMedio(ruta: string): Promise<{ ok?: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  if (!ruta || ruta.includes("/")) return { error: "Archivo inválido." };

  const usos = await usosDe(urlPublicaMedio(ruta));
  if (usos.length) return { error: `No se puede borrar: se usa en ${usos.join(", ")}.` };

  const { error } = await supabase.storage.from(BUCKET_MEDIOS).remove([ruta]);
  if (error) return { error: error.message };
  revalidatePath("/admin/medios");
  return { ok: true };
}
