"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { insertarProducto, moverProducto } from "@/lib/admin/recetas";

const refrescar = () => {
  revalidatePath("/admin/costeo");
  revalidatePath("/admin/produccion");
  revalidatePath("/admin");
};

type Cliente = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type FilaReceta = { insumo_id: string; orden: number; nombre: string };

async function filasReceta(supabase: Cliente, productoId: string): Promise<FilaReceta[]> {
  const { data, error } = await supabase.from("recetas").select("insumo_id, orden, insumos(nombre)").eq("producto_id", productoId).order("orden");
  if (error) throw new Error(error.message);
  return (data as unknown as { insumo_id: string; orden: number; insumos: { nombre: string } }[]).map((r) => ({ insumo_id: r.insumo_id, orden: r.orden, nombre: r.insumos.nombre }));
}

/** Guarda 1, 2, 3… según la lista, tocando solo las filas que cambian. */
async function numerar(supabase: Cliente, productoId: string, lista: FilaReceta[]) {
  const cambios = await Promise.all(
    lista.flatMap((f, i) => (f.orden === i + 1 ? [] : [supabase.from("recetas").update({ orden: i + 1 }).eq("producto_id", productoId).eq("insumo_id", f.insumo_id)])),
  );
  const fallo = cambios.find((c) => c.error);
  if (fallo?.error) throw new Error(fallo.error.message);
}

export async function guardarRecetaItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productoId = String(formData.get("producto_id") ?? "");
  const insumoId = String(formData.get("insumo_id") ?? "");
  const cantidad = Number(formData.get("cantidad"));
  if (!productoId || !insumoId) throw new Error("Faltan datos");
  if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error("La cantidad debe ser mayor que cero");

  const filas = await filasReceta(supabase, productoId);
  if (filas.some((f) => f.insumo_id === insumoId)) {
    const { error } = await supabase.from("recetas").update({ cantidad }).eq("producto_id", productoId).eq("insumo_id", insumoId);
    if (error) throw new Error(error.message);
  } else {
    const { data: insumo } = await supabase.from("insumos").select("nombre").eq("id", insumoId).maybeSingle();
    if (!insumo) throw new Error("Insumo no encontrado");
    const nueva: FilaReceta = { insumo_id: insumoId, orden: 0, nombre: insumo.nombre };
    const lista = insertarProducto(filas, nueva, (f) => f.nombre);
    nueva.orden = lista.indexOf(nueva) + 1;
    const { error } = await supabase.from("recetas").insert({ producto_id: productoId, insumo_id: insumoId, cantidad, orden: nueva.orden });
    if (error) throw new Error(error.message);
    await numerar(supabase, productoId, lista);
  }
  refrescar();
}

/** Cambia la posición de un insumo en la receta y reacomoda los demás. */
export async function moverRecetaItem(productoId: string, insumoId: string, posicion: number) {
  const { supabase } = await requireAdmin();
  const filas = await filasReceta(supabase, productoId);
  const desde = filas.findIndex((f) => f.insumo_id === insumoId);
  if (desde < 0 || !Number.isFinite(posicion)) throw new Error("Faltan datos");
  await numerar(supabase, productoId, moverProducto(filas, desde, Math.round(posicion)));
  refrescar();
}

export async function quitarRecetaItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("recetas")
    .delete()
    .eq("producto_id", String(formData.get("producto_id") ?? ""))
    .eq("insumo_id", String(formData.get("insumo_id") ?? ""));
  if (error) throw new Error(error.message);
  refrescar();
}

/** Costos de víveres y presentación de una canasta (como la tabla del cliente). */
export async function guardarCostosCanasta(formData: FormData) {
  const { supabase } = await requireAdmin();
  const leer = (k: string) => {
    const raw = String(formData.get(k) ?? "").trim().replace(",", ".");
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) throw new Error("Costo inválido");
    return Math.round(n * 100) / 100;
  };
  const { error } = await supabase
    .from("productos")
    .update({ costo_viveres: leer("costo_viveres"), costo_presentacion: leer("costo_presentacion") })
    .eq("id", String(formData.get("producto_id") ?? ""));
  if (error) throw new Error(error.message);
  refrescar();
  revalidatePath("/admin/catalogo", "layout");
}
