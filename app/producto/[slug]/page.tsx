import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { products } from "@/lib/mock-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  return { title: product?.name ?? "Canasta" };
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <>
      <nav className="shell breadcrumb" aria-label="Ruta">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href="/catalogo">Canastas</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="shell productDetail">
        <ProductDetail product={product} />
      </section>

      <section className="relatedSection">
        <div className="shell">
          <Reveal className="sectionV2Head">
            <h2><SplitWords text="Otras canastas de la temporada" /></h2>
            <Link data-reveal-item style={{ "--i": 3 } as React.CSSProperties} className="cardV2Link" href="/catalogo">Ver todas <span aria-hidden="true">→</span></Link>
          </Reveal>
          <Reveal className="productGrid relatedGrid" threshold={0.1}>
            {related.map((item, i) => (
              <div className="relatedItem" data-reveal-item style={{ "--i": i } as React.CSSProperties} key={item.slug}>
                <ProductCard product={item} />
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
