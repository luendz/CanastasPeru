"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { insertarProducto, moverProducto } from "@/lib/admin/recetas";

const refrescar = (productoId?: string) => {
  if (productoId) revalidatePath(`/admin/catalogo/${productoId}`);
  revalidatePath("/admin/costeo");
  revalidatePath("/admin/produccion");
  revalidatePath("/admin");
};

type Cliente = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type FilaReceta = { articulo_id: string; orden: number; nombre: string };

async function filasReceta(supabase: Cliente, productoId: string): Promise<FilaReceta[]> {
  const { data, error } = await supabase.from("canasta_articulos").select("articulo_id, orden, articulos(nombre)").eq("canasta_id", productoId).order("orden");
  if (error) throw new Error(error.message);
  return (data as unknown as { articulo_id: string; orden: number; articulos: { nombre: string } }[]).map((r) => ({ articulo_id: r.articulo_id, orden: r.orden, nombre: r.articulos.nombre }));
}

/** Guarda 1, 2, 3… según la lista, tocando solo las filas que cambian. */
async function numerar(supabase: Cliente, productoId: string, lista: FilaReceta[]) {
  const cambios = await Promise.all(
    lista.flatMap((f, i) => (f.orden === i + 1 ? [] : [supabase.from("canasta_articulos").update({ orden: i + 1 }).eq("canasta_id", productoId).eq("articulo_id", f.articulo_id)])),
  );
  const fallo = cambios.find((c) => c.error);
  if (fallo?.error) throw new Error(fallo.error.message);
}

export async function guardarRecetaItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productoId = String(formData.get("canasta_id") ?? "");
  const insumoId = String(formData.get("articulo_id") ?? "");
  const cantidad = Number(formData.get("cantidad"));
  if (!productoId || !insumoId) throw new Error("Faltan datos");
  if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error("La cantidad debe ser mayor que cero");

  const filas = await filasReceta(supabase, productoId);
  if (filas.some((f) => f.articulo_id === insumoId)) {
    const { error } = await supabase.from("canasta_articulos").update({ cantidad }).eq("canasta_id", productoId).eq("articulo_id", insumoId);
    if (error) throw new Error(error.message);
  } else {
    const { data: insumo } = await supabase.from("articulos").select("nombre").eq("id", insumoId).maybeSingle();
    if (!insumo) throw new Error("Insumo no encontrado");
    const nueva: FilaReceta = { articulo_id: insumoId, orden: 0, nombre: insumo.nombre };
    const lista = insertarProducto(filas, nueva, (f) => f.nombre);
    nueva.orden = lista.indexOf(nueva) + 1;
    const { error } = await supabase.from("canasta_articulos").insert({ canasta_id: productoId, articulo_id: insumoId, cantidad, orden: nueva.orden });
    if (error) throw new Error(error.message);
    await numerar(supabase, productoId, lista);
  }
  refrescar(productoId);
}

/** Cambia la posición de un insumo en la receta y reacomoda los demás. */
export async function moverRecetaItem(productoId: string, insumoId: string, posicion: number) {
  const { supabase } = await requireAdmin();
  const filas = await filasReceta(supabase, productoId);
  const desde = filas.findIndex((f) => f.articulo_id === insumoId);
  if (desde < 0 || !Number.isFinite(posicion)) throw new Error("Faltan datos");
  await numerar(supabase, productoId, moverProducto(filas, desde, Math.round(posicion)));
  refrescar(productoId);
}

export async function quitarRecetaItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productoId = String(formData.get("canasta_id") ?? "");
  const { error } = await supabase
    .from("canasta_articulos")
    .delete()
    .eq("canasta_id", productoId)
    .eq("articulo_id", String(formData.get("articulo_id") ?? ""));
  if (error) throw new Error(error.message);
  refrescar(productoId);
}
