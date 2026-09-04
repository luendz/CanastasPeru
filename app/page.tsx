import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell heroGrid">
          <div className="heroCopy">
            <span className="pill">Campaña Navidad 2026</span>
            <h1>Regalos que se sienten especiales.</h1>
            <p>Canastas navideñas, boxes y opciones corporativas listas para entregar en Lima.</p>
            <div className="heroActions">
              <Link className="btn btnPrimary" href="/catalogo">Ver catálogo</Link>
              <Link className="btn btnGhost" href="/cotizacion">Cotizar para empresa</Link>
            </div>
            <div className="heroTrust">
              <span>✓ Atención personalizada</span>
              <span>✓ Pedidos por volumen</span>
              <span>✓ Delivery programado</span>
            </div>
          </div>
          <div className="heroArt">
            <div className="heroCard heroCardBack">🎄</div>
            <div className="heroCard heroCardMain">🧺</div>
            <div className="floatingTag">Desde <strong>S/ 89.90</strong></div>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="sectionHead">
          <div><span className="eyebrow">Destacados</span><h2>Encuentra la opción ideal</h2></div>
          <Link className="textLink" href="/catalogo">Ver todos →</Link>
        </div>
        <div className="productGrid">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>

      <section className="section softSection">
        <div className="shell featureGrid">
          <div className="feature"><span>01</span><h3>Elige tu canasta</h3><p>Explora opciones por presupuesto, categoría o tipo de regalo.</p></div>
          <div className="feature"><span>02</span><h3>Personaliza tu pedido</h3><p>Indica cantidades, datos de entrega y comprobante.</p></div>
          <div className="feature"><span>03</span><h3>Recíbelo donde quieras</h3><p>Programa la entrega y recibe confirmación de tu compra.</p></div>
        </div>
      </section>

      <section className="section shell businessBanner">
        <div><span className="eyebrow">Ventas corporativas</span><h2>¿Necesitas 20, 100 o más canastas?</h2><p>Solicita una cotización personalizada para tu empresa.</p></div>
        <Link className="btn btnLight" href="/cotizacion">Solicitar cotización</Link>
      </section>
    </>
  );
}
