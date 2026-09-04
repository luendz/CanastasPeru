import Link from "next/link";
import { Product, formatPrice } from "@/lib/mock-data";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="productCard">
      <Link className="productVisual" href={`/producto/${product.slug}`}>
        {product.badge && <span className="badge">{product.badge}</span>}
        <span className="productEmoji">{product.emoji}</span>
      </Link>
      <div className="productBody">
        <span className="eyebrow">{product.category}</span>
        <Link className="productTitle" href={`/producto/${product.slug}`}>{product.name}</Link>
        <div className="priceRow">
          <strong>{formatPrice(product.price)}</strong>
          {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
        </div>
        <Link className="btn btnDark full" href={`/producto/${product.slug}`}>Ver producto</Link>
      </div>
    </article>
  );
}
