import Link from "next/link";
import HeroBasket from "@/components/home/HeroBasket";
import Shelf from "@/components/home/Shelf";
import StoryBasket from "@/components/home/StoryBasket";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { formatPrice, products } from "@/lib/mock-data";

const ribbon = ["Navidad 2026", "Pedidos abiertos", "Entregas programadas en Lima", "Boleta o factura", "Tarjeta con dedicatoria"];

export default function HomePage() {
  const hero = products.find((p) => p.slug === "canasta-ejecutiva") ?? products[0];
  const story = products.find((p) => p.slug === "canasta-premium") ?? products[0];
  const prices = products.map((p) => p.price);
  const fromPrice = Math.min(...prices);

  return (
    <>
      <section className="heroV2">
        <div className="shell heroV2Grid">
          <div className="heroV2Copy">
            <p className="heroKicker">MKA · Lima, Navidad 2026</p>
            <h1><SplitWords text="Canastas navideñas armadas a mano, una por una." immediate /></h1>
            <p className="heroLead">Panetón, champagne y lo que no puede faltar en la mesa. Para tu familia, tu equipo o ese cliente que quieres cuidar.</p>
            <div className="heroV2Actions">
              <Link className="btnV2 btnV2Solid" href="/catalogo">Ver las canastas <span aria-hidden="true">→</span></Link>
              <Link className="btnV2 btnV2Line" href="/cotizacion">Pedido para empresa</Link>
            </div>
          </div>
          <HeroBasket product={hero} fromPrice={fromPrice} />
        </div>
      </section>

      <div className="ribbons" aria-hidden="true">
        <div className="ribbon ribbonGold"><div className="ribbonTrack">{[...ribbon, ...ribbon, ...ribbon].map((t, i) => <span key={i}>{t}</span>)}</div></div>
        <div className="ribbon ribbonWine"><div className="ribbonTrack ribbonReverse">{[...ribbon, ...ribbon, ...ribbon].map((t, i) => <span key={i}>{t}</span>)}</div></div>
      </div>

      <section className="sectionV2">
        <Reveal className="shell sectionV2Head">
          <h2><SplitWords text="Las de esta temporada" /></h2>
          <p data-reveal-item style={{ "--i": 3 } as React.CSSProperties}>
            {products.length} canastas, de {formatPrice(fromPrice)} a {formatPrice(Math.max(...prices))}. Arrastra el estante o pasa el mouse para ver qué trae cada una.
          </p>
        </Reveal>
        <Reveal className="shell" threshold={0.1}>
          <Shelf products={products} />
        </Reveal>
      </section>

      <section className="sectionV2 storySection">
        <Reveal className="shell sectionV2Head">
          <h2><SplitWords text="Cómo llega tu canasta" /></h2>
          <p data-reveal-item style={{ "--i": 3 } as React.CSSProperties}>Del estante a la puerta de quien la recibe, en cuatro pasos.</p>
        </Reveal>
        <div className="shell">
          <StoryBasket product={story} />
        </div>
      </section>

      <section className="shell">
        <Reveal className="corpV2">
          <div className="corpV2Numbers" aria-hidden="true">
            <span data-reveal-item style={{ "--i": 0 } as React.CSSProperties}>20</span>
            <span data-reveal-item style={{ "--i": 1 } as React.CSSProperties}>100</span>
            <span data-reveal-item style={{ "--i": 2 } as React.CSSProperties}>500</span>
          </div>
          <div className="corpV2Copy">
            <h2><SplitWords text="¿Regalos para todo el equipo?" /></h2>
            <p data-reveal-item style={{ "--i": 4 } as React.CSSProperties}>
              Armamos pedidos desde 20 canastas, con tu logo en la tarjeta, y coordinamos la entrega en una o varias sedes, o en la casa de cada colaborador.
            </p>
            <Link data-reveal-item style={{ "--i": 5 } as React.CSSProperties} className="btnV2 btnV2Gold" href="/cotizacion">Pedir cotización <span aria-hidden="true">→</span></Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
