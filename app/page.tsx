import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductComposition from "@/components/ProductComposition";
import { formatPrice, products } from "@/lib/mock-data";

const marquee = ["Panetón", "Champagne", "Chocolates", "Galletas navideñas", "Duraznos", "Canastas de mimbre", "Boxes corporativos", "Tarjeta personalizada"];

export default function HomePage() {
  const hero = products.find((p) => p.slug === "canasta-ejecutiva") ?? products[0];
  const fromPrice = Math.min(...products.map((p) => p.price));

  return (
    <>
      <section className="hero">
        <div className="shell heroGrid">
          <div className="heroCopy">
            <span className="pill">Campaña Navidad 2026</span>
            <h1>Regalos que llegan <em>llenos</em> de Navidad.</h1>
            <p>Canastas armadas a mano con productos que sí se disfrutan. Para la familia, el equipo o ese cliente que quieres conservar.</p>
            <div className="heroActions">
              <Link className="btn btnPrimary" href="/catalogo">Ver catálogo</Link>
              <Link className="btn btnGhost" href="/cotizacion">Cotizar para empresa</Link>
            </div>
            <dl className="heroStats">
              <div><dt>+1 200</dt><dd>canastas entregadas</dd></div>
              <div><dt>48 h</dt><dd>entrega en Lima</dd></div>
              <div><dt>4.9 ★</dt><dd>valoración promedio</dd></div>
            </dl>
          </div>
          <div className="heroArt">
            <div className="heroArch" aria-hidden="true" />
            <Link className="heroStage" href={`/producto/${hero.slug}`} aria-label={`Ver ${hero.name}`}>
              <ProductComposition product={hero} />
            </Link>
            <div className="heroStamp" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs><path id="stampCircle" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
                <text><textPath href="#stampCircle">hecho a mano · navidad 2026 · </textPath></text>
              </svg>
              <span>✦</span>
            </div>
            <div className="heroTag">
              <small>Desde</small>
              <strong>{formatPrice(fromPrice)}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marqueeTrack">
          {[...marquee, ...marquee].map((word, i) => <span key={i}>{word}<i>✦</i></span>)}
        </div>
      </div>

      <section className="section shell">
        <div className="sectionHead">
          <div><span className="eyebrow">Destacados</span><h2>Encuentra la <em>canasta</em> ideal</h2></div>
          <Link className="textLink" href="/catalogo">Ver todo el catálogo →</Link>
        </div>
        <div className="productGrid">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>

      <section className="section stepsSection">
        <div className="shell">
          <div className="sectionHead">
            <div><span className="eyebrow">Cómo funciona</span><h2>Tres pasos, <em>cero</em> estrés</h2></div>
          </div>
          <ol className="featureGrid">
            <li className="feature"><span>01</span><h3>Elige tu canasta</h3><p>Explora opciones por presupuesto, categoría o tipo de regalo.</p></li>
            <li className="feature"><span>02</span><h3>Personalízala</h3><p>Cambia la canasta, indica cantidades, dedicatoria y comprobante.</p></li>
            <li className="feature"><span>03</span><h3>Nosotros la llevamos</h3><p>Programa la entrega y recibe confirmación en cada paso.</p></li>
          </ol>
        </div>
      </section>

      <section className="shell">
        <div className="businessBanner">
          <div>
            <span className="eyebrow">Ventas corporativas</span>
            <h2>¿20, 100 o <em>500</em> canastas?</h2>
            <p>Precios por volumen, tarjeta con tu logo y entregas coordinadas a cada colaborador.</p>
          </div>
          <Link className="btn btnLight" href="/cotizacion">Solicitar cotización</Link>
        </div>
      </section>
    </>
  );
}
