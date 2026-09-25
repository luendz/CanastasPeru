import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, basketTypes } = await getCatalogo();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3);

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
            <Link className="textLink" data-reveal-item style={{ "--i": 4 } as React.CSSProperties} href="/catalogo">Ver catálogo →</Link>
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
