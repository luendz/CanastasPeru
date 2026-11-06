"use client";

import { useActionState, useState } from "react";
import { buscarPedido, type PedidoSeguimiento, type SeguimientoState } from "@/app/(sitio)/seguimiento/actions";
import ProductComposition from "@/components/ProductComposition";
import { formatPrice } from "@/lib/mock-data";
import { enlaceWhatsApp } from "@/lib/whatsapp";

/** Mensaje de WhatsApp para pedir ayuda con un pedido; incluye el número si el cliente ya lo escribió. */
function mensajeSeguimiento(numero: string, estado?: string) {
  const n = numero.trim();
  if (!n) return "¡Hola! 👋 Quiero hacer seguimiento a mi pedido, pero no tengo el número a la mano. ¿Me ayudan a encontrarlo? Les comparto mi nombre y el correo o celular con el que compré:";
  if (estado) return `¡Hola! 👋 Quiero consultar por mi pedido *${n}* (estado: ${estado}). ¿Me pueden dar más detalles?`;
  return `¡Hola! 👋 Quiero hacer seguimiento a mi pedido *${n}*. ¿Me ayudan a encontrarlo?`;
}

function BotonWhatsApp({ telefono, texto, children }: { telefono: string; texto: string; children: React.ReactNode }) {
  return (
    <a className="btn seguimientoWsp" href={enlaceWhatsApp(telefono, texto)} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm4.6 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5-.3.4c-.1.1-.2.3-.1.5.2.3.7 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.2.1.4.1.5 0l.8-.9c.2-.2.3-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z" /></svg>
      {children}
    </a>
  );
}

const fechaLarga = (iso: string | null) =>
  iso && /^\d{4}-\d{2}-\d{2}/.test(iso)
    ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })
    : "";

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Lima" });

type Paso = { label: string; hint: string; state: "done" | "current" | "todo" };

/** Pasos que ve el cliente, a partir del estado interno de la orden. */
function pasos(p: PedidoSeguimiento): Paso[] {
  const pagado = p.estado_pago === "pagado";
  const preparando = p.estado === "preparacion";
  const entregado = p.estado === "entregada";
  const entrega = [fechaLarga(p.fecha_entrega), p.horario].filter(Boolean).join(" · ");
  return [
    { label: "Pedido registrado", hint: fechaHora(p.creado), state: "done" },
    {
      label: pagado ? "Pago confirmado" : "Confirmación del pago",
      hint: pagado ? "Recibimos tu pago" : p.metodo_pago ? `Método elegido: ${p.metodo_pago}` : "Te indicaremos cómo pagar",
      state: pagado || preparando || entregado ? "done" : "current",
    },
    {
      label: "Preparamos tus canastas",
      hint: entregado ? "Listas y empacadas" : preparando ? "Las estamos armando a mano" : "Empezamos al confirmar el pago",
      state: entregado ? "done" : preparando ? "current" : "todo",
    },
    {
      label: entregado ? "Entregado" : "Entrega",
      hint: entregado ? "¡Gracias por tu compra!" : entrega || "En la fecha acordada",
      state: entregado ? "done" : "todo",
    },
  ];
}

function etiquetaEstado(p: PedidoSeguimiento) {
  if (p.estado === "anulada") return "Anulado";
  if (p.estado === "entregada") return "Entregado";
  if (p.estado === "preparacion") return "En preparación";
  return p.estado_pago === "pagado" ? "Pago confirmado" : "Pago pendiente";
}

