"use client";

import { useActionState } from "react";
import { buscarPedido, type PedidoSeguimiento, type SeguimientoState } from "@/app/(sitio)/seguimiento/actions";
import { formatPrice } from "@/lib/mock-data";

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

export default function SeguimientoPedido({ numeroInicial, correoContacto }: { numeroInicial?: string; correoContacto: string }) {
  const [state, action, pending] = useActionState<SeguimientoState, FormData>(buscarPedido, { numero: numeroInicial });
  const p = state.pedido;

  return (
    <div className="seguimiento">
      <form action={action} className="formCard seguimientoForm">
        <div className="formGrid">
          <label>
            Número de pedido
            <input className="input" name="numero" defaultValue={state.numero ?? ""} placeholder="OP-0012" required maxLength={20} autoComplete="off" />
          </label>
          <label>
            Correo o celular de la compra
            <input className="input" name="contacto" placeholder="correo@ejemplo.com o 999 999 999" required maxLength={160} autoComplete="email" />
          </label>
        </div>
        <small className="muted">El número de pedido aparece en la confirmación de tu compra.</small>
        {state.error && <p className="checkoutError" role="alert">{state.error}</p>}
        <button className="btn btnPrimary" type="submit" disabled={pending}>{pending ? "Buscando…" : "Ver mi pedido"}</button>
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
            </section>
          </div>

          <aside className="summaryCard">
            <h3>Resumen</h3>
            <ul className="summaryItems">
              {p.items.map((l, i) => (
                <li key={i}>
                  <span className="summaryThumb summaryThumbCard" aria-hidden="true">✦<b>{l.cantidad}</b></span>
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
