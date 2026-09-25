import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContenidoLinea } from "@/lib/admin/types";

/** "Panetón" o "2 × Leche". */
export const etiquetaProducto = (c: Pick<ContenidoLinea, "nombre" | "cantidad">) =>
  Number(c.cantidad) === 1 ? c.nombre : `${Number(c.cantidad)} × ${c.nombre}`;

/** Productos (insumos de tipo producto) que trae cada canasta del catálogo, según su receta. */
export async function productosPorCanasta(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("recetas")
    .select("producto_id, cantidad, insumos!inner(nombre, tipo)")
    .eq("insumos.tipo", "producto");
  const mapa = new Map<string, string[]>();
  for (const r of (data ?? []) as unknown as { producto_id: string; cantidad: number; insumos: { nombre: string } }[]) {
    const lista = mapa.get(r.producto_id) ?? [];
    lista.push(etiquetaProducto({ nombre: r.insumos.nombre, cantidad: r.cantidad }));
    mapa.set(r.producto_id, lista);
  }
  return mapa;
}
