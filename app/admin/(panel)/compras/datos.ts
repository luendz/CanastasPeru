import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductoCompra } from "./RegistroCompra";

/** Productos y proveedores conocidos para el formulario de compras. */
export async function datosFormulario(supabase: SupabaseClient) {
  const [{ data: productos }, { data: prov }] = await Promise.all([
    supabase.from("insumos").select("id,nombre,tipo,presentacion_compra,unidades_por_presentacion,imagen,emoji").order("nombre"),
    supabase.from("compras").select("proveedor").not("proveedor", "is", null).limit(500),
  ]);
  const proveedores = [...new Set((prov ?? []).map((p: { proveedor: string }) => p.proveedor))].sort();
  return { productos: (productos ?? []) as ProductoCompra[], proveedores };
}
