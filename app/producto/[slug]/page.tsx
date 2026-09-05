import Link from "next/link";
import { notFound } from "next/navigation";
import ProductComposition from "@/components/ProductComposition";
import { formatPrice, products } from "@/lib/mock-data";

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <section className="section shell productDetail">
      <div className="detailVisual">
        <ProductComposition product={product} variant="detail" />
      </div>
      <div className="detailInfo">
        <span className="eyebrow">{product.category}</span>
        <h1>{product.name}</h1>
        <div className="detailPrice"><strong>{formatPrice(product.price)}</strong>{product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}</div>
        <p>{product.description}</p>
        <div className="detailPanel"><h3>Incluye</h3><ul>{product.items.map((item) => <li key={item}>✓ {item}</li>)}</ul></div>
        <div className="quantityRow"><label>Cantidad</label><input className="input qty" defaultValue="1" type="number" min="1" /></div>
        <div className="heroActions"><Link className="btn btnPrimary" href="/carrito">Agregar al carrito</Link><Link className="btn btnGhost" href="/cotizacion">Cotizar volumen</Link></div>
        <div className="miniNotes"><span>🚚 Delivery programado</span><span>🧾 Boleta o factura</span><span>🎁 Presentación lista para regalar</span></div>
      </div>
    </section>
  );
}
