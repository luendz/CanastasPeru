"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { crearPreferencia, mercadoPagoConfigurado } from "@/lib/mercadopago";
import { notificarComprobante } from "@/lib/notificaciones";
import { createAdminClient } from "@/lib/supabase/admin";

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

export type ComprobanteState = { ok?: boolean; error?: string };

const TIPOS_IMAGEN: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Recibe la captura del pago (Yape / Plin) del pedido recién registrado. El
 * pedido sale de la cookie privada del checkout, no del formulario: nadie
 * puede adjuntar un comprobante a un pedido ajeno. La imagen va a un bucket
 * privado con la secret key; la orden sigue pendiente hasta que se verifique.
 */
export async function enviarComprobante(_prev: ComprobanteState, fd: FormData): Promise<ComprobanteState> {
  let numero = "";
  try {
    numero = (JSON.parse((await cookies()).get("mka-pedido")?.value ?? "null") as { numero?: string } | null)?.numero ?? "";
  } catch {
    /* Cookie dañada. */
  }
  if (!/^OP-\d+$/.test(numero)) return { error: "No encontramos tu pedido. Envíanos la captura por WhatsApp, por favor." };

  const archivo = fd.get("comprobante");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elige la captura de tu pago." };
  const ext = TIPOS_IMAGEN[archivo.type];
  if (!ext) return { error: "La captura debe ser una imagen JPG, PNG o WEBP." };
  if (archivo.size > 5 * 1024 * 1024) return { error: "La imagen pesa más de 5 MB. Prueba con otra captura." };

  const supabase = createAdminClient();
  if (!supabase) return { error: "No pudimos recibir tu comprobante ahora. Envíanoslo por WhatsApp, por favor." };

  const { data: orden } = await supabase.from("ordenes").select("id,numero,cliente_nombre,total,estado_pago").eq("numero", numero).is("eliminado_at", null).maybeSingle();
  if (!orden) return { error: "No encontramos tu pedido. Envíanos la captura por WhatsApp, por favor." };
  if (orden.estado_pago === "pagado") return { ok: true };

  const ruta = `${numero}/${Date.now()}.${ext}`;
  const { error: errSubida } = await supabase.storage.from("comprobantes").upload(ruta, archivo, { contentType: archivo.type, upsert: false });
  if (errSubida) {
    console.error(`No se pudo subir el comprobante de ${numero}: ${errSubida.message}`);
    return { error: "No pudimos subir la imagen. Inténtalo de nuevo en un momento." };
  }
  const { error } = await supabase.from("ordenes").update({ comprobante_pago: ruta, comprobante_pago_at: new Date().toISOString() }).eq("id", orden.id);
  if (error) {
    console.error(`No se pudo guardar el comprobante de ${numero}: ${error.message}`);
    return { error: "No pudimos guardar tu comprobante. Inténtalo de nuevo en un momento." };
  }

  after(() => notificarComprobante({ numero, nombre: orden.cliente_nombre, total: Number(orden.total) }));
  return { ok: true };
}
