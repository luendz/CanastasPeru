"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { urlPublicaMedio } from "@/lib/medios";
import { PRESENTACIONES } from "@/lib/admin/types";

export type ProductoState = { error?: string };

const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

/** Solo imágenes de la propia web (/carpeta/archivo) o de la biblioteca del panel. */
function imagen(fd: FormData) {
  const v = txt(fd, "imagen", 400);
  if (!v) return null;
  if ((v.startsWith("/") && !v.startsWith("//")) || v.startsWith(urlPublicaMedio(""))) return v;
  return undefined;
}

const refrescar = (id?: string) => {
  for (const p of ["/admin/productos", "/admin/produccion", "/admin/costeo", "/admin/compras", "/admin/catalogo", "/admin"]) revalidatePath(p);
  if (id) revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/", "layout");
};

/**
 * Elimina un producto que no se usa en ningún lado. Si está en una receta, un
 * envase, una composición, una compra o la lista de una orden o cotización, no
 * se borra, para no perder el costo, el inventario ni el historial.
 */
export async function eliminarProducto(id: string): Promise<ProductoState> {
  const { supabase } = await requireAdmin();
  const { data: producto } = await supabase.from("articulos").select("nombre").eq("id", id).maybeSingle();
  if (!producto) return { error: "El artículo ya no existe." };

  // En jsonb, .contains() con un arreglo de objetos arma un arreglo de Postgres ("{[object Object]}") y falla;
  // con el JSON en texto PostgREST lo compara como jsonb.
  const lista = JSON.stringify([{ articulo_id: id }]);
  const [recetas, envases, compositions, compras, ordenes, cotizaciones] = await Promise.all([
    supabase.from("canasta_articulos").select("canastas(nombre)").eq("articulo_id", id),
    supabase.from("envases").select("nombre").eq("articulo_id", id),
    supabase.from("canastas").select("nombre").filter("composicion", "cs", JSON.stringify([{ name: producto.nombre }])),
    supabase.from("compras").select("id", { count: "exact", head: true }).eq("articulo_id", id),
    supabase.from("orden_items").select("id", { count: "exact", head: true }).filter("contenido", "cs", lista),
    supabase.from("cotizacion_items").select("id", { count: "exact", head: true }).filter("contenido", "cs", lista),
  ]);
  const consulta = [recetas, envases, compositions, compras, ordenes, cotizaciones].find((r) => r.error);
  if (consulta?.error) return { error: consulta.error.message };

  const nombres = (filas: { nombre: string }[] | null) => (filas ?? []).map((f) => f.nombre).join(", ");
  // Canastas donde está configurado: en su contenido o en su imagen, sin repetir.
  const enCanastas = [...new Set([
    ...((recetas.data ?? []) as unknown as { canastas: { nombre: string } | null }[]).flatMap((r) => (r.canastas ? [r.canastas.nombre] : [])),
    ...(compositions.data ?? []).map((c) => c.nombre),
  ])].sort((x, y) => x.localeCompare(y, "es", { numeric: true }));
  const usos = [
    enCanastas.length && `está configurado en ${enCanastas.length === 1 ? "la canasta" : "las canastas"} ${enCanastas.join(", ")}`,
    envases.data?.length && `es el artículo del envase ${nombres(envases.data)}`,
    compras.count && `tiene ${compras.count} ${compras.count === 1 ? "compra registrada" : "compras registradas"}`,
    ordenes.count && "está en órdenes",
    cotizaciones.count && "está en cotizaciones",
  ].filter(Boolean);
  if (usos.length) return { error: `No se puede eliminar: ${usos.join("; ")}. Quítalo de ahí primero.` };

  const { error } = await supabase.from("articulos").delete().eq("id", id);
  if (error) return { error: error.message };
  refrescar();
  return {};
}

/** Crea o actualiza la ficha de un producto (insumo). El costo y el inventario no se editan aquí. */
export async function guardarProducto(_prev: ProductoState, fd: FormData): Promise<ProductoState> {
  const { supabase } = await requireAdmin();
  const id = txt(fd, "id", 40);
  const sku = txt(fd, "sku", 30).toUpperCase();
  const nombre = txt(fd, "nombre", 160);
  const tipo = txt(fd, "tipo", 20);
  const presentacion = txt(fd, "presentacion_compra", 30) || "Unidad";
  const unidades = Number(fd.get("unidades_por_presentacion") || 1);
  const img = imagen(fd);

  if (!sku) return { error: "Falta el SKU." };
  if (!nombre) return { error: "Escribe el nombre completo del artículo (nombre, marca y presentación)." };
  if (!["producto", "envase", "otro"].includes(tipo)) return { error: "Elige el tipo." };
  if (!PRESENTACIONES.includes(presentacion)) return { error: "Elige la presentación." };
  if (!(unidades > 0)) return { error: "Las unidades por presentación deben ser mayores que cero." };
  if (img === undefined) return { error: "La imagen debe elegirse de la biblioteca." };

  const datos = {
    sku,
    nombre,
    categoria: txt(fd, "categoria", 60) || null,
    tipo,
    unidad: txt(fd, "unidad", 30) || "unidad",
    presentacion_compra: presentacion,
    unidades_por_presentacion: presentacion === "Unidad" ? 1 : unidades,
    stock_minimo: Math.max(0, Number(fd.get("stock_minimo")) || 0),
    stock_inicial: Number(fd.get("stock_inicial")) || 0,
    imagen: img,
    emoji: txt(fd, "emoji", 8) || "📦",
    costo_referencia: String(fd.get("costo_referencia") ?? "").trim() === "" ? null : Math.max(0, Number(fd.get("costo_referencia")) || 0),
  };

  const { data, error } = id
    ? await supabase.from("articulos").update(datos).eq("id", id).select("id").single()
    : await supabase.from("articulos").insert(datos).select("id").single();
  if (error) {
    if (error.code === "23505") return { error: error.message.includes("sku") ? "Ya existe un artículo con ese SKU." : "Ya existe un artículo con ese nombre." };
    return { error: error.message };
  }
  refrescar(data.id);
  redirect(`/admin/productos?guardado=${encodeURIComponent(sku)}`);
}
