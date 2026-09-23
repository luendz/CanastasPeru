import Link from "next/link";
import { Product, formatPrice } from "@/lib/mock-data";
import ProductComposition from "@/components/ProductComposition";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="productCard">
      <Link className="productVisual" href={`/producto/${product.slug}`}>
        {product.badge && <span className="badge">{product.badge}</span>}
        <ProductComposition product={product} />
      </Link>
      <div className="productBody">
        <span className="eyebrow">{product.category}</span>
        <Link className="productTitle" href={`/producto/${product.slug}`}>{product.name}</Link>
        <p className="productIncludes">
          {product.items.slice(0, 3).join(" · ")}
          {product.items.length > 3 && <span> +{product.items.length - 3}</span>}
        </p>
        <div className="priceRow">
          <strong>{formatPrice(product.price)}</strong>
          {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
        </div>
        <Link className="btn btnDark full" href={`/producto/${product.slug}`}>Ver producto</Link>
      </div>
    </article>
  );
}
