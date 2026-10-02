import { cookies } from "next/headers";
import Link from "next/link";
import CheckoutSteps from "@/components/CheckoutSteps";
import VaciarCarrito from "@/components/VaciarCarrito";
import SplitWords from "@/components/motion/SplitWords";
import { getContenido } from "@/lib/contenido";
import { formatPrice } from "@/lib/mock-data";
import { enlaceWhatsApp } from "@/lib/whatsapp";

export const metadata = { title: "Pedido registrado" };

type Resumen = {
  numero: string;
  total: number;
  lineas: { nombre: string; detalle: string; cantidad: number; precio: number }[];
  distrito: string;
  fecha: string;
  pago: string;
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

export default async function ConfirmacionPage({ searchParams }: { searchParams: Promise<{ pedido?: string; total?: string }> }) {
  const [{ pedido, total: totalUrl }, jar, { contacto }] = await Promise.all([searchParams, cookies(), getContenido()]);
  const r = leerResumen(jar.get("mka-pedido")?.value);
  const numero = r?.numero ?? (pedido && /^OP-\d+$/.test(pedido) ? pedido : null);
  const total = r?.total ?? (totalUrl && Number.isFinite(Number(totalUrl)) ? Number(totalUrl) : null);
  const subtotal = r ? r.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0) : 0;
  const delivery = r && total != null ? Math.max(0, total - subtotal) : 0;
  const entrega = r ? fechaLarga(r.fecha) : "";

  const pasos = [
    { label: "Pedido registrado", hint: numero ? `N.º ${numero}` : "", state: "done" },
    { label: "Confirmación del pago", hint: r?.pago ? `Método elegido: ${r.pago}` : "Te indicaremos cómo pagar", state: "current" },
    { label: "Preparamos tus canastas", hint: "Las armamos a mano", state: "todo" },
    { label: "Entrega", hint: entrega || "En la fecha acordada", state: "todo" },
  ] as const;

  return (
    <section className="shell cartPage">
      {numero && <VaciarCarrito />}
      <CheckoutSteps current={3} />

      <div className="successHero">
        <div className="confetti" aria-hidden="true">
          {confetti.map((c, i) => (
            <i key={i} style={{ "--x": `${c.x}%`, "--d": `${c.delay}ms`, "--dx": `${c.drift}px`, "--r": `${c.spin}deg`, "--c": c.color, "--w": `${c.w}px` } as React.CSSProperties} />
          ))}
        </div>
        <div className="successSeal" aria-hidden="true">
          <svg viewBox="0 0 52 52"><path d="m15 27 7.5 7.5L38 18.5" /></svg>
        </div>
        <div>
          <span className="pill">Pedido registrado</span>
          <h1><SplitWords text="¡Gracias por tu *compra*!" immediate offset={3} /></h1>
          <p>
            {r?.correo ? <>Te escribiremos a <strong>{r.correo}</strong></> : "Te escribiremos"} para confirmar el pago y coordinar la entrega.
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
            <Link className="btn btnPrimary" href="/canastas">Seguir comprando</Link>
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
          </aside>
        )}
      </div>
    </section>
  );
}
