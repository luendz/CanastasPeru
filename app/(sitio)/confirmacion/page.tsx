import { cookies } from "next/headers";
import Link from "next/link";
import CheckoutSteps from "@/components/CheckoutSteps";
import VaciarCarrito from "@/components/VaciarCarrito";
import SplitWords from "@/components/motion/SplitWords";
import { getContenido } from "@/lib/contenido";
import { formatPrice } from "@/lib/mock-data";
import { mercadoPagoConfigurado, obtenerPago } from "@/lib/mercadopago";
import { esIntento, procesarPagoMP } from "@/lib/pagos-mp";
import { createAdminClient } from "@/lib/supabase/admin";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { reintentarPago } from "./actions";

export const metadata = { title: "Confirmación de pedido" };

type Resumen = {
  /** Vacío mientras el pago con tarjeta no se aprueba. */
  numero: string;
  /** Intento con tarjeta (IP-…): aún no es orden. */
  referencia?: string;
  total: number;
  lineas: { nombre: string; detalle: string; cantidad: number; precio: number }[];
  distrito: string;
  fecha: string;
  pago: string;
  /** El método elegido cobra con Mercado Pago. */
  enLinea?: boolean;
  comprobante: string;
  correo: string;
};

// Papel picado: posiciones y colores fijos para que el servidor y el navegador coincidan.
const confetti = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37) % 100,
  delay: (i * 53) % 700,
  drift: ((i * 29) % 60) - 30,
  spin: ((i * 71) % 540) - 270,
  color: ["var(--gold)", "var(--gold-soft)", "var(--cream)", "#c0392b"][i % 4],
  w: 6 + (i % 3) * 3,
}));

function leerResumen(crudo: string | undefined): Resumen | null {
  try {
    const r = JSON.parse(crudo ?? "null") as Resumen | null;
    return r && typeof r.numero === "string" ? r : null;
  } catch {
    return null;
  }
}

const fechaLarga = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" }) : "";

/*
 * Número de la orden de un intento con tarjeta, si ya existe. Si Mercado Pago
 * devolvió al cliente con un pago (?payment_id=…), se consulta en su API y se
 * registra aquí mismo (no hay que esperar al webhook); si no, se lee el intento.
 */
