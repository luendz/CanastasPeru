import Link from "next/link";
import CatalogBrowser from "@/components/CatalogBrowser";

export default function CatalogoPage() {
  return (
    <>
      <section className="catalogHero">
        <div className="shell catalogHeroInner">
          <div>
            <span className="eyebrow">Catálogo Navidad 2026</span>
            <h1>Canastas para <em>cada</em> mesa.</h1>
          </div>
          <p>Desde la clásica familiar hasta la ejecutiva para tus clientes. Todas se pueden personalizar con otro tipo de canasta al elegirlas.</p>
        </div>
      </section>

      <section className="shell catalogBody">
        <CatalogBrowser />

        <div className="catalogCta">
          <div>
            <h3>¿No encuentras la <em>ideal</em>?</h3>
            <p>Armamos canastas a medida desde 20 unidades, con tu logo y tu presupuesto.</p>
          </div>
          <Link className="btn btnPrimary" href="/cotizacion">Armar una a medida</Link>
        </div>
      </section>
    </>
  );
}
