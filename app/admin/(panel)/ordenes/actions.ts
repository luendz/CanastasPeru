"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { CANALES, ESTADOS_ORDEN, type Orden, type OrdenItem } from "@/lib/admin/types";
import { getContenido } from "@/lib/contenido";
import type { DatosPdfOrden } from "@/lib/admin/pdf";
import { etiquetaProducto, productosPorCanasta } from "@/lib/admin/recetas";

export async function actualizarOrden(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const estadoPago = String(formData.get("estado_pago") ?? "");
  const notas = String(formData.get("notas") ?? "").slice(0, 2000);
  const canal = String(formData.get("canal") ?? "web");

  if (!ESTADOS_ORDEN.some((e) => e.id === estado)) throw new Error("Estado inválido");
  if (estadoPago !== "pendiente" && estadoPago !== "pagado") throw new Error("Estado de pago inválido");
  if (!CANALES.some((c) => c.id === canal)) throw new Error("Canal inválido");

  const { error } = await supabase.from("ordenes").update({ estado, estado_pago: estadoPago, canal, notas: notas || null }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ordenes");
  revalidatePath(`/admin/ordenes/${id}`);
  revalidatePath("/admin");
}

/** Todo lo que lleva el PDF de una orden (se arma en el navegador). */
export async function datosPdfOrden(id: string): Promise<DatosPdfOrden> {
  const { supabase } = await requireAdmin();
  const [{ data: orden, error }, { data: items }, { data: tipos }, trae, contenido] = await Promise.all([
    supabase.from("ordenes").select("*").eq("id", id).maybeSingle(),
    supabase.from("orden_items").select("*").eq("orden_id", id),
    supabase.from("tipos_canasta").select("id,nombre"),
    productosPorCanasta(supabase),
    getContenido(),
  ]);
  if (error || !orden) throw new Error("No se encontró la orden");
  const envase = new Map((tipos ?? []).map((t: { id: string; nombre: string }) => [t.id, t.nombre]));
  return {
    orden: orden as Orden,
    items: ((items ?? []) as OrdenItem[]).map((it) => ({
      ...it,
      envase: it.tipo_canasta ? envase.get(it.tipo_canasta) ?? it.tipo_canasta : "—",
      productos: it.contenido ? it.contenido.map(etiquetaProducto) : trae.get(it.producto_id ?? "") ?? [],
    })),
    marca: { nombre: contenido.marca.nombre, lema: contenido.marca.lema },
    contacto: { telefono: contenido.contacto.telefono, correo: contenido.contacto.correo },
  };
}

/** Cambio rápido de estado desde la lista de órdenes. */
export async function cambiarEstadoOrden(id: string, estado: string) {
  const { supabase } = await requireAdmin();
  if (!ESTADOS_ORDEN.some((e) => e.id === estado)) throw new Error("Estado inválido");
  const { error } = await supabase.from("ordenes").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ordenes");
  revalidatePath(`/admin/ordenes/${id}`);
  revalidatePath("/admin");
}
