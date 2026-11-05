import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { lineaDe } from "@/lib/lineas";
import { SLUGS_ANTIGUOS } from "@/lib/slugs-antiguos";

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, basketTypes } = await getCatalogo();
  const product = products.find((item) => item.slug === slug);
  if (!product) {
    const nuevo = SLUGS_ANTIGUOS[slug];
    if (nuevo && products.some((item) => item.slug === nuevo)) permanentRedirect(`/producto/${nuevo}`);
    notFound();
  }

  // Primero las canastas de la misma línea (Premium con Premium…), las de precio más cercano;
  // si no alcanzan para 3, se completa con las de otras líneas (sin Boxes, que está oculto).
  const linea = lineaDe(product)?.id;
  const cercania = (item: typeof product) => Math.abs(item.price - product.price);
  const otras = products.filter((item) => item.slug !== product.slug && lineaDe(item)?.id !== "boxes");
  const related = [
    ...otras.filter((item) => lineaDe(item)?.id === linea).sort((a, b) => cercania(a) - cercania(b)),
    ...otras.filter((item) => lineaDe(item)?.id !== linea).sort((a, b) => cercania(a) - cercania(b)),
  ].slice(0, 3);

  return (
    <>
      <nav className="shell breadcrumb" aria-label="Ruta">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href="/catalogo">Catálogo</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="shell productDetail">
        <ProductDetail product={product} basketTypes={basketTypes} />
      </section>

      <section className="relatedSection">
        <div className="shell">
          <Reveal className="sectionHead">
            <div><span className="eyebrow" data-reveal-item style={{ "--i": 0 } as React.CSSProperties}>Sigue explorando</span><h2><SplitWords text="También te puede *gustar*" /></h2></div>
            <Link className="textLink" data-reveal-item style={{ "--i": 4 } as React.CSSProperties} href={linea && linea !== "boxes" ? `/canastas/${linea}` : "/canastas"}>Ver catálogo →</Link>
          </Reveal>
          <Reveal className="productGrid relatedGrid" threshold={0.1}>
            {related.map((item, n) => (
              <div className="gridItem" data-reveal-item style={{ "--i": n } as React.CSSProperties} key={item.slug}>
                <ProductCard product={item} />
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
