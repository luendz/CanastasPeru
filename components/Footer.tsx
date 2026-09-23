import Brand, { BRAND_NAME, BRAND_TAGLINE } from "@/components/Brand";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="textileBand" aria-hidden="true" />
      <div className="shell footerGrid">
        <div className="footerAbout">
          <img className="footerLogo" src="/marca/mka-logo.webp" alt={`Logo de ${BRAND_NAME} · ${BRAND_TAGLINE}`} width={900} height={900} />
          <div>
            <Brand tone="light" />
            <p>Canastas navideñas y regalos corporativos armados a mano, con atención personalizada.</p>
          </div>
        </div>
        <div>
          <h4>Compra</h4>
          <p>Catálogo</p><p>Carrito</p><p>Checkout</p>
        </div>
        <div>
          <h4>Empresas</h4>
          <p>Cotizaciones</p><p>Pedidos por volumen</p><p>Personalización</p>
        </div>
        <div>
          <h4>Contacto</h4>
          <p>Lima, Perú</p><p>ventas@canastasperu.pe</p><p>+51 999 999 999</p>
        </div>
      </div>
      <div className="shell footerBottom">© 2026 {BRAND_NAME} · {BRAND_TAGLINE} · Prototipo visual</div>
    </footer>
  );
}
