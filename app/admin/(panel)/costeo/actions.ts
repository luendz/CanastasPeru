"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";

const refrescar = () => {
  revalidatePath("/admin/costeo");
  revalidatePath("/admin/produccion");
  revalidatePath("/admin");
};

export async function guardarRecetaItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productoId = String(formData.get("producto_id") ?? "");
  const insumoId = String(formData.get("insumo_id") ?? "");
  const cantidad = Number(formData.get("cantidad"));
  if (!productoId || !insumoId) throw new Error("Faltan datos");
  if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error("La cantidad debe ser mayor que cero");

  const { error } = await supabase.from("recetas").upsert({ producto_id: productoId, insumo_id: insumoId, cantidad });
  if (error) throw new Error(error.message);
  refrescar();
}

export async function quitarRecetaItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("recetas")
    .delete()
    .eq("producto_id", String(formData.get("producto_id") ?? ""))
    .eq("insumo_id", String(formData.get("insumo_id") ?? ""));
  if (error) throw new Error(error.message);
  refrescar();
}

/** Costos de víveres y presentación de una canasta (como la tabla del cliente). */
export async function guardarCostosCanasta(formData: FormData) {
  const { supabase } = await requireAdmin();
  const leer = (k: string) => {
    const raw = String(formData.get(k) ?? "").trim().replace(",", ".");
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) throw new Error("Costo inválido");
    return Math.round(n * 100) / 100;
  };
  const { error } = await supabase
    .from("productos")
    .update({ costo_viveres: leer("costo_viveres"), costo_presentacion: leer("costo_presentacion") })
    .eq("id", String(formData.get("producto_id") ?? ""));
  if (error) throw new Error(error.message);
  refrescar();
  revalidatePath("/admin/catalogo", "layout");
}
