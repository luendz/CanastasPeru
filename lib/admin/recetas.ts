import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContenidoLinea } from "@/lib/admin/types";

/** Producto de una canasta con su presentación: "Panetón Milano Sayon 750 g". */
export type ProductoCanasta = { nombre: string; cantidad: number };

/** "Panetón" o "2 × Leche". */
export const etiquetaProducto = (c: ProductoCanasta) =>
  Number(c.cantidad) === 1 ? c.nombre : `${Number(c.cantidad)} × ${c.nombre}`;

const conPresentacion = (nombre: string, presentacion: string | null | undefined) =>
  presentacion ? `${nombre} ${presentacion}` : nombre;

/** Productos (insumos de tipo producto) que trae cada canasta del catálogo, según su receta. */
export async function productosPorCanasta(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("recetas")
    .select("producto_id, cantidad, insumos!inner(nombre, tipo, presentacion)")
    .eq("insumos.tipo", "producto");
  const mapa = new Map<string, ProductoCanasta[]>();
  for (const r of (data ?? []) as unknown as { producto_id: string; cantidad: number; insumos: { nombre: string; presentacion: string | null } }[]) {
    const lista = mapa.get(r.producto_id) ?? [];
    lista.push({ nombre: conPresentacion(r.insumos.nombre, r.insumos.presentacion), cantidad: Number(r.cantidad) });
    mapa.set(r.producto_id, lista);
  }
  return mapa;
}

/** Productos de una canasta personalizada, con la presentación actual de cada insumo. */
export async function productosPersonalizados(supabase: SupabaseClient) {
  const { data } = await supabase.from("insumos").select("id, presentacion");
  const presentacion = new Map((data ?? []).map((i: { id: string; presentacion: string | null }) => [i.id, i.presentacion]));
  return (contenido: ContenidoLinea[]): ProductoCanasta[] =>
    contenido.map((c) => ({ nombre: conPresentacion(c.nombre, presentacion.get(c.insumo_id)), cantidad: Number(c.cantidad) }));
}
