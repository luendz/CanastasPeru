"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import type { AjusteEnvase, ProductVisualItem } from "@/lib/mock-data";

export type GuardarState = { ok?: boolean; error?: string };

const numero = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 10) / 10)) : null;
};

/**
 * Guarda la composición visual de una canasta. La foto no se guarda aquí:
 * la web la toma del insumo con el mismo nombre (Productos → ficha del producto).
 */
export async function guardarComposicion(id: string, items: ProductVisualItem[], ajustes: Record<string, AjusteEnvase>): Promise<GuardarState> {
  const { supabase } = await requireAdmin();

  // Un producto puede ir tantas veces como unidades tenga, así que el tope es amplio.
  const MAX_ITEMS = 150;
  if (!Array.isArray(items)) return { error: "Composición inválida." };
  if (items.length > MAX_ITEMS) return { error: `La imagen admite hasta ${MAX_ITEMS} productos (tiene ${items.length}).` };
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

  const ajusteEnvase: Record<string, AjusteEnvase> = {};
  for (const [tipo, a] of Object.entries(ajustes ?? {}).slice(0, 50)) {
    const x = numero(a?.x, -50, 50);
    const y = numero(a?.y, -50, 50);
    const escala = numero(a?.escala, 40, 200);
    const giro = numero(a?.giro, -180, 180);
    if (x === null || y === null || escala === null || giro === null) return { error: "El ajuste del envase no es válido." };
    ajusteEnvase[tipo.slice(0, 80)] = { x, y, escala, giro };
  }

  const { error, count } = await supabase.from("canastas").update({ composicion: limpio, ajuste_envase: ajusteEnvase }, { count: "exact" }).eq("id", id);
  if (error) return { error: error.message };
  if (!count) return { error: "No se encontró la canasta." };
  revalidatePath(`/admin/catalogo/${id}`);
  revalidatePath("/admin/catalogo");
  return { ok: true };
}
