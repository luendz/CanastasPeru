"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { CONTENIDO_POR_DEFECTO, sanearSeccion, type SeccionContenido } from "@/lib/contenido";

export type EstadoContenido = { ok?: boolean; error?: string; en?: number };

const esSeccion = (s: string): s is SeccionContenido => Object.hasOwn(CONTENIDO_POR_DEFECTO, s);

export async function guardarContenido(_prev: EstadoContenido, form: FormData): Promise<EstadoContenido> {
  const { supabase } = await requireAdmin();
  const seccion = String(form.get("seccion") ?? "");
  if (!esSeccion(seccion)) return { error: "Sección desconocida." };

  let crudo: unknown;
  try {
    crudo = JSON.parse(String(form.get("valor") ?? "{}"));
  } catch {
    return { error: "Datos inválidos." };
  }
  const valor = sanearSeccion(seccion, crudo);

  const { error } = await supabase
    .from("contenido")
    .upsert({ clave: seccion, valor }, { onConflict: "clave" });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, en: Date.now() };
}

export async function restaurarContenido(_prev: EstadoContenido, form: FormData): Promise<EstadoContenido> {
  const { supabase } = await requireAdmin();
  const seccion = String(form.get("seccion") ?? "");
  if (!esSeccion(seccion)) return { error: "Sección desconocida." };
  const { error } = await supabase.from("contenido").update({ valor: {} }).eq("clave", seccion);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, en: Date.now() };
}
