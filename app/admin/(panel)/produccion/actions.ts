"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";

const refrescar = () => {
  revalidatePath("/admin/produccion");
  revalidatePath("/admin/costeo");
  revalidatePath("/admin/compras");
  revalidatePath("/admin");
};

export async function actualizarInsumo(formData: FormData) {
  const { supabase } = await requireAdmin();
  const stockInicial = Number(formData.get("stock_inicial"));
  const stockMinimo = Number(formData.get("stock_minimo"));
  if (!Number.isFinite(stockInicial) || !Number.isFinite(stockMinimo) || stockMinimo < 0) throw new Error("Valores inválidos");

  const { error } = await supabase
    .from("insumos")
    .update({ stock_inicial: stockInicial, stock_minimo: stockMinimo })
    .eq("id", String(formData.get("id") ?? ""));
  if (error) throw new Error(error.message);
  refrescar();
}
