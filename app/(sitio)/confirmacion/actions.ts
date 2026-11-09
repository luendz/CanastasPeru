"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { crearPreferencia, mercadoPagoConfigurado } from "@/lib/mercadopago";

/**
 * Vuelve a llevar al cliente a Mercado Pago con el pedido del checkout
 * (cookie privada): el intento con tarjeta (IP-…) o una orden ya creada
 * (OP-…). Si el total de la cookie no coincidiera, la base no lo da por
 * pagado: compara contra su propio total.
 */
export async function reintentarPago() {
  let r: { numero?: string; referencia?: string; total?: number; correo?: string; nombre?: string } | null = null;
  try {
    r = JSON.parse((await cookies()).get("mka-pedido")?.value ?? "null");
  } catch {
    /* Cookie dañada: se trata como si no hubiera pedido. */
  }
  const referencia = r?.referencia || r?.numero;
  if (!referencia || !r?.total || !mercadoPagoConfigurado()) redirect("/confirmacion");

  const confirmacion = `/confirmacion?${referencia.startsWith("IP-") ? "ref" : "pedido"}=${encodeURIComponent(referencia)}`;
  let urlPago: string;
  try {
    urlPago = await crearPreferencia({ referencia, total: r.total, email: r.correo, nombre: r.nombre });
  } catch (e) {
    console.error(`No se pudo crear la preferencia de Mercado Pago: ${e instanceof Error ? e.message : String(e)}`);
    redirect(`${confirmacion}&status=error`);
  }
  redirect(urlPago);
}
