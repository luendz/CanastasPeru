import { getCatalogo } from "@/lib/catalogo";
import QuoteForm from "@/components/QuoteForm";
import { getContenido } from "@/lib/contenido";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";

export default async function CotizacionPage() {
  const [{ products }, { cotizacion: t, contacto }] = await Promise.all([getCatalogo(), getContenido()]);
  return (
    <>
      <section className="quoteHero">
        <div className="shell quoteHeroGrid">
          <div>
            <span className="pill">{t.etiqueta}</span>
            <h1><SplitWords text={t.titulo} immediate /></h1>
            <p>{t.texto}</p>
          </div>
          <ol className="quoteSteps">
            {t.pasos.map((s, i) => (
              <li key={`${s.titulo}-${i}`} style={{ "--i": i } as React.CSSProperties}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{s.titulo}</strong><small>{s.texto}</small></div></li>
            ))}
          </ol>
        </div>
        <div className="textileBand" aria-hidden="true" />
      </section>

      <section className="shell quotePage">
        <Reveal as="div" className="quoteIntro">
          <span className="eyebrow">Por qué con nosotros</span>
          <h2><SplitWords text={t.beneficiosTitulo} /></h2>
          <ul className="quotePerks">
            {t.beneficios.map((p, n) => <li key={`${p}-${n}`} data-reveal-item style={{ "--i": n + 3 } as React.CSSProperties}><span aria-hidden="true">✦</span>{p}</li>)}
          </ul>
          <div className="quoteContact">
            <small>¿Prefieres hablar con alguien?</small>
            <strong>{contacto.telefono}</strong>
            <span>{contacto.correo}</span>
          </div>
        </Reveal>
        <Reveal threshold={0.05}>
          <QuoteForm products={products} opciones={t} />
        </Reveal>
      </section>
    </>
  );
}