async function numeroDeIntento(ref: string, paymentId: string | undefined): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    if (paymentId && /^\d+$/.test(paymentId) && mercadoPagoConfigurado()) {
      const pago = await obtenerPago(paymentId);
      if (pago.external_reference === ref && pago.currency_id === "PEN") return (await procesarPagoMP(supabase, pago)).numero;
    }
    const { data } = await supabase.from("intentos_pago").select("orden_numero").eq("referencia", ref).maybeSingle();
    return data?.orden_numero ?? null;
  } catch (e) {
    console.error(`No se pudo revisar el pago del intento ${ref}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

/*
 * Resultado con el que Mercado Pago devuelve al cliente (?status=…). Solo sirve
 * para el mensaje: la orden se marca como pagada con el aviso del webhook.
 */
type ResultadoPago = "aprobado" | "proceso" | "fallido" | null;

function resultadoPago(status: string | undefined): ResultadoPago {
  if (status === undefined) return null;
  if (status === "approved") return "aprobado";
  if (status === "pending" || status === "in_process") return "proceso";
  return "fallido";
}

export default async function ConfirmacionPage({ searchParams }: { searchParams: Promise<{ pedido?: string; ref?: string; total?: string; status?: string; collection_status?: string; payment_id?: string }> }) {
  const [{ pedido, ref: refUrl, total: totalUrl, status, collection_status, payment_id }, jar, { contacto }] = await Promise.all([searchParams, cookies(), getContenido()]);
  let pago = resultadoPago(status ?? collection_status);
  const r = leerResumen(jar.get("mka-pedido")?.value);
  // Pago con tarjeta: el pedido solo existe (con número) cuando el pago se aprobó.
  const ref = esIntento(refUrl) ? refUrl : !pedido && esIntento(r?.referencia) ? r.referencia : null;
  const numeroIntento = ref ? await numeroDeIntento(ref, payment_id) : null;
  const sinOrden = Boolean(ref) && !numeroIntento;
  if (sinOrden && pago !== "proceso") pago = pago === "aprobado" ? "proceso" : "fallido";
  if (numeroIntento) pago = "aprobado";
  const numero = numeroIntento ?? (r?.numero || (pedido && /^OP-\d+$/.test(pedido) ? pedido : null));
  const total = r?.total ?? (totalUrl && Number.isFinite(Number(totalUrl)) ? Number(totalUrl) : null);
  const subtotal = r ? r.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0) : 0;
  const delivery = r && total != null ? Math.max(0, total - subtotal) : 0;
  const entrega = r ? fechaLarga(r.fecha) : "";

  const reintentar = pago === "fallido" && Boolean(r?.enLinea) && mercadoPagoConfigurado();
  const pasoPago = {
    aprobado: { label: "Pago aprobado", hint: "Mercado Pago confirmó tu pago", state: "done" },
    proceso: { label: "Pago en proceso", hint: "Te avisaremos apenas Mercado Pago lo confirme", state: "current" },
    fallido: { label: "Pago no completado", hint: "Puedes intentarlo de nuevo o pagar con otro método", state: "current" },
  } as const;

  const pasos = [
    sinOrden
      ? { label: "Pedido por registrar", hint: "Se registra cuando se confirma el pago", state: "todo" }
      : { label: "Pedido registrado", hint: numero ? `N.º ${numero}` : "", state: "done" },
    pago ? pasoPago[pago] : { label: "Confirmación del pago", hint: r?.pago ? `Método elegido: ${r.pago}` : "Te indicaremos cómo pagar", state: "current" },
    { label: "Preparamos tus canastas", hint: "Las armamos a mano", state: pago === "aprobado" ? "current" : "todo" },
    { label: "Entrega", hint: entrega || "En la fecha acordada", state: "todo" },
  ] as const;

  return (
    <section className="shell cartPage">
      {numero && <VaciarCarrito />}
      <CheckoutSteps current={3} />

      <div className="successHero">
        {!sinOrden && <div className="confetti" aria-hidden="true">
          {confetti.map((c, i) => (
            <i key={i} style={{ "--x": `${c.x}%`, "--d": `${c.delay}ms`, "--dx": `${c.drift}px`, "--r": `${c.spin}deg`, "--c": c.color, "--w": `${c.w}px` } as React.CSSProperties} />
          ))}
        </div>}
        {!sinOrden && <div className="successSeal" aria-hidden="true">
          <svg viewBox="0 0 52 52"><path d="m15 27 7.5 7.5L38 18.5" /></svg>
        </div>}
        <div>
          <span className="pill">{pago === "aprobado" ? "Pago aprobado" : sinOrden ? (pago === "proceso" ? "Pago en proceso" : "Pago no completado") : pago === "fallido" ? "Pago pendiente" : "Pedido registrado"}</span>
          <h1><SplitWords text={sinOrden ? (pago === "proceso" ? "Estamos confirmando tu *pago*" : "Tu pago no se *completó*") : pago === "fallido" ? "Tu pedido está *registrado*" : "¡Gracias por tu *compra*!"} immediate offset={3} /></h1>
          <p>
            {sinOrden ? (
              pago === "proceso"
                ? <>Registraremos tu pedido apenas Mercado Pago confirme el pago{r?.correo ? <> y te avisaremos a <strong>{r.correo}</strong></> : ""}.</>
                : status === "error"
                  ? "No pudimos abrir Mercado Pago. No se hizo ningún cobro y tu pedido aún no se registró: inténtalo de nuevo en un momento."
                  : "No se hizo ningún cobro y tu pedido aún no se registró. Tu carrito sigue guardado: puedes intentarlo de nuevo o elegir otro método de pago."
            ) : pago === "aprobado" ? (
              <>Recibimos tu pago. {r?.correo ? <>Te escribiremos a <strong>{r.correo}</strong></> : "Te escribiremos"} para coordinar la entrega.</>
            ) : pago === "fallido" ? (
              status === "error" ? "No pudimos abrir Mercado Pago. Tu pedido quedó guardado: inténtalo de nuevo en un momento." : "El pago no se completó, pero tu pedido quedó guardado. Puedes intentarlo de nuevo."
            ) : (
              <>{r?.correo ? <>Te escribiremos a <strong>{r.correo}</strong></> : "Te escribiremos"} para confirmar el pago y coordinar la entrega.</>
            )}
          </p>
        </div>
        {(numero || total != null) && (
          <dl className="successMeta">
            {numero && <div><dt>Pedido</dt><dd>#{numero}</dd></div>}
            {total != null && <div><dt>Total</dt><dd>{formatPrice(total)}</dd></div>}
          </dl>
        )}
      </div>

      <div className="confirmGrid">
        <div className="confirmMain">
          <section className="formCard">
            <h3 className="confirmTitle">Estado del pedido</h3>
            <ol className="timeline">
              {pasos.map((step, i) => (
                <li key={step.label} style={{ "--i": i } as React.CSSProperties} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
                  <span className="timelineDot" aria-hidden="true">{step.state === "done" ? "✓" : ""}</span>
                  <div><strong>{step.label}</strong>{step.hint && <small>{step.hint}</small>}</div>
                </li>
              ))}
            </ol>
          </section>

          <section className="formCard">
            <h3 className="confirmTitle">Comprobante electrónico</h3>
            <p className="muted">{r?.comprobante ?? "Tu comprobante"} electrónica: te la enviaremos por correo cuando se confirme el pago.</p>
          </section>

          <div className="heroActions">
            {reintentar ? (
              <form action={reintentarPago}><button className="btn btnPrimary" type="submit">Reintentar pago</button></form>
            ) : sinOrden ? (
              <Link className="btn btnPrimary" href="/carrito">Volver al carrito</Link>
            ) : (
              <Link className="btn btnPrimary" href="/canastas">Seguir comprando</Link>
            )}
            {reintentar && sinOrden && <Link className="btn btnGhost" href="/checkout">Elegir otro método de pago</Link>}
            {numero && <Link className="btn btnGhost" href={`/seguimiento?pedido=${encodeURIComponent(numero)}`}>Seguir mi pedido</Link>}
            {contacto.telefono && numero && (
              <a className="btn btnGhost" href={enlaceWhatsApp(contacto.telefono, `Hola, acabo de registrar el pedido ${numero}.`)} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
            )}
          </div>
        </div>

        {r && (
          <aside className="summaryCard">
            <h3>Resumen</h3>
            <ul className="summaryItems">
              {r.lineas.map((l, i) => (
                <li key={i}>
                  <span className="summaryThumb summaryThumbCard" aria-hidden="true">✦<b>{l.cantidad}</b></span>
                  <span className="summaryItemName">{l.nombre}<small>{[l.detalle, `${formatPrice(l.precio)} c/u`].filter(Boolean).join(" · ")}</small></span>
                  <strong>{formatPrice(l.precio * l.cantidad)}</strong>
                </li>
              ))}
            </ul>
            <hr />
            <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
            <div><span>Delivery{r.distrito ? ` · ${r.distrito}` : ""}</span><strong>{formatPrice(delivery)}</strong></div>
            <hr />
            <div className="summaryTotal"><span>Total</span><strong>{formatPrice(total ?? subtotal)}</strong></div>
            <dl className="orderFacts">
              {entrega && <div><dt>Entrega</dt><dd>{entrega}</dd></div>}
              {r.pago && <div><dt>Pago</dt><dd>{r.pago}</dd></div>}
            </dl>
            <p className="summaryB2B">¿Dudas con tu pedido? Escríbenos a <strong>{contacto.correo}</strong></p>
            {numero && <p className="summaryB2B">Guarda tu número <strong>{numero}</strong>: con él y tu correo o celular puedes ver el estado en <Link href={`/seguimiento?pedido=${encodeURIComponent(numero)}`}>Seguir mi pedido</Link>.</p>}
          </aside>
        )}
      </div>
    </section>
  );
}
