import Link from "next/link";
import { ViewTransition } from "react";
import { Product, formatPrice } from "@/lib/mock-data";
import ProductComposition from "@/components/ProductComposition";

export default function ProductCard({ product }: { product: Product }) {
  const href = `/producto/${product.slug}`;
  return (
    <article className="cardV2">
      <Link className="cardV2Visual" href={href} aria-label={`Ver ${product.name}`} draggable={false}>
        {product.badge && <span className="cardV2Badge">{product.badge}</span>}
        {/* Misma canasta que en el detalle: el navegador la anima de un lugar al otro. */}
        <ViewTransition name={`basket-${product.slug}`} share="basketMorph" default="none">
          <div className="cardV2Basket">
            <ProductComposition product={product} />
          </div>
        </ViewTransition>
      </Link>
      <div className="cardV2Body">
        <div className="cardV2Top">
          <h3><Link href={href}>{product.name}</Link></h3>
          <p className="cardV2Price">
            {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
            <strong>{formatPrice(product.price)}</strong>
          </p>
        </div>
        <p className="cardV2Items">{product.items.join(", ")}.</p>
        <Link className="cardV2Link" href={href}>Ver canasta <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
