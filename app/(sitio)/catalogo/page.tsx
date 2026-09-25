import Link from "next/link";
import CatalogBrowser from "@/components/CatalogBrowser";
import Enfasis from "@/components/Enfasis";
import { getContenido } from "@/lib/contenido";
import { getCatalogo } from "@/lib/catalogo";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";

export default async function CatalogoPage() {
  const [{ products }, { catalogo: t }] = await Promise.all([getCatalogo(), getContenido()]);
  return (
    <>
      <section className="catalogHero">
        <div className="shell catalogHeroInner">
          <div>
            <span className="eyebrow">{t.etiqueta}</span>
            <h1><SplitWords text={t.titulo} immediate /></h1>
          </div>
          <p>{t.texto}</p>
        </div>
      </section>

      <section className="shell catalogBody">
        <CatalogBrowser products={products} />

        <Reveal className="catalogCta">
          <div>
            <h3 data-reveal-item style={{ "--i": 0 } as React.CSSProperties}><Enfasis text={t.ctaTitulo} /></h3>
            <p>{t.ctaTexto}</p>
          </div>
          <Link className="btn btnPrimary" href="/cotizacion">{t.ctaBoton}</Link>
        </Reveal>
      </section>
    </>
  );
}
