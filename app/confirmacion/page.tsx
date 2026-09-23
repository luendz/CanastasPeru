import Link from "next/link";
import CheckoutSteps from "@/components/CheckoutSteps";
import ProductComposition from "@/components/ProductComposition";
import { deliveryZones, formatPrice, mockCart, products } from "@/lib/mock-data";

// Pedido de prueba: mientras no haya persistencia se reconstruye desde el carrito mock.
const order = {
  number: "CP-000123",
  email: "correo@ejemplo.com",
  district: deliveryZones[0].district,
  fee: deliveryZones[0].fee,
  date: "Martes 22 de diciembre",
  slot: "Mañana · 9:00 – 13:00",
  payment: "Tarjeta Visa",
  document: "Boleta electrónica",
};

// Flujo del documento del proyecto (§7.6): el PDF/XML no existe inmediatamente tras el pago.
const timeline = [
  { label: "Pago aprobado", hint: "Hoy, 10:42", state: "done" },
  { label: "Pedido registrado", hint: `N.º ${order.number}`, state: "done" },
  { label: "Comprobante en proceso", hint: "Enviando a SUNAT", state: "current" },
  { label: "Preparando tus canastas", hint: "Las armamos a mano", state: "todo" },
  { label: "Entrega", hint: order.date, state: "todo" },
] as const;

export default function ConfirmacionPage() {
  const lines = mockCart.flatMap(({ slug, qty }) => {
    const product = products.find((p) => p.slug === slug);
    return product ? [{ product, qty }] : [];
  });
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const total = subtotal + order.fee;

  return (
    <section className="shell cartPage">
      <CheckoutSteps current={3} />

      <div className="successHero">
        <div className="successSeal" aria-hidden="true">✓</div>
        <div>
          <span className="pill">Pedido registrado</span>
          <h1>¡Gracias por tu <em>compra</em>!</h1>
          <p>Enviamos el detalle a <strong>{order.email}</strong>. Te avisaremos por correo y WhatsApp en cada paso.</p>
        </div>
        <dl className="successMeta">
          <div><dt>Pedido</dt><dd>#{order.number}</dd></div>
          <div><dt>Total pagado</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
      </div>

      <div className="confirmGrid">
        <div className="confirmMain">
          <section className="formCard">
            <h3 className="confirmTitle">Estado del pedido</h3>
            <ol className="timeline">
              {timeline.map((step) => (
                <li key={step.label} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
                  <span className="timelineDot" aria-hidden="true">{step.state === "done" ? "✓" : ""}</span>
                  <div><strong>{step.label}</strong><small>{step.hint}</small></div>
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
          <div><span>Delivery · {order.district}</span><strong>{formatPrice(order.fee)}</strong></div>
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
