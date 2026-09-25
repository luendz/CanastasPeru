import Brand from "@/components/Brand";
import Reveal from "@/components/motion/Reveal";
import type { Contenido } from "@/lib/contenido";

type FooterProps = { marca: Contenido["marca"]; contacto: Contenido["contacto"]; pie: Contenido["pie"] };

export default function Footer({ marca, contacto, pie }: FooterProps) {
  return (
    <footer className="footer">
      <div className="textileBand" aria-hidden="true" />
      <Reveal className="shell footerGrid" threshold={0.15}>
        <div className="footerAbout" data-reveal-item style={{ "--i": 0 } as React.CSSProperties}>
          <img className="footerLogo" src={marca.logo} alt={`Logo de ${marca.nombre} · ${marca.lema}`} width={900} height={900} />
          <div>
            <Brand marca={marca} tone="light" />
            <p>{pie.texto}</p>
          </div>
        </div>
        <div data-reveal-item style={{ "--i": 1 } as React.CSSProperties}>
          <h4>Compra</h4>
          <p>Catálogo</p><p>Carrito</p><p>Checkout</p>
        </div>
        <div data-reveal-item style={{ "--i": 2 } as React.CSSProperties}>
          <h4>Empresas</h4>
          <p>Cotizaciones</p><p>Pedidos por volumen</p><p>Personalización</p>
        </div>
        <div data-reveal-item style={{ "--i": 3 } as React.CSSProperties}>
          <h4>Contacto</h4>
          <p>{contacto.ciudad}</p><p>{contacto.correo}</p><p>{contacto.telefono}</p>
        </div>
      </Reveal>
      <div className="shell footerBottom">{pie.derechos}</div>
    </footer>
  );
}
