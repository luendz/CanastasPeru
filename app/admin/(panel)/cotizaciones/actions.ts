"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import type { DatosPdfCotizacion } from "@/lib/admin/pdf";
import { productosPersonalizados, productosPorCanasta } from "@/lib/admin/recetas";
import { CANALES, type ContenidoLinea, type Cotizacion, type CotizacionItem } from "@/lib/admin/types";
import { getContenido } from "@/lib/contenido";

export type EstadoForm = { ok?: boolean; error?: string; en?: number };

const refrescar = (id: string) => {
  revalidatePath("/admin/cotizaciones");
  revalidatePath(`/admin/cotizaciones/${id}`);
  revalidatePath("/admin");
};

const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
const canalValido = (c: string) => CANALES.some((x) => x.id === c);

/** Cotización cargada desde el panel (pedidos que llegan por WhatsApp o correo). */
export async function crearCotizacion(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const empresa = txt(fd, "empresa", 200);
  const contacto = txt(fd, "contacto", 160);
  const canal = txt(fd, "canal", 20);
  if (!empresa || !contacto) return { error: "Completa el cliente / empresa y el nombre de contacto." };
  if (!canalValido(canal)) return { error: "Elige por dónde llegó el pedido." };
  const cantidad = Math.round(Number(fd.get("cantidad_estimada") || 0));

  const { data, error } = await supabase
    .from("cotizaciones")
    .insert({
      canal,
      empresa,
      ruc: txt(fd, "ruc", 11) || null,
      contacto,
      cargo: txt(fd, "cargo", 120) || null,
      email: txt(fd, "email", 160) || null,
      telefono: txt(fd, "telefono", 40) || null,
      cantidad_estimada: cantidad > 0 ? cantidad : null,
      presupuesto: txt(fd, "presupuesto", 60) || null,
      fecha_requerida: txt(fd, "fecha_requerida", 10) || null,
      lugar_entrega: txt(fd, "lugar_entrega", 300) || null,
      distrito: txt(fd, "distrito", 120) || null,
      requerimientos: txt(fd, "requerimientos", 2000) || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  refrescar(data.id);
  redirect(`/admin/cotizaciones/${data.id}`);
}

/** Valida la lista de productos de una canasta personalizada contra los insumos registrados. */
async function contenidoPersonalizado(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], crudo: string) {
  let lista: unknown;
  try {
    lista = JSON.parse(crudo || "[]");
  } catch {
    return { error: "La lista de productos no es válida." };
  }
  if (!Array.isArray(lista) || lista.length === 0) return { error: "Agrega al menos un producto a la canasta personalizada." };
  if (lista.length > 40) return { error: "Demasiados productos." };

  const { data: insumos } = await supabase.from("insumos").select("id,nombre");
  const nombreDe = new Map((insumos ?? []).map((i: { id: string; nombre: string }) => [i.id, i.nombre]));
  const contenido: ContenidoLinea[] = [];
  for (const x of lista as { insumo_id?: string; cantidad?: number }[]) {
    const nombre = x.insumo_id ? nombreDe.get(x.insumo_id) : undefined;
    const cantidad = Number(x.cantidad);
    if (!nombre || !Number.isFinite(cantidad) || cantidad <= 0) return { error: "Hay un producto inválido en la lista." };
    contenido.push({ insumo_id: x.insumo_id!, nombre, cantidad: Math.round(cantidad * 100) / 100 });
  }
  return { contenido };
}

export async function agregarItemCotizacion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const cotizacionId = String(formData.get("cotizacion_id") ?? "");
  const productoId = String(formData.get("producto_id") ?? "");
  const tipo = String(formData.get("tipo_canasta") ?? "") || null;
  const cantidad = Math.round(Number(formData.get("cantidad")));
  const precioIngresado = String(formData.get("precio_unitario") ?? "").trim();

  if (!productoId) return { error: "Elige una canasta." };
  if (!Number.isFinite(cantidad) || cantidad < 1) return { error: "La cantidad debe ser 1 o más." };

  let fila: { producto_id: string | null; producto_nombre: string; tipo_canasta: string | null; contenido: ContenidoLinea[] | null };
  let precio = Number(precioIngresado);

  if (productoId === "personalizada") {
    if (!tipo) return { error: "Elige el envase de la canasta personalizada." };
    if (!precioIngresado || !Number.isFinite(precio) || precio <= 0) return { error: "Escribe el precio unitario de la canasta personalizada." };
    const r = await contenidoPersonalizado(supabase, String(formData.get("contenido") ?? ""));
    if ("error" in r) return { error: r.error };
    fila = { producto_id: null, producto_nombre: txt(formData, "nombre", 120) || "Canasta personalizada", tipo_canasta: tipo, contenido: r.contenido! };
  } else {
    const { data: producto } = await supabase.from("productos").select("id,nombre,tipo_canasta_base").eq("id", productoId).maybeSingle();
    if (!producto) return { error: "Canasta no encontrada." };
    // Sin precio escrito, se usa el de catálogo con el envase elegido.
    if (!precioIngresado || !Number.isFinite(precio)) {
      const { data } = await supabase.rpc("precio_canasta", { p_producto_id: producto.id, p_tipo: tipo ?? producto.tipo_canasta_base });
      precio = Number(data ?? 0);
    }
    fila = { producto_id: producto.id, producto_nombre: producto.nombre, tipo_canasta: tipo ?? producto.tipo_canasta_base, contenido: null };
  }
  if (precio < 0) return { error: "Precio inválido." };

  const { error } = await supabase.from("cotizacion_items").insert({
    cotizacion_id: cotizacionId,
    ...fila,
    cantidad,
    precio_unitario: Math.round(precio * 100) / 100,
  });
  if (error) return { error: error.message };
  refrescar(cotizacionId);
  return { ok: true, en: Date.now() };
}

