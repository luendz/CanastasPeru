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

export async function crearInsumo(formData: FormData) {
  const { supabase } = await requireAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 120);
  const tipo = String(formData.get("tipo") ?? "producto");
  if (!nombre) throw new Error("Falta el nombre");
  if (!["producto", "empaque", "otro"].includes(tipo)) throw new Error("Tipo inválido");

  const { error } = await supabase.from("insumos").insert({
    nombre,
    tipo,
    unidad: String(formData.get("unidad") ?? "").trim().slice(0, 30) || "unidad",
    stock_minimo: Number(formData.get("stock_minimo")) || 0,
  });
  if (error) throw new Error(error.code === "23505" ? "Ya existe un insumo con ese nombre" : error.message);
  refrescar();
}
