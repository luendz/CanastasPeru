import QuoteForm from "@/components/QuoteForm";

const steps = [
  { title: "Nos cuentas qué necesitas", text: "Cantidad, presupuesto, fecha y el estilo de tu marca." },
  { title: "Recibes una propuesta", text: "Opciones de canastas, precios por volumen y muestras." },
  { title: "Coordinamos la entrega", text: "En tu oficina, en varias sedes o en cada domicilio." },
];

const perks = ["Precios por volumen", "Tarjeta y cinta con tu marca", "Factura electrónica", "Un asesor dedicado", "Entregas en varias sedes", "Canastas sin alcohol"];

export default function CotizacionPage() {
  return (
    <>
      <section className="quoteHero">
        <div className="shell quoteHeroGrid">
          <div>
            <span className="pill">Ventas corporativas</span>
            <h1>Regalos que <em>tu equipo</em> va a recordar.</h1>
            <p>Canastas navideñas para colaboradores, clientes y aliados, armadas con tu marca y entregadas donde las necesites.</p>
          </div>
          <ol className="quoteSteps">
            {steps.map((s, i) => (
              <li key={s.title}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{s.title}</strong><small>{s.text}</small></div></li>
            ))}
          </ol>
        </div>
        <div className="textileBand" aria-hidden="true" />
      </section>

      <section className="shell quotePage">
        <aside className="quoteIntro">
          <span className="eyebrow">Por qué con nosotros</span>
          <h2>Todo lo que tu campaña <em>necesita</em></h2>
          <ul className="quotePerks">
            {perks.map((p) => <li key={p}><span aria-hidden="true">✦</span>{p}</li>)}
          </ul>
          <div className="quoteContact">
            <small>¿Prefieres hablar con alguien?</small>
            <strong>+51 999 999 999</strong>
            <span>ventas@canastasperu.pe</span>
          </div>
        </aside>
        <QuoteForm />
      </section>
    </>
  );
}
