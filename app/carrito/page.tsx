import Link from "next/link";
import { formatPrice, products } from "@/lib/mock-data";

export default function CarritoPage() {
  const items = [products[1], products[3]];
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <section className="section shell">
      <div className="pageIntro"><span className="eyebrow">Tu compra</span><h1>Carrito</h1><p>Revisa tus productos antes de continuar.</p></div>
      <div className="cartLayout">
        <div className="cartList">
          {items.map((item) => (
            <article className="cartItem" key={item.slug}>
              <div className="cartThumb">{item.emoji}</div>
              <div className="cartInfo"><strong>{item.name}</strong><span>{item.category}</span><button className="linkButton">Eliminar</button></div>
              <div className="cartQty"><button>−</button><span>1</span><button>+</button></div>
              <strong>{formatPrice(item.price)}</strong>
            </article>
          ))}
        </div>
        <aside className="summaryCard">
          <h3>Resumen</h3>
          <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div><span>Delivery</span><span>Se calcula en checkout</span></div>
          <hr />
          <div className="summaryTotal"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
          <Link className="btn btnPrimary full" href="/checkout">Continuar compra</Link>
          <Link className="textLink centered" href="/catalogo">Seguir comprando</Link>
        </aside>
      </div>
    </section>
  );
}
