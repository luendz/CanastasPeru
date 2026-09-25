"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import type { ProductVisualItem } from "@/lib/mock-data";

export type GuardarState = { ok?: boolean; error?: string };

const numero = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 10) / 10)) : null;
};

/**
 * Guarda la composición visual de una canasta. La foto no se guarda aquí:
 * la web la toma del insumo con el mismo nombre (Catálogo → Fotos de productos).
 */
export async function guardarComposicion(id: string, items: ProductVisualItem[]): Promise<GuardarState> {
  const { supabase } = await requireAdmin();

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
      top,
      left,
      size,
      ...(it.rotate ? { rotate: numero(it.rotate, -180, 180) ?? 0 } : {}),
      ...(it.zIndex !== undefined ? { zIndex: Math.round(numero(it.zIndex, 0, 100) ?? 5) } : {}),
    });
  }

  const { error, count } = await supabase.from("productos").update({ composicion: limpio }, { count: "exact" }).eq("id", id);
  if (error) return { error: error.message };
  if (!count) return { error: "No se encontró la canasta." };
  revalidatePath(`/admin/catalogo/${id}`);
  revalidatePath("/admin/catalogo");
  return { ok: true };
}
