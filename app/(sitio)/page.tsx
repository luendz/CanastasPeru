import Link from "next/link";
import HeroArt from "@/components/HeroArt";
import ProductCard from "@/components/ProductCard";
import CountUp from "@/components/motion/CountUp";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { products } from "@/lib/mock-data";

const marquee = ["Panetón", "Champagne", "Chocolates", "Galletas navideñas", "Duraznos", "Canastas de mimbre", "Boxes corporativos", "Tarjeta personalizada"];
const stats = [
  { value: "+1 200", label: "canastas entregadas" },
  { value: "48 h", label: "entrega en Lima" },
  { value: "4.9 ★", label: "valoración promedio" },
];
const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

export default function HomePage() {
  const hero = products.find((p) => p.slug === "canasta-ejecutiva") ?? products[0];
  const fromPrice = Math.min(...products.map((p) => p.price));

  return (
    <>
      <section className="hero">
        <div className="shell heroGrid">
          <div className="heroCopy">
            <span className="pill">Campaña Navidad 2026</span>
            <h1><SplitWords text="Regalos que llegan *llenos* de Navidad." immediate /></h1>
            <p>Canastas armadas a mano con productos que sí se disfrutan. Para la familia, el equipo o ese cliente que quieres conservar.</p>
            <div className="heroActions">
              <Link className="btn btnPrimary" href="/catalogo">Ver catálogo</Link>
              <Link className="btn btnGhost" href="/cotizacion">Cotizar para empresa</Link>
            </div>
            <dl className="heroStats">
              {stats.map((s, n) => (
                <div key={s.label} style={i(n)}><dt><CountUp value={s.value} /></dt><dd>{s.label}</dd></div>
              ))}
            </dl>
          </div>
          <HeroArt product={hero} fromPrice={fromPrice} />
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marqueeTrack">
          {[...marquee, ...marquee].map((word, n) => <span key={n}>{word}<i>✦</i></span>)}
        </div>
      </div>

      <section className="section shell">
        <Reveal className="sectionHead">
          <div><span className="eyebrow" data-reveal-item style={i(0)}>Destacados</span><h2><SplitWords text="Encuentra la *canasta* ideal" /></h2></div>
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

      <section className="section stepsSection">
        <div className="shell">
          <Reveal className="sectionHead">
            <div><span className="eyebrow" data-reveal-item style={i(0)}>Cómo funciona</span><h2><SplitWords text="Tres pasos, *cero* estrés" /></h2></div>
          </Reveal>
          <Reveal as="ol" className="featureGrid" threshold={0.15}>
            <li className="feature" data-reveal-item style={i(0)}><span>01</span><h3>Elige tu canasta</h3><p>Explora opciones por presupuesto, categoría o tipo de regalo.</p></li>
            <li className="feature" data-reveal-item style={i(1)}><span>02</span><h3>Personalízala</h3><p>Cambia la canasta, indica cantidades, dedicatoria y comprobante.</p></li>
            <li className="feature" data-reveal-item style={i(2)}><span>03</span><h3>Nosotros la llevamos</h3><p>Programa la entrega y recibe confirmación en cada paso.</p></li>
          </Reveal>
        </div>
      </section>

      <section className="shell">
        <Reveal className="businessBanner">
          <div>
            <span className="eyebrow" data-reveal-item style={i(0)}>Ventas corporativas</span>
            <h2><SplitWords text="¿20, 100 o *500* canastas?" /></h2>
            <p data-reveal-item style={i(4)}>Precios por volumen, tarjeta con tu logo y entregas coordinadas a cada colaborador.</p>
          </div>
          <Link className="btn btnLight" data-reveal-item style={i(5)} href="/cotizacion">Solicitar cotización</Link>
        </Reveal>
      </section>
    </>
  );
}
