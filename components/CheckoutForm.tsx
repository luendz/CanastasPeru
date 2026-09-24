"use client";

import Link from "next/link";
import { useState } from "react";
import ProductComposition from "@/components/ProductComposition";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import { deliveryZones, formatPrice, mockCart, products } from "@/lib/mock-data";

const timeSlots = [
  { id: "manana", label: "Mañana", hint: "9:00 – 13:00" },
  { id: "tarde", label: "Tarde", hint: "14:00 – 18:00" },
  { id: "noche", label: "Noche", hint: "18:00 – 21:00" },
];

const payMethods = [
  { id: "tarjeta", label: "Tarjeta", hint: "Visa, Mastercard, Amex", note: "Al pagar te llevaremos a la pasarela segura. Aquí no se ingresan datos de tarjeta." },
  { id: "yape", label: "Yape / Plin", hint: "Pago con QR", note: "Te mostraremos el QR y el monto exacto en el siguiente paso." },
  { id: "transferencia", label: "Transferencia", hint: "BCP, Interbank, BBVA", note: "Recibirás los datos bancarios por correo. El pedido se confirma al validar el abono." },
];

function Section({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="formCard checkoutCard" style={{ "--i": n } as React.CSSProperties}>
      <div className="stepTitle"><span>{n}</span><div><h3>{title}</h3><p>{hint}</p></div></div>
      {children}
    </section>
  );
}

