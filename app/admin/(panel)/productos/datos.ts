import type { SupabaseClient } from "@supabase/supabase-js";
import { fechaCorta } from "@/lib/admin/format";

/** Categorías usadas y el siguiente SKU correlativo (7 dígitos). */
export async function datosFicha(supabase: SupabaseClient) {
  const { data } = await supabase.from("insumos").select("sku,categoria");
  const filas = (data ?? []) as { sku: string; categoria: string | null }[];
  const categorias = [...new Set(filas.map((f) => f.categoria).filter(Boolean) as string[])].sort();
  const mayor = Math.max(0, ...filas.map((f) => Number(f.sku)).filter(Number.isFinite));
  return { categorias, skuSugerido: String(mayor + 1).padStart(7, "0") };
}

/** Inventario y costo (de la compra más reciente) de un producto. */
export async function datosProducto(supabase: SupabaseClient, id: string) {
  const [{ data: inv }, { data: compra }] = await Promise.all([
    supabase.from("v_inventario").select("stock,requerido_pendiente").eq("insumo_id", id).maybeSingle(),
    supabase.from("compras").select("fecha,proveedor,costo_unitario").eq("insumo_id", id).order("fecha", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    inventario: inv ? { stock: Number(inv.stock), requerido: Number(inv.requerido_pendiente) } : null,
    costo: compra ? { actual: Number(compra.costo_unitario), fecha: fechaCorta(compra.fecha), proveedor: compra.proveedor as string | null } : null,
  };
}
