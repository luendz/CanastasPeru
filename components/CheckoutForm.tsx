"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { crearPedido, type CheckoutState } from "@/app/(sitio)/checkout/actions";
import ProductComposition from "@/components/ProductComposition";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import type { DeliveryZone } from "@/lib/catalogo";
import type { Contenido } from "@/lib/contenido";
import { formatPrice, mockCart, type Product } from "@/lib/mock-data";

function Section({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="formCard checkoutCard" style={{ "--i": n } as React.CSSProperties}>
      <div className="stepTitle"><span>{n}</span><div><h3>{title}</h3><p>{hint}</p></div></div>
      {children}
    </section>
  );
}

export default function CheckoutForm({ products, deliveryZones, opciones }: { products: Product[]; deliveryZones: DeliveryZone[]; opciones: Contenido["checkout"] }) {
  // Horarios y métodos de pago se editan en Panel → Contenido → Checkout.
  const timeSlots = opciones.horarios.map((h, i) => ({ id: String(i), label: h.nombre, hint: h.rango }));
  const payMethods = opciones.metodosPago.map((m, i) => ({ id: String(i), label: m.nombre, hint: m.detalle, note: m.nota }));
  const [district, setDistrict] = useState("");
  const [slot, setSlot] = useState("0");
  const [otherReceiver, setOtherReceiver] = useState(false);
  const [doc, setDoc] = useState<"boleta" | "factura">("boleta");
  const [pay, setPay] = useState("0");

  const lines = mockCart.flatMap(({ slug, qty }) => {
    const product = products.find((p) => p.slug === slug);
    return product ? [{ product, qty }] : [];
  });
  const units = lines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const fee = deliveryZones.find((z) => z.district === district)?.fee;
  const total = subtotal + (fee ?? 0);
  const payNote = payMethods.find((m) => m.id === pay)?.note;
  const slotInfo = timeSlots.find((s) => s.id === slot);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(crearPedido, {});

  return (
    <div className="checkoutLayout">
      <form id="checkout" className="checkoutForm" action={action}>
        <input type="hidden" name="items" value={JSON.stringify(mockCart.map((c) => ({ slug: c.slug, cantidad: c.qty })))} />
        <input type="hidden" name="horario" value={slotInfo ? `${slotInfo.label} · ${slotInfo.hint}` : ""} />
        <input type="hidden" name="metodo_pago" value={payMethods.find((m) => m.id === pay)?.label ?? ""} />
        <input type="hidden" name="comprobante" value={doc} />
        <Section n={1} title="Datos de contacto" hint="Te enviaremos la confirmación y el seguimiento del pedido.">
          <div className="formGrid">
            <label>Nombres<input className="input" name="nombres" autoComplete="given-name" placeholder="Luis" required maxLength={80} /></label>
            <label>Apellidos<input className="input" name="apellidos" autoComplete="family-name" placeholder="Díaz" maxLength={80} /></label>
            <label>Correo<input className="input" name="email" type="email" autoComplete="email" placeholder="correo@ejemplo.com" maxLength={160} /></label>
            <label>Celular<input className="input" name="telefono" type="tel" autoComplete="tel" placeholder="999 999 999" maxLength={40} /></label>
          </div>
        </Section>

        <Section n={2} title="Entrega" hint="¿Dónde y cuándo llevamos las canastas?">
          <div className="formGrid">
            <label>Distrito
              <select className="select" name="distrito" value={district} onChange={(e) => setDistrict(e.target.value)} required>
                <option value="">Selecciona distrito</option>
                {deliveryZones.map((z) => <option key={z.district} value={z.district}>{z.district} · {formatPrice(z.fee)}</option>)}
              </select>
            </label>
            <label>Fecha de entrega<input className="input" name="fecha_entrega" type="date" /></label>
            <label className="wide">Dirección<input className="input" name="direccion" autoComplete="street-address" placeholder="Av. / Jr. / Calle, número, dpto." maxLength={300} /></label>
            <label className="wide">Referencia<input className="input" name="referencia" placeholder="Frente al parque, portón negro…" maxLength={300} /></label>
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
              <label>Nombre de quien recibe<input className="input" name="recibe_nombre" placeholder="María Torres" maxLength={160} /></label>
              <label>Celular de quien recibe<input className="input" name="recibe_telefono" type="tel" placeholder="999 999 999" maxLength={40} /></label>
            </div>
          )}

          <label className="giftField">
            <span><strong>✦ Dedicatoria</strong> <small>opcional · va en una tarjeta impresa</small></span>
            <textarea className="textarea" name="dedicatoria" maxLength={240} placeholder="¡Feliz Navidad! Gracias por un año increíble…" />
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
              <label>DNI<input className="input" name="dni" inputMode="numeric" maxLength={8} placeholder="12345678" /></label>
              <label>Nombres completos<input className="input" name="nombre_comprobante" placeholder="Como figura en el DNI" maxLength={200} /></label>
            </div>
          ) : (
            <div className="formGrid topSpace">
              <label>RUC<input className="input" name="ruc" inputMode="numeric" maxLength={11} placeholder="20123456789" /></label>
              <label>Razón social<input className="input" name="razon_social" placeholder="Empresa S.A.C." maxLength={200} /></label>
              <label className="wide">Dirección fiscal<input className="input" name="direccion_fiscal" placeholder="Dirección registrada en SUNAT" maxLength={300} /></label>
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
        <p className="muted summaryTax">{opciones.notaImpuestos}</p>
        <label className="termsRow">
          <input type="checkbox" name="terminos" form="checkout" defaultChecked />
          <span>Acepto los términos y la política de privacidad.</span>
        </label>
        {state.error && <p className="checkoutError" role="alert">{state.error}</p>}
        <button className="btn btnPrimary full payBtn" type="submit" form="checkout" disabled={pending}>
          {pending ? "Registrando pedido…" : <>Pagar&nbsp;<AnimatedPrice value={total} /></>}
        </button>
        <p className="muted summaryFoot">Prototipo: se registra el pedido pero todavía no se cobra.</p>
      </aside>
    </div>
  );
}
