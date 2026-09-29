"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { CANALES, ESTADOS_ORDEN, type Orden, type OrdenItem } from "@/lib/admin/types";
import { getContenido } from "@/lib/contenido";
import type { DatosPdfOrden } from "@/lib/admin/pdf";
import { productosPersonalizados, productosPorCanasta } from "@/lib/admin/recetas";

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
  const [{ data: orden, error }, { data: items }, { data: tipos }, trae, personalizados, contenido] = await Promise.all([
    supabase.from("ordenes").select("*").eq("id", id).maybeSingle(),
    supabase.from("orden_items").select("*").eq("orden_id", id),
    supabase.from("tipos_canasta").select("id,nombre"),
    productosPorCanasta(supabase),
    productosPersonalizados(supabase),
    getContenido(),
  ]);
  if (error || !orden) throw new Error("No se encontró la orden");
  const { data: cotizacion } = orden.cotizacion_id
    ? await supabase.from("cotizaciones").select("numero,cargo,asesor,forma_pago,distrito").eq("id", orden.cotizacion_id).maybeSingle()
    : { data: null };
  const envase = new Map((tipos ?? []).map((t: { id: string; nombre: string }) => [t.id, t.nombre]));
  return {
    orden: orden as Orden,
    items: ((items ?? []) as OrdenItem[]).map((it) => ({
      ...it,
      envase: it.tipo_canasta ? envase.get(it.tipo_canasta) ?? it.tipo_canasta : "—",
      productos: it.contenido ? personalizados(it.contenido) : trae.get(it.producto_id ?? "") ?? [],
    })),
    marca: { nombre: contenido.marca.nombre, lema: contenido.marca.lema, logo: contenido.marca.logo },
    contacto: { telefono: contenido.contacto.telefono, correo: contenido.contacto.correo, ciudad: contenido.contacto.ciudad },
    cotizacion,
    textos: { subtitulo: contenido.cotizacion.pdfSubtitulo, condiciones: contenido.cotizacion.pdfCondicionesOrden },
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

type EstadoEdicion = { ok?: boolean; error?: string; en?: number };
const campo = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max) || null;

/** Corrige los datos del cliente y de la entrega (el cliente a veces los envía mal). */
export async function editarDatosOrden(_prev: EstadoEdicion, fd: FormData): Promise<EstadoEdicion> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const tipo = String(fd.get("comprobante_tipo") ?? "boleta");
  const documento = (campo(fd, "comprobante_documento", 11) ?? "").replace(/\D/g, "");
  const nombre = campo(fd, "cliente_nombre", 160);
  if (!nombre) return { error: "Falta el nombre del cliente." };
  if (tipo !== "boleta" && tipo !== "factura") return { error: "Elige boleta o factura." };
  if (tipo === "factura" && !/^\d{11}$/.test(documento)) return { error: "El RUC debe tener 11 dígitos." };
  if (tipo === "boleta" && documento && !/^\d{8}$/.test(documento)) return { error: "El DNI debe tener 8 dígitos." };

  const { error } = await supabase
    .from("ordenes")
    .update({
      cliente_nombre: nombre,
      cliente_email: campo(fd, "cliente_email", 160),
      cliente_telefono: campo(fd, "cliente_telefono", 40),
      comprobante_tipo: tipo,
      comprobante_documento: documento || null,
      comprobante_nombre: campo(fd, "comprobante_nombre", 200),
      direccion_fiscal: tipo === "factura" ? campo(fd, "direccion_fiscal", 300) : null,
      distrito: campo(fd, "distrito", 80),
      direccion: campo(fd, "direccion", 300),
      referencia: campo(fd, "referencia", 300),
      fecha_entrega: campo(fd, "fecha_entrega", 10),
      horario: campo(fd, "horario", 60),
      recibe_nombre: campo(fd, "recibe_nombre", 160),
      recibe_telefono: campo(fd, "recibe_telefono", 40),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/ordenes/${id}`);
  revalidatePath("/admin/ordenes");
  revalidatePath("/admin");
  return { ok: true, en: Date.now() };
}
