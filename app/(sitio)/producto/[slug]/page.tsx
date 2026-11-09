import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { lineaDe } from "@/lib/lineas";
import { envasesDe } from "@/lib/mock-data";
import { SITIO, absoluta, jsonLd } from "@/lib/seo";
import { SLUGS_ANTIGUOS } from "@/lib/slugs-antiguos";

/** Título, descripción y vista previa propios de cada canasta (Google y al compartir el enlace). */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalogo();
  const product = products.find((item) => item.slug === slug);
  if (!product) return { title: "Canasta no encontrada", robots: { index: false } };
  const descripcion = (product.description || `${product.name}: canasta navideña armada a mano en Lima.`).slice(0, 300);
  const imagen = product.baseImage ? [{ url: product.baseImage, alt: product.name }] : undefined;
  return {
    title: product.name,
    description: descripcion,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: { type: "website", title: product.name, description: descripcion, url: `/producto/${product.slug}`, ...(imagen ? { images: imagen } : {}) },
    twitter: { card: "summary_large_image", title: product.name, description: descripcion, ...(imagen ? { images: imagen.map((i) => i.url) } : {}) },
  };
}

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

  // Datos estructurados: Google puede mostrar la canasta con su precio en soles.
  const precios = envasesDe(basketTypes, product).map((e) => e.precio).filter((p) => p > 0);
  const url = `${SITIO}/producto/${product.slug}`;
  const producto = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.baseImage ? [absoluta(product.baseImage)] : undefined,
    category: product.category,
    brand: { "@type": "Brand", name: "MKA Canastas Navideñas & Regalos" },
    url,
    offers: precios.length > 1
      ? { "@type": "AggregateOffer", priceCurrency: "PEN", lowPrice: Math.min(...precios).toFixed(2), highPrice: Math.max(...precios).toFixed(2), offerCount: precios.length, availability: "https://schema.org/InStock", url }
      : { "@type": "Offer", priceCurrency: "PEN", price: (precios[0] ?? product.price).toFixed(2), availability: "https://schema.org/InStock", url },
  };
  const ruta = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO },
      { "@type": "ListItem", position: 2, name: "Canastas", item: `${SITIO}/canastas` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(producto)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ruta)} />
      <nav className="shell breadcrumb" aria-label="Ruta">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href="/canastas">Canastas</Link><span aria-hidden="true">/</span>
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
