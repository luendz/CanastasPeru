import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContenidoLinea } from "@/lib/admin/types";

/** Producto de una canasta con su descripción completa: "Panetón Milano Sayon 750 g". */
export type ProductoCanasta = { nombre: string; cantidad: number };

/** "Panetón" o "2 × Leche". */
export const etiquetaProducto = (c: ProductoCanasta) =>
  Number(c.cantidad) === 1 ? c.nombre : `${Number(c.cantidad)} × ${c.nombre}`;

/** Productos (insumos de tipo producto) que trae cada canasta del catálogo, según su receta. */
export async function productosPorCanasta(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("recetas")
    .select("producto_id, cantidad, insumos!inner(nombre, tipo)")
    .eq("insumos.tipo", "producto");
  const mapa = new Map<string, ProductoCanasta[]>();
  for (const r of (data ?? []) as unknown as { producto_id: string; cantidad: number; insumos: { nombre: string } }[]) {
    const lista = mapa.get(r.producto_id) ?? [];
    lista.push({ nombre: r.insumos.nombre, cantidad: Number(r.cantidad) });
    mapa.set(r.producto_id, lista);
  }
  return mapa;
}

/** Productos de una canasta personalizada, con el nombre actual de cada insumo. */
export async function productosPersonalizados(supabase: SupabaseClient) {
  const { data } = await supabase.from("insumos").select("id, nombre");
  const nombre = new Map((data ?? []).map((i: { id: string; nombre: string }) => [i.id, i.nombre]));
  return (contenido: ContenidoLinea[]): ProductoCanasta[] =>
    contenido.map((c) => ({ nombre: nombre.get(c.insumo_id) ?? c.nombre, cantidad: Number(c.cantidad) }));
}
