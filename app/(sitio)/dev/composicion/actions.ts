"use server";

import type { ProductVisualItem } from "@/lib/mock-data";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type GuardarState = { ok?: boolean; error?: string };

const numero = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 10) / 10)) : null;
};

/** Guarda la composición de una canasta en la base. Solo para administradores con sesión iniciada. */
export async function guardarComposicion(slug: string, items: ProductVisualItem[]): Promise<GuardarState> {
  if (!supabaseConfigurado) return { error: "Supabase no está configurado." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Inicia sesión en el panel (/admin) y vuelve a intentarlo." };
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return { error: "Tu cuenta no tiene permisos de administrador." };

  if (!Array.isArray(items) || items.length > 20) return { error: "Composición inválida." };
  const limpio: ProductVisualItem[] = [];
  for (const it of items) {
    const top = numero(it.top, 0, 100);
    const left = numero(it.left, 0, 100);
    const size = numero(it.size, 10, 400);
    if (typeof it.name !== "string" || !it.name || top === null || left === null || size === null) return { error: "Hay un producto con datos inválidos." };
    limpio.push({
      name: it.name.slice(0, 80),
      emoji: String(it.emoji ?? "").slice(0, 8),
      ...(it.image ? { image: String(it.image).slice(0, 200) } : {}),
      top,
      left,
      size,
      ...(it.rotate ? { rotate: numero(it.rotate, -180, 180) ?? 0 } : {}),
      ...(it.zIndex !== undefined ? { zIndex: Math.round(numero(it.zIndex, 0, 100) ?? 5) } : {}),
    });
  }

  const { error, count } = await supabase.from("productos").update({ composicion: limpio }, { count: "exact" }).eq("slug", slug);
  if (error) return { error: error.message };
  if (!count) return { error: "No se encontró la canasta." };
  return { ok: true };
}
