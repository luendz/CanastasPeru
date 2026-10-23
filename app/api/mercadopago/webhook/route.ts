import { firmaValida, obtenerPago } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Notificaciones de Mercado Pago. Llegan en dos formatos:
 * - Webhooks (?type=payment&data.id=…): firmados con x-signature; se valida la firma.
 * - IPN / Feed v2 (?topic=payment&id=…): su firma no sigue la fórmula de los
 *   Webhooks, así que no se puede validar.
 * En ambos casos el aviso no se toma como cierto: se consulta el pago en la API
 * con el access token y la base solo lo marca como pagado si está aprobado y
 * cubre el total. Un aviso falso, a lo sumo, vuelve a leer datos verdaderos.
 *
 * Responder 200 confirma el aviso; con 5xx Mercado Pago lo reintenta más tarde.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const cuerpo = (await request.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
  const webhook = url.searchParams.has("data.id") || Boolean(cuerpo?.data?.id);
  const tipo = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? cuerpo?.type;
  const pagoId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? String(cuerpo?.data?.id ?? "");

  // Otros avisos (órdenes comerciales, contracargos en revisión…) no cambian la orden.
  if (tipo !== "payment" || !/^\d+$/.test(pagoId)) return new Response(null, { status: 200 });

  if (webhook && !(await firmaValida({ firma: request.headers.get("x-signature"), requestId: request.headers.get("x-request-id"), dataId: pagoId }))) {
    console.warn(`Aviso de Mercado Pago con firma inválida (pago ${pagoId}): revisa MP_WEBHOOK_SECRET.`);
    return new Response("Firma inválida", { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    console.error("Webhook de Mercado Pago sin SUPABASE_SECRET_KEY: no se puede registrar el pago.");
    return new Response("Sin configurar", { status: 503 });
  }

  try {
    const pago = await obtenerPago(pagoId);
    if (!pago.external_reference) return new Response(null, { status: 200 });
    if (pago.currency_id !== "PEN") {
      console.error(`Pago ${pago.id} en ${pago.currency_id}: se esperaba PEN.`);
      return new Response(null, { status: 200 });
    }

    const { data, error } = await supabase.rpc("registrar_pago_mp", {
      p: {
        numero: pago.external_reference,
        payment_id: String(pago.id),
        estado: pago.status,
        estado_detalle: pago.status_detail,
        monto: pago.transaction_amount,
      },
    });
    if (error) throw new Error(error.message);
    if (data === "orden_no_encontrada") console.error(`Pago ${pago.id} con referencia ${pago.external_reference}: la orden no existe.`);
    return new Response(null, { status: 200 });
  } catch (e) {
    console.error("No se pudo registrar el aviso de Mercado Pago.", e);
    return new Response("Error", { status: 500 });
  }
}
