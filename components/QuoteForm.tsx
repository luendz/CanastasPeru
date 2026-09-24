"use client";

import { useState } from "react";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import { products } from "@/lib/mock-data";

const quantities = [20, 50, 100, 200];

const budgets = [
  { id: "100", label: "Hasta S/ 100", min: 60, max: 100 },
  { id: "180", label: "S/ 100 – 180", min: 100, max: 180 },
  { id: "250", label: "S/ 180 – 250", min: 180, max: 250 },
  { id: "plus", label: "Más de S/ 250", min: 250, max: 0 },
];

const extras = ["Tarjeta con tu logo", "Cinta con colores de marca", "Entrega a cada colaborador", "Producto propio de tu empresa"];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="quoteSection" style={{ "--i": n } as React.CSSProperties}>
      <legend><span className="stepNum">{n}</span> {title}</legend>
      {children}
    </fieldset>
  );
}

export default function QuoteForm() {
  const [qty, setQty] = useState(50);
  const [budget, setBudget] = useState("180");
  const [base, setBase] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const range = budgets.find((b) => b.id === budget);
  const toggleBase = (slug: string) => setBase((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]));

  if (sent) {
    return (
      <div className="formCard quoteForm quoteSent">
        <div className="successSeal" aria-hidden="true">
          <svg viewBox="0 0 52 52"><path d="m15 27 7.5 7.5L38 18.5" /></svg>
        </div>
        <h2>¡Solicitud <em>lista</em>!</h2>
        <p>En la versión final, nuestro equipo te enviará una propuesta con precios, muestras y fechas de entrega. Por ahora este formulario no envía información.</p>
        <button type="button" className="btn btnGhost" onClick={() => setSent(false)}>Volver al formulario</button>
      </div>
    );
  }

  return (
    <form className="formCard quoteForm" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      <Section n={1} title="Tu empresa">
        <div className="formGrid">
          <label>Empresa<input className="input" autoComplete="organization" placeholder="Nombre de la empresa" /></label>
          <label>RUC<input className="input" inputMode="numeric" maxLength={11} placeholder="20XXXXXXXXX" /></label>
          <label>Nombre de contacto<input className="input" autoComplete="name" placeholder="Nombre completo" /></label>
          <label>Cargo (opcional)<input className="input" autoComplete="organization-title" placeholder="Ej. Jefa de RR. HH." /></label>
          <label>Correo<input className="input" type="email" autoComplete="email" placeholder="correo@empresa.com" /></label>
          <label>Celular<input className="input" type="tel" autoComplete="tel" placeholder="999 999 999" /></label>
        </div>
      </Section>

      <Section n={2} title="Tu pedido">
        <div className="quoteField">
          <span className="quoteLabel">Cantidad estimada</span>
          <div className="qtyPicker">
            <div className="chipRow" role="group" aria-label="Cantidades frecuentes">
              {quantities.map((q) => (
                <button key={q} type="button" className="chip" aria-pressed={qty === q} onClick={() => setQty(q)}>{q}{q === 200 ? "+" : ""}</button>
              ))}
            </div>
            <label className="qtyInput">
              <span className="srOnly">Cantidad exacta</span>
              <input className="input" inputMode="numeric" value={qty} onChange={(e) => setQty(Number(e.target.value.replace(/\D/g, "")) || 0)} />
              <span>canastas</span>
            </label>
          </div>
        </div>

        <div className="quoteField">
          <span className="quoteLabel">Presupuesto por unidad</span>
          <div className="choiceGrid budgetGrid">
            {budgets.map((b) => (
              <label className="choice" key={b.id}>
                <input type="radio" name="budget" checked={budget === b.id} onChange={() => setBudget(b.id)} />
                <span><strong>{b.label}</strong></span>
              </label>
            ))}
          </div>
          {range && qty > 0 && (
            <p className="quoteEstimate">
              Inversión referencial:{" "}
              <strong>
                {range.max ? <><AnimatedPrice value={range.min * qty} /> – <AnimatedPrice value={range.max * qty} /></> : <AnimatedPrice prefix="desde " value={range.min * qty} />}
              </strong>
              <small>{qty} canastas · el precio final depende de la propuesta.</small>
            </p>
          )}
        </div>

        <div className="formGrid">
          <label>Fecha requerida<input className="input" type="date" /></label>
          <label>Lugar de entrega<select className="select" defaultValue=""><option value="" disabled>Selecciona</option><option>Una sola dirección</option><option>Varias sedes</option><option>Domicilio de cada colaborador</option></select></label>
        </div>
      </Section>

      <Section n={3} title="Detalle">
        <div className="quoteField">
          <span className="quoteLabel">¿Partimos de alguna canasta? <small>opcional</small></span>
          <div className="chipRow">
            {products.map((p) => (
              <button key={p.slug} type="button" className="chip" aria-pressed={base.includes(p.slug)} onClick={() => toggleBase(p.slug)}>{p.name}</button>
            ))}
          </div>
        </div>
        <div className="quoteField">
          <span className="quoteLabel">Personalización <small>opcional</small></span>
          <div className="extrasGrid">
            {extras.map((x) => (
              <label className="toggleRow" key={x}><input type="checkbox" /><span>{x}</span></label>
            ))}
          </div>
        </div>
        <label className="giftField">
          <span><strong>Requerimientos</strong> <small>productos, restricciones, colores, lo que necesites</small></span>
          <textarea className="textarea" placeholder="Ej.: 80 canastas sin alcohol, con panetón y tarjeta con logo, entrega el 18 de diciembre en dos sedes." />
        </label>
      </Section>

      <button className="btn btnPrimary full quoteSubmit" type="submit">Solicitar cotización</button>
      <p className="muted summaryFoot">Prototipo: el formulario todavía no envía información.</p>
    </form>
  );
}