export default function CheckoutForm() {
  const [district, setDistrict] = useState("");
  const [slot, setSlot] = useState("manana");
  const [otherReceiver, setOtherReceiver] = useState(false);
  const [doc, setDoc] = useState<"boleta" | "factura">("boleta");
  const [pay, setPay] = useState("tarjeta");

  const lines = mockCart.flatMap(({ slug, qty }) => {
    const product = products.find((p) => p.slug === slug);
    return product ? [{ product, qty }] : [];
  });
  const units = lines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const fee = deliveryZones.find((z) => z.district === district)?.fee;
  const total = subtotal + (fee ?? 0);
  const payNote = payMethods.find((m) => m.id === pay)?.note;

  return (
    <div className="checkoutLayout">
      <form className="checkoutForm" onSubmit={(e) => e.preventDefault()}>
        <Section n={1} title="Datos de contacto" hint="Te enviaremos la confirmación y el seguimiento del pedido.">
          <div className="formGrid">
            <label>Nombres<input className="input" autoComplete="given-name" placeholder="Luis" /></label>
            <label>Apellidos<input className="input" autoComplete="family-name" placeholder="Díaz" /></label>
            <label>Correo<input className="input" type="email" autoComplete="email" placeholder="correo@ejemplo.com" /></label>
            <label>Celular<input className="input" type="tel" autoComplete="tel" placeholder="999 999 999" /></label>
          </div>
        </Section>

        <Section n={2} title="Entrega" hint="¿Dónde y cuándo llevamos las canastas?">
          <div className="formGrid">
            <label>Distrito
              <select className="select" value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">Selecciona distrito</option>
                {deliveryZones.map((z) => <option key={z.district} value={z.district}>{z.district} · {formatPrice(z.fee)}</option>)}
              </select>
            </label>
            <label>Fecha de entrega<input className="input" type="date" /></label>
            <label className="wide">Dirección<input className="input" autoComplete="street-address" placeholder="Av. / Jr. / Calle, número, dpto." /></label>
            <label className="wide">Referencia<input className="input" placeholder="Frente al parque, portón negro…" /></label>
          </div>

          <fieldset className="fieldGroup">
            <legend>Horario</legend>
            <div className="choiceGrid choiceGrid3">
              {timeSlots.map((s) => (
                <label className="choice" key={s.id}>
                  <input type="radio" name="slot" checked={slot === s.id} onChange={() => setSlot(s.id)} />
                  <span><strong>{s.label}</strong><small>{s.hint}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="toggleRow">
            <input type="checkbox" checked={otherReceiver} onChange={(e) => setOtherReceiver(e.target.checked)} />
            <span><strong>Lo recibe otra persona</strong><small>Ideal si es un regalo sorpresa.</small></span>
          </label>
          {otherReceiver && (
            <div className="formGrid topSpace">
              <label>Nombre de quien recibe<input className="input" placeholder="María Torres" /></label>
              <label>Celular de quien recibe<input className="input" type="tel" placeholder="999 999 999" /></label>
            </div>
          )}

          <label className="giftField">
            <span><strong>Dedicatoria</strong> <small>opcional · va impresa en una tarjeta amarrada al lazo</small></span>
            <textarea className="textarea" maxLength={240} placeholder="¡Feliz Navidad! Gracias por un año increíble…" />
          </label>
        </Section>

        <Section n={3} title="Comprobante" hint="Elige cómo emitimos tu comprobante electrónico.">
          <div className="choiceGrid">
            <label className="choice">
              <input type="radio" name="doc" checked={doc === "boleta"} onChange={() => setDoc("boleta")} />
              <span><strong>Boleta</strong><small>Con DNI, para personas</small></span>
            </label>
            <label className="choice">
              <input type="radio" name="doc" checked={doc === "factura"} onChange={() => setDoc("factura")} />
              <span><strong>Factura</strong><small>Con RUC, para empresas</small></span>
            </label>
          </div>
          {doc === "boleta" ? (
            <div className="formGrid topSpace">
              <label>DNI<input className="input" inputMode="numeric" maxLength={8} placeholder="12345678" /></label>
              <label>Nombres completos<input className="input" placeholder="Como figura en el DNI" /></label>
            </div>
          ) : (
            <div className="formGrid topSpace">
              <label>RUC<input className="input" inputMode="numeric" maxLength={11} placeholder="20123456789" /></label>
              <label>Razón social<input className="input" placeholder="Empresa S.A.C." /></label>
              <label className="wide">Dirección fiscal<input className="input" placeholder="Dirección registrada en SUNAT" /></label>
            </div>
          )}
        </Section>

        <Section n={4} title="Método de pago" hint="Vista previa: todavía no se procesa ningún pago.">
          <div className="choiceGrid choiceGrid3">
            {payMethods.map((m) => (
              <label className="choice" key={m.id}>
                <input type="radio" name="pay" checked={pay === m.id} onChange={() => setPay(m.id)} />
                <span><strong>{m.label}</strong><small>{m.hint}</small></span>
              </label>
            ))}
          </div>
          {payNote && <p className="payNote">{payNote}</p>}
        </Section>
      </form>

      <aside className="summaryCard sticky checkoutSummary">
        <div className="summaryHead">
          <h3>Tu pedido</h3>
          <Link className="textLink" href="/carrito">Editar</Link>
        </div>
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
        <div><span>Subtotal ({units} {units === 1 ? "canasta" : "canastas"})</span><strong>{formatPrice(subtotal)}</strong></div>
        <div><span>Delivery{district && ` · ${district}`}</span>{fee !== undefined ? <strong><AnimatedPrice value={fee} duration={400} /></strong> : <span className="muted">Elige un distrito</span>}</div>
        <hr />
        <div className="summaryTotal"><span>Total</span><strong><AnimatedPrice value={total} /></strong></div>
        <p className="muted summaryTax">Precios incluyen IGV.</p>
        <label className="termsRow">
          <input type="checkbox" defaultChecked />
          <span>Acepto los términos y la política de privacidad.</span>
        </label>
        <Link className="btnV2 btnV2Solid full payBtn" href="/confirmacion">Pagar&nbsp;<AnimatedPrice value={total} /></Link>
        <p className="muted summaryFoot">Prototipo: el botón simula un pago aprobado.</p>
      </aside>
    </div>
  );
}
