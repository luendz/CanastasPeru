import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PagoMP } from "@/lib/mercadopago";
import { notificarCambioPedido, notificarPedidoRegistrado, pedidoDesdeOrden } from "@/lib/notificaciones";

/** Referencia de un intento de pago con tarjeta (aún no es orden). */
export const esIntento = (ref: string | null | undefined): ref is string => /^IP-[0-9A-F]{12}$/.test(ref ?? "");

/**
 * Registra en la base un pago de Mercado Pago ya consultado en su API.
 * - Referencia IP-… (intento con tarjeta): si el pago está aprobado y cubre el
 *   total, la base crea la orden y la marca pagada; aquí se envían los correos
 *   de pedido registrado y pago confirmado (una sola vez).
 * - Referencia OP-… (orden creada antes del cambio): se registra el pago en la
 *   orden y, si quedó pagada, se avisa al cliente.
 * Devuelve el número de la orden si existe.
 */
export async function procesarPagoMP(supabase: SupabaseClient, pago: PagoMP): Promise<{ numero: string | null }> {
  const ref = pago.external_reference;
  if (!ref) return { numero: null };
  const datosPago = { payment_id: String(pago.id), estado: pago.status, estado_detalle: pago.status_detail, monto: pago.transaction_amount };

  if (esIntento(ref)) {
    const { data, error } = await supabase.rpc("confirmar_intento_pago", { p: { referencia: ref, ...datosPago } });
    if (error) throw new Error(error.message);
    const r = data as { estado: string; numero?: string | null; orden_id?: string | null; nueva?: boolean };
    if (r.estado === "intento_no_encontrado") console.error(`Pago ${pago.id} con referencia ${ref}: el intento no existe.`);
    if (r.nueva && r.orden_id) {
      const pedido = await pedidoDesdeOrden(supabase, r.orden_id);
      if (pedido) after(async () => {
        await notificarPedidoRegistrado(pedido);
        await notificarCambioPedido(pedido, "pagado");
      });
    }
    return { numero: r.numero ?? null };
  }

  const { data: antes } = await supabase.from("ordenes").select("id,estado_pago").eq("numero", ref).maybeSingle();
  const { data, error } = await supabase.rpc("registrar_pago_mp", { p: { numero: ref, ...datosPago } });
  if (error) throw new Error(error.message);
  if (data === "orden_no_encontrada") console.error(`Pago ${pago.id} con referencia ${ref}: la orden no existe.`);

  // Si este aviso dejó la orden pagada, se avisa al cliente por correo.
  if (antes && antes.estado_pago !== "pagado") {
    const { data: ahora } = await supabase.from("ordenes").select("estado_pago").eq("id", antes.id).maybeSingle();
    if (ahora?.estado_pago === "pagado") {
      const pedido = await pedidoDesdeOrden(supabase, antes.id);
      if (pedido) after(() => notificarCambioPedido(pedido, "pagado"));
    }
  }
  return { numero: antes ? ref : null };
}
