import Link from "next/link";
import CheckoutSteps from "@/components/CheckoutSteps";
import SplitWords from "@/components/motion/SplitWords";
import ProductComposition from "@/components/ProductComposition";
import { getCatalogo } from "@/lib/catalogo";
import { formatPrice, mockCart } from "@/lib/mock-data";

// Pedido de prueba: mientras no haya persistencia se reconstruye desde el carrito mock.
const order = {
  number: "CP-000123",
  email: "correo@ejemplo.com",
  district: "Miraflores",
  date: "Martes 22 de diciembre",
  slot: "Mañana · 9:00 – 13:00",
  payment: "Tarjeta Visa",
  document: "Boleta electrónica",
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

// Flujo del documento del proyecto (§7.6): el PDF/XML no existe inmediatamente tras el pago.
const timeline = [
  { label: "Pago aprobado", hint: "Hoy, 10:42", state: "done" },
  { label: "Pedido registrado", hint: `N.º ${order.number}`, state: "done" },
  { label: "Comprobante en proceso", hint: "Enviando a SUNAT", state: "current" },
  { label: "Preparando tus canastas", hint: "Las armamos a mano", state: "todo" },
  { label: "Entrega", hint: order.date, state: "todo" },
] as const;

export default async function ConfirmacionPage({ searchParams }: { searchParams: Promise<{ pedido?: string; total?: string }> }) {
  // Número y total reales cuando el pedido se registró en la base; si no, los de demostración.
  const { pedido, total: totalReal } = await searchParams;
  const { products, deliveryZones } = await getCatalogo();
  const zona = deliveryZones.find((z) => z.district === order.district) ?? deliveryZones[0];
  const fee = zona?.fee ?? 0;
  const numeroPedido = pedido && /^OP-\d+$/.test(pedido) ? pedido : order.number;
  const lines = mockCart.flatMap(({ slug, qty }) => {
    const product = products.find((p) => p.slug === slug);
    return product ? [{ product, qty }] : [];
  });
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const total = totalReal && Number.isFinite(Number(totalReal)) ? Number(totalReal) : subtotal + fee;

  return (
    <section className="shell cartPage">
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
          <p>Enviamos el detalle a <strong>{order.email}</strong>. Te avisaremos por correo y WhatsApp en cada paso.</p>
        </div>
        <dl className="successMeta">
          <div><dt>Pedido</dt><dd>#{numeroPedido}</dd></div>
          <div><dt>Total pagado</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
      </div>

      <div className="confirmGrid">
        <div className="confirmMain">
          <section className="formCard">
            <h3 className="confirmTitle">Estado del pedido</h3>
            <ol className="timeline">
              {timeline.map((step, i) => (
                <li key={step.label} style={{ "--i": i } as React.CSSProperties} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
                  <span className="timelineDot" aria-hidden="true">{step.state === "done" ? "✓" : ""}</span>
                  <div><strong>{step.label}</strong><small>{step.label === "Pedido registrado" ? `N.º ${numeroPedido}` : step.hint}</small></div>
                </li>
              ))}
            </ol>
          </section>

          <section className="formCard">
            <div className="docHead">
              <div>
                <h3 className="confirmTitle">Comprobante electrónico</h3>
                <p className="muted">{order.document} · se emite cuando SUNAT la valide, normalmente en unos minutos.</p>
              </div>
              <span className="statusTag">En proceso</span>
            </div>
            <div className="docActions">
              <button className="btn btnGhost" disabled>Descargar PDF</button>
              <button className="btn btnGhost" disabled>Descargar XML</button>
            </div>
            <p className="muted">Los archivos también llegarán a tu correo cuando estén listos.</p>
          </section>

          <div className="heroActions">
            <Link className="btn btnPrimary" href="/catalogo">Seguir comprando</Link>
            <Link className="btn btnGhost" href="/">Volver al inicio</Link>
          </div>
        </div>

        <aside className="summaryCard">
          <h3>Resumen</h3>
          <ul className="summaryItems">
            {lines.map(({ product, qty }) => (
              <li key={product.slug}>
                <span className="summaryThumb">
                  <span className="cartThumbStage"><ProductComposition product={product} /></span>
                  <b>{qty}</b>
                </span>
                <span className="summaryItemName">{product.name}<small>{formatPrice(product.price)} c/u</small></span>
                <strong>{formatPrice(product.price * qty)}</strong>
              </li>
            ))}
          </ul>
          <hr />
          <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div><span>Delivery · {zona?.district ?? order.district}</span><strong>{formatPrice(fee)}</strong></div>
          <hr />
          <div className="summaryTotal"><span>Total</span><strong>{formatPrice(total)}</strong></div>
          <dl className="orderFacts">
            <div><dt>Entrega</dt><dd>{order.date}<br />{order.slot}</dd></div>
            <div><dt>Pago</dt><dd>{order.payment}</dd></div>
          </dl>
          <p className="summaryB2B">¿Dudas con tu pedido? Escríbenos a <strong>ventas@canastasperu.pe</strong></p>
        </aside>
      </div>
    </section>
  );
}
