"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";

const refrescar = (id: string) => {
  revalidatePath("/admin/cotizaciones");
  revalidatePath(`/admin/cotizaciones/${id}`);
  revalidatePath("/admin");
};

export async function agregarItemCotizacion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const cotizacionId = String(formData.get("cotizacion_id") ?? "");
  const productoId = String(formData.get("producto_id") ?? "");
  const tipo = String(formData.get("tipo_canasta") ?? "") || null;
  const cantidad = Math.round(Number(formData.get("cantidad")));
  const precioIngresado = String(formData.get("precio_unitario") ?? "").trim();

  if (!Number.isFinite(cantidad) || cantidad < 1) throw new Error("Cantidad inválida");

  const { data: producto } = await supabase.from("productos").select("id,nombre,tipo_canasta_base").eq("id", productoId).maybeSingle();
  if (!producto) throw new Error("Canasta no encontrada");

  // Sin precio escrito, se usa el de catálogo con el tipo de canasta elegido.
  let precio = Number(precioIngresado);
  if (!precioIngresado || !Number.isFinite(precio)) {
    const { data } = await supabase.rpc("precio_canasta", { p_producto_id: producto.id, p_tipo: tipo ?? producto.tipo_canasta_base });
    precio = Number(data ?? 0);
  }
  if (precio < 0) throw new Error("Precio inválido");

  const { error } = await supabase.from("cotizacion_items").insert({
    cotizacion_id: cotizacionId,
    producto_id: producto.id,
    producto_nombre: producto.nombre,
    tipo_canasta: tipo ?? producto.tipo_canasta_base,
    cantidad,
    precio_unitario: Math.round(precio * 100) / 100,
  });
  if (error) throw new Error(error.message);
  refrescar(cotizacionId);
}

export async function quitarItemCotizacion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const cotizacionId = String(formData.get("cotizacion_id") ?? "");
  const { error } = await supabase.from("cotizacion_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refrescar(cotizacionId);
}

export async function actualizarCotizacion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!["pendiente", "enviada", "rechazada"].includes(estado)) throw new Error("Estado inválido");

  const { error } = await supabase
    .from("cotizaciones")
    .update({
      estado,
      valida_hasta: String(formData.get("valida_hasta") ?? "") || null,
      notas: String(formData.get("notas") ?? "").slice(0, 2000) || null,
    })
    .eq("id", id)
    .neq("estado", "aprobada");
  if (error) throw new Error(error.message);
  refrescar(id);
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
