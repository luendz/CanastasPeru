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