export default function SeguimientoPedido({ numeroInicial, correoContacto, telefono }: { numeroInicial?: string; correoContacto: string; telefono: string }) {
  const [state, action, pending] = useActionState<SeguimientoState, FormData>(buscarPedido, { numero: numeroInicial });
  // Número que va escribiendo el cliente, para ponerlo en el mensaje de WhatsApp.
  const [numero, setNumero] = useState(numeroInicial ?? "");
  const p = state.pedido;

  return (
    <div className="seguimiento">
      <form action={action} className="formCard seguimientoForm">
        <div className="formGrid">
          <label>
            Número de pedido
            <input className="input" name="numero" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="OP-0012" required maxLength={20} autoComplete="off" />
          </label>
          <label>
            Correo o celular de la compra
            <input className="input" name="contacto" placeholder="correo@ejemplo.com o 999 999 999" required maxLength={160} autoComplete="email" />
          </label>
        </div>
        <small className="muted">El número de pedido aparece en la confirmación de tu compra.</small>
        {state.error && <p className="checkoutError" role="alert">{state.error}</p>}
        <div className="seguimientoAcciones">
          <button className="btn btnPrimary" type="submit" disabled={pending}>{pending ? "Buscando…" : "Ver mi pedido"}</button>
          {telefono && <BotonWhatsApp telefono={telefono} texto={mensajeSeguimiento(numero)}>{state.error ? "Te ayudamos por WhatsApp" : "¿No encuentras tu pedido? Escríbenos"}</BotonWhatsApp>}
        </div>
      </form>

      {p && (
        <div className="confirmGrid seguimientoResultado" aria-live="polite">
          <div className="confirmMain">
            <section className="formCard">
              <div className="seguimientoCabecera">
                <div>
                  <span className="pill" data-estado={p.estado}>{etiquetaEstado(p)}</span>
                  <h2>Pedido #{p.numero}</h2>
                  {p.nombre && <p className="muted">Hola, {p.nombre}. Este es el estado de tu pedido.</p>}
                </div>
                <small className="muted">Actualizado el {fechaHora(p.actualizado)}</small>
              </div>
              {p.estado === "anulada" ? (
                <p className="checkoutError" role="status">Este pedido fue anulado. Si tienes dudas, escríbenos a <strong>{correoContacto}</strong>.</p>
              ) : (
                <ol className="timeline">
                  {pasos(p).map((step, i) => (
                    <li key={step.label} style={{ "--i": i } as React.CSSProperties} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
                      <span className="timelineDot" aria-hidden="true">{step.state === "done" ? "✓" : ""}</span>
                      <div><strong>{step.label}</strong>{step.hint && <small>{step.hint}</small>}</div>
                    </li>
                  ))}
                </ol>
              )}
              {telefono && (
                <div className="seguimientoAyuda">
                  <span className="muted">¿Tienes alguna consulta sobre este pedido?</span>
                  <BotonWhatsApp telefono={telefono} texto={mensajeSeguimiento(p.numero, etiquetaEstado(p))}>Consultar por WhatsApp</BotonWhatsApp>
                </div>
              )}
            </section>
          </div>

          <aside className="summaryCard">
            <h3>Resumen</h3>
            <ul className="summaryItems">
              {p.items.map((l, i) => (
                <li key={i}>
                  {l.producto ? (
                    <span className="summaryThumb">
                      <span className="cartThumbStage"><ProductComposition product={l.producto} baseImage={l.envaseImagen} envaseId={l.envaseId} /></span>
                      <b>{l.cantidad}</b>
                    </span>
                  ) : (
                    <span className="summaryThumb summaryThumbCard" aria-hidden="true">{/tarjeta/i.test(l.nombre) ? "✉" : "✦"}<b>{l.cantidad}</b></span>
                  )}
                  <span className="summaryItemName">{l.nombre}{l.envase && <small>{l.envase}</small>}</span>
                  <strong>{formatPrice(Number(l.subtotal))}</strong>
                </li>
              ))}
            </ul>
            <hr />
            <div><span>Subtotal</span><strong>{formatPrice(Number(p.subtotal))}</strong></div>
            <div><span>Delivery{p.distrito ? ` · ${p.distrito}` : ""}</span><strong>{formatPrice(Number(p.delivery))}</strong></div>
            <hr />
            <div className="summaryTotal"><span>Total</span><strong>{formatPrice(Number(p.total))}</strong></div>
            <dl className="orderFacts">
              {p.fecha_entrega && <div><dt>Entrega</dt><dd>{fechaLarga(p.fecha_entrega)}</dd></div>}
              {p.metodo_pago && <div><dt>Pago</dt><dd>{p.metodo_pago}</dd></div>}
            </dl>
            <p className="summaryB2B">¿Dudas con tu pedido? Escríbenos a <strong>{correoContacto}</strong></p>
          </aside>
        </div>
      )}
    </div>
  );
}
