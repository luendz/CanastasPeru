import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import { products } from "@/lib/mock-data";

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
        <ProductDetail product={product} />
      </section>

      <section className="relatedSection">
        <div className="shell">
          <div className="sectionHead">
            <div><span className="eyebrow">Sigue explorando</span><h2>También te puede <em>gustar</em></h2></div>
            <Link className="textLink" href="/catalogo">Ver catálogo →</Link>
          </div>
          <div className="productGrid relatedGrid">
            {related.map((item) => <ProductCard key={item.slug} product={item} />)}
          </div>
        </div>
      </section>
    </>
  );
}
