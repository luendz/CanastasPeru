import Link from "next/link";
import Enfasis from "@/components/Enfasis";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import type { Contenido } from "@/lib/contenido";
import { LINEAS, lineaDe, productosDe, type Linea } from "@/lib/lineas";
import type { Product } from "@/lib/mock-data";

type Props = {
  products: Product[];
  textos: Contenido["catalogo"];
  /** Líneas a mostrar, en orden. */
  lineas: Linea["id"][];
  actual?: Linea["id"];
  cabecera: { etiqueta: string; titulo: string; texto: string };
};

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

/** Catálogo agrupado por línea: Económicas, Premium, Ejecutivas (y Boxes). */
export default function CatalogoLineas({ products, textos, lineas, actual, cabecera }: Props) {
  const secciones = lineas.map((id) => {
    const n = LINEAS.findIndex((l) => l.id === id);
    return { linea: LINEAS[n], texto: textos.lineas[n], productos: productosDe(products, id) };
  });
  // Canastas con una categoría fuera de las líneas: se muestran al final para no perderlas.
  const otras = !actual ? products.filter((p) => !lineaDe(p)) : [];
  const conPestanas = actual !== "boxes";

  return (
    <>
      <section className="catalogHero">
        <div className="shell catalogHeroInner">
          <div>
            <span className="eyebrow">{cabecera.etiqueta}</span>
            <h1><SplitWords text={cabecera.titulo} immediate /></h1>
          </div>
          <p>{cabecera.texto}</p>
        </div>
      </section>

      <section className="shell catalogBody">
        {conPestanas && (
          <nav className="chipRow lineasTabs" aria-label="Líneas de canastas">
            <Link className="chip" href="/canastas" aria-current={!actual ? "page" : undefined}>Todas</Link>
            {LINEAS.filter((l) => l.id !== "boxes").map((l) => (
              <Link key={l.id} className="chip" href={`/canastas/${l.id}`} aria-current={actual === l.id ? "page" : undefined}>{l.titulo}</Link>
            ))}
            <Link className="chip" href="/boxes">Boxes navideños</Link>
          </nav>
        )}

        {secciones.map(({ linea, texto, productos }) => (
          <section key={linea.id} className="lineaSeccion" id={linea.id}>
            {(!actual || lineas.length > 1) && (
              <div className="lineaHead">
                <h2>{texto?.titulo ?? linea.titulo}</h2>
                {texto?.texto && <p>{texto.texto}</p>}
              </div>
            )}
            {productos.length > 0 ? (
              <Reveal className="productGrid catalogGrid" threshold={0.1}>
                {productos.map((product, n) => (
                  <div className="gridItem" data-reveal-item style={i(n)} key={product.slug}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </Reveal>
            ) : (
              <p className="lineaVacia">Muy pronto tendremos {linea.titulo.toLowerCase()} disponibles. <Link href="/cotizacion">Consúltanos por una a medida →</Link></p>
            )}
          </section>
        ))}

        {otras.length > 0 && (
          <section className="lineaSeccion">
            <div className="lineaHead"><h2>Otras canastas</h2></div>
            <div className="productGrid catalogGrid">
              {otras.map((product) => <div className="gridItem" key={product.slug}><ProductCard product={product} /></div>)}
            </div>
          </section>
        )}

        <Reveal className="catalogCta">
          <div>
            <h3 data-reveal-item style={i(0)}><Enfasis text={textos.ctaTitulo} /></h3>
            <p>{textos.ctaTexto}</p>
          </div>
          <Link className="btn btnPrimary" href="/cotizacion">{textos.ctaBoton}</Link>
        </Reveal>
      </section>
    </>
  );
}