export async function quitarItemCotizacion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const cotizacionId = String(formData.get("cotizacion_id") ?? "");
  const { error } = await supabase.from("cotizacion_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refrescar(cotizacionId);
}

export async function actualizarCotizacion(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const canal = String(formData.get("canal") ?? "");
  if (!["pendiente", "enviada", "rechazada"].includes(estado)) return { error: "Estado inválido." };
  if (!canalValido(canal)) return { error: "Origen inválido." };

  const { error } = await supabase
    .from("cotizaciones")
    .update({
      estado,
      canal,
      valida_hasta: String(formData.get("valida_hasta") ?? "") || null,
      asesor: txt(formData, "asesor", 120) || null,
      forma_pago: txt(formData, "forma_pago", 200) || null,
      horario_entrega: txt(formData, "horario_entrega", 120) || null,
      distrito: txt(formData, "distrito", 120) || null,
      notas: String(formData.get("notas") ?? "").slice(0, 2000) || null,
    })
    .eq("id", id)
    .neq("estado", "aprobada");
  if (error) return { error: error.message };
  refrescar(id);
  return { ok: true, en: Date.now() };
}

export async function aprobarCotizacion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { data: ordenId, error } = await supabase.rpc("aprobar_cotizacion", { p_cotizacion_id: id });
  if (error) throw new Error(error.message);
  refrescar(id);
  revalidatePath("/admin/ordenes");
  redirect(`/admin/ordenes/${ordenId}`);
}

/** Todo lo que lleva el PDF de una cotización (se arma en el navegador). */
export async function datosPdfCotizacion(id: string): Promise<DatosPdfCotizacion> {
  const { supabase } = await requireAdmin();
  const [{ data: cot }, { data: items }, { data: tipos }, productos, personalizados, contenido] = await Promise.all([
    supabase.from("cotizaciones").select("*").eq("id", id).maybeSingle(),
    supabase.from("cotizacion_items").select("*").eq("cotizacion_id", id),
    supabase.from("tipos_canasta").select("id,nombre"),
    productosPorCanasta(supabase),
    productosPersonalizados(supabase),
    getContenido(),
  ]);
  if (!cot) throw new Error("No se encontró la cotización");
  const envase = new Map((tipos ?? []).map((t: { id: string; nombre: string }) => [t.id, t.nombre]));
  return {
    cotizacion: cot as Cotizacion,
    items: ((items ?? []) as CotizacionItem[]).map((it) => ({
      ...it,
      envase: it.tipo_canasta ? envase.get(it.tipo_canasta) ?? it.tipo_canasta : "—",
      productos: it.contenido ? personalizados(it.contenido) : productos.get(it.producto_id ?? "") ?? [],
    })),
    marca: { nombre: contenido.marca.nombre, lema: contenido.marca.lema, logo: contenido.marca.logo },
    contacto: { telefono: contenido.contacto.telefono, correo: contenido.contacto.correo, ciudad: contenido.contacto.ciudad },
    textos: {
      subtitulo: contenido.cotizacion.pdfSubtitulo,
      formaPago: contenido.cotizacion.pdfFormaPago,
      horarioEntrega: contenido.cotizacion.pdfHorarioEntrega,
      condiciones: contenido.cotizacion.pdfCondiciones,
    },
  };
}
