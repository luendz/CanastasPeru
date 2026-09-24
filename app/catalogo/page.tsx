import Link from "next/link";
import CatalogBrowser from "@/components/CatalogBrowser";
import PageHead from "@/components/PageHead";
import Reveal from "@/components/motion/Reveal";

export const metadata = { title: "Canastas" };

export default function CatalogoPage() {
  return (
    <>
      <PageHead
        kicker="Catálogo · Navidad 2026"
        title="Canastas para cada mesa."
        lead="De la clásica familiar a la ejecutiva para tus clientes. En el detalle de cada una puedes cambiar el tipo de canasta."
      />

      <section className="shell catalogBody">
        <CatalogBrowser />

        <Reveal className="catalogCta">
          <div>
            <h3>¿No encuentras la que buscas?</h3>
            <p>Desde 20 unidades armamos canastas a medida, con tu logo y dentro de tu presupuesto.</p>
          </div>
          <Link className="btnV2 btnV2Solid" href="/cotizacion">Armar una a medida <span aria-hidden="true">→</span></Link>
        </Reveal>
      </section>
    </>
  );
}
