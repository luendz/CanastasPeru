import Link from "next/link";
import HeroArt from "@/components/HeroArt";
import ProductCard from "@/components/ProductCard";
import CountUp from "@/components/motion/CountUp";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

export default async function HomePage() {
  const [{ products }, { portada }] = await Promise.all([getCatalogo(), getContenido()]);
  const hero = products.find((p) => p.slug === portada.canastaDestacada) ?? products[0];
  const fromPrice = products.length ? Math.min(...products.map((p) => p.price)) : 0;

  return (
    <>
      <section className="hero">
        <div className="shell heroGrid">
          <div className="heroCopy">
            {portada.etiqueta && <span className="pill">{portada.etiqueta}</span>}
            <h1><SplitWords text={portada.titulo} immediate /></h1>
            <p>{portada.texto}</p>
            <div className="heroActions">
              <Link className="btn btnPrimary" href="/catalogo">{portada.botonPrincipal}</Link>
              <Link className="btn btnGhost" href="/cotizacion">{portada.botonSecundario}</Link>
            </div>
            {portada.cifras.length > 0 && (
              <dl className="heroStats">
                {portada.cifras.map((s, n) => (
                  <div key={`${s.valor}-${n}`} style={i(n)}><dt><CountUp value={s.valor} /></dt><dd>{s.texto}</dd></div>
                ))}
              </dl>
            )}
          </div>
          {hero && <HeroArt product={hero} fromPrice={fromPrice} />}
        </div>
      </section>

      {portada.cinta.length > 0 && (
        <div className="marquee" aria-hidden="true">
          <div className="marqueeTrack">
            {[...portada.cinta, ...portada.cinta].map((word, n) => <span key={n}>{word}<i>✦</i></span>)}
          </div>
        </div>
      )}

      <section className="section shell">
        <Reveal className="sectionHead">
          <div><span className="eyebrow" data-reveal-item style={i(0)}>{portada.destacadosEtiqueta}</span><h2><SplitWords text={portada.destacadosTitulo} /></h2></div>
          <Link className="textLink" data-reveal-item style={i(4)} href="/catalogo">Ver todo el catálogo →</Link>
        </Reveal>
        <Reveal className="productGrid" threshold={0.1}>
          {products.map((product, n) => (
            <div className="gridItem" data-reveal-item style={i(n)} key={product.slug}>
              <ProductCard product={product} />
            </div>
          ))}
        </Reveal>
      </section>

      {portada.pasos.length > 0 && (
        <section className="section stepsSection">
          <div className="shell">
            <Reveal className="sectionHead">
              <div><span className="eyebrow" data-reveal-item style={i(0)}>{portada.pasosEtiqueta}</span><h2><SplitWords text={portada.pasosTitulo} /></h2></div>
            </Reveal>
            <Reveal as="ol" className="featureGrid" threshold={0.15}>
              {portada.pasos.map((paso, n) => (
                <li className="feature" data-reveal-item style={i(n)} key={`${paso.titulo}-${n}`}>
                  <span>{String(n + 1).padStart(2, "0")}</span><h3>{paso.titulo}</h3><p>{paso.texto}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      <section className="shell">
        <Reveal className="businessBanner">
          <div>
            <span className="eyebrow" data-reveal-item style={i(0)}>{portada.empresasEtiqueta}</span>
            <h2><SplitWords text={portada.empresasTitulo} /></h2>
            <p data-reveal-item style={i(4)}>{portada.empresasTexto}</p>
          </div>
          <Link className="btn btnLight" data-reveal-item style={i(5)} href="/cotizacion">{portada.empresasBoton}</Link>
        </Reveal>
      </section>
    </>
  );
}
