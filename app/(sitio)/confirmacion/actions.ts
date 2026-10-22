"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { crearPreferencia, mercadoPagoConfigurado } from "@/lib/mercadopago";

/**
 * Vuelve a llevar al cliente a Mercado Pago con el pedido recién registrado
 * (cookie privada del checkout). Si el total de la cookie no coincidiera con
 * la orden, la base no la marca como pagada: compara contra su propio total.
 */
export async function reintentarPago() {
  let r: { numero?: string; total?: number; correo?: string; nombre?: string } | null = null;
  try {
    r = JSON.parse((await cookies()).get("mka-pedido")?.value ?? "null");
  } catch {
    /* Cookie dañada: se trata como si no hubiera pedido. */
  }
  if (!r?.numero || !r.total || !mercadoPagoConfigurado()) redirect("/confirmacion");

  const confirmacion = `/confirmacion?pedido=${encodeURIComponent(r.numero)}`;
  let urlPago: string;
  try {
    urlPago = await crearPreferencia({ numero: r.numero, total: r.total, email: r.correo, nombre: r.nombre });
  } catch (e) {
    console.error("No se pudo crear la preferencia de Mercado Pago.", e);
    redirect(`${confirmacion}&status=error`);
  }
  redirect(urlPago);
}
