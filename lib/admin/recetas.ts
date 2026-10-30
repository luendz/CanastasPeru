import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContenidoLinea } from "@/lib/admin/types";

/** Producto de una canasta con su descripción completa: "Panetón Milano Sayon 750 g". */
export type ProductoCanasta = { nombre: string; cantidad: number };

/** "Panetón" o "2 × Leche". */
export const etiquetaProducto = (c: ProductoCanasta) =>
  Number(c.cantidad) === 1 ? c.nombre : `${Number(c.cantidad)} × ${c.nombre}`;

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** "Panetón PyC Bolsa", "Paneton Chocoton en Caja"… */
export const esPaneton = (nombre: string) => sinTildes(nombre).includes("paneton");

/** Agrega un producto a la lista: el panetón entra arriba (junto a los otros panetones); el resto, al final. */
export function insertarProducto<T>(lista: T[], nuevo: T, nombreDe: (x: T) => string): T[] {
  if (!esPaneton(nombreDe(nuevo))) return [...lista, nuevo];
  let i = 0;
  while (i < lista.length && esPaneton(nombreDe(lista[i]))) i++;
  return [...lista.slice(0, i), nuevo, ...lista.slice(i)];
}

/** Lleva la fila de índice `desde` a la posición indicada (la primera es 1). */
export function moverProducto<T>(lista: T[], desde: number, posicion: number): T[] {
  const resto = lista.filter((_, i) => i !== desde);
  const destino = Math.min(Math.max(posicion, 1), lista.length) - 1;
  return [...resto.slice(0, destino), lista[desde], ...resto.slice(destino)];
}

/** Productos (insumos de tipo producto) que trae cada canasta del catálogo, según su receta. */
export async function productosPorCanasta(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("recetas")
    .select("producto_id, cantidad, insumos!inner(nombre, tipo)")
    .eq("insumos.tipo", "producto")
    .order("orden");
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
