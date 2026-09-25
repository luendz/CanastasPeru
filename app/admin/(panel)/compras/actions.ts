"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";

export type CompraState = { ok?: boolean; error?: string };

const texto = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max) || null;

export async function registrarCompra(_prev: CompraState, formData: FormData): Promise<CompraState> {
  const { supabase } = await requireAdmin();

  const categoria = String(formData.get("categoria") ?? "");
  if (categoria !== "produccion" && categoria !== "marketing") return { error: "Elige producción o marketing." };
  const descripcion = texto(formData.get("descripcion"), 300);
  if (!descripcion) return { error: "Escribe qué compraste." };
  const cantidad = Number(formData.get("cantidad"));
  const costoUnitario = Number(formData.get("costo_unitario"));
  if (!Number.isFinite(cantidad) || cantidad <= 0) return { error: "La cantidad debe ser mayor que cero." };
  if (!Number.isFinite(costoUnitario) || costoUnitario < 0) return { error: "El costo unitario no es válido." };

  const insumoId = categoria === "produccion" ? String(formData.get("insumo_id") ?? "") || null : null;

  const { error } = await supabase.from("compras").insert({
    fecha: String(formData.get("fecha") ?? "") || undefined,
    categoria,
    subcategoria: texto(formData.get("subcategoria"), 80),
    proveedor: texto(formData.get("proveedor"), 160),
    descripcion,
    insumo_id: insumoId,
    cantidad,
    costo_unitario: costoUnitario,
    comprobante: texto(formData.get("comprobante"), 60),
    notas: texto(formData.get("notas"), 1000),
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/compras");
  revalidatePath("/admin");
  revalidatePath("/admin/costeo");
  revalidatePath("/admin/produccion");
  return { ok: true };
}

export async function eliminarCompra(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("compras").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/compras");
  revalidatePath("/admin");
  revalidatePath("/admin/costeo");
  revalidatePath("/admin/produccion");
}
