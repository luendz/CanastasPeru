"use client";

import Link from "next/link";
import { useState } from "react";
import ProductComposition from "@/components/ProductComposition";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import { findBasketType, formatPrice, mockCart, products } from "@/lib/mock-data";

export default function CartView() {
  const [cart, setCart] = useState(mockCart);
  const [leaving, setLeaving] = useState<string[]>([]);

  const lines = cart.flatMap(({ slug, qty }) => {
    const product = products.find((p) => p.slug === slug);
    return product ? [{ product, qty }] : [];
  });
  const units = lines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const savings = lines.reduce((sum, l) => sum + ((l.product.oldPrice ?? l.product.price) - l.product.price) * l.qty, 0);

  const setQty = (slug: string, qty: number) =>
    setCart((items) => items.map((item) => (item.slug === slug ? { ...item, qty: Math.max(1, qty) } : item)));
  // Primero la fila se pliega y recién después sale del carrito.
  const remove = (slug: string) => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLeaving((l) => [...l, slug]);
    window.setTimeout(() => {
      setCart((items) => items.filter((item) => item.slug !== slug));
      setLeaving((l) => l.filter((s) => s !== slug));
    }, reduce ? 0 : 420);
  };

  if (lines.length === 0) {
    return (
      <div className="emptyState cartEmpty">
        <span aria-hidden="true">✦</span>
        <h3>Tu carrito está vacío</h3>
        <p>Todavía hay tiempo de sorprender a alguien esta Navidad.</p>
        <Link className="btn btnPrimary" href="/catalogo">Explorar canastas</Link>
      </div>
    );
  }

  return (
    <div className="cartLayout">
      <div>
        <div className="cartListHead">
          <span><strong>{units}</strong> {units === 1 ? "canasta" : "canastas"}</span>
          <Link className="textLink" href="/catalogo">+ Agregar otra</Link>
        </div>
        <ul className="cartList">
          {lines.map(({ product, qty }, i) => (
            <li className="cartRow" key={product.slug} data-leaving={leaving.includes(product.slug) || undefined} style={{ "--i": i } as React.CSSProperties}>
             <div className="cartItem">
              <Link className="cartThumb" href={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`}>
                <span className="cartThumbStage"><ProductComposition product={product} /></span>
              </Link>
              <div className="cartInfo">
                <span className="eyebrow">{product.category}</span>
                <Link className="cartName" href={`/producto/${product.slug}`}>{product.name}</Link>
                <span className="cartMeta">{findBasketType(product.baseImage).label} · {product.items.length} productos</span>
                <span className="cartUnit">{formatPrice(product.price)} c/u</span>
              </div>
              <div className="cartControls">
                <div className="stepper stepperSm">
                  <button type="button" aria-label={`Quitar una ${product.name}`} disabled={qty <= 1} onClick={() => setQty(product.slug, qty - 1)}>−</button>
                  <input aria-label={`Cantidad de ${product.name}`} inputMode="numeric" value={qty} onChange={(e) => setQty(product.slug, Number(e.target.value.replace(/\D/g, "")) || 1)} />
                  <button type="button" aria-label={`Agregar una ${product.name}`} onClick={() => setQty(product.slug, qty + 1)}>+</button>
                </div>
                <strong className="cartLineTotal"><AnimatedPrice value={product.price * qty} duration={450} /></strong>
                <button type="button" className="linkButton" onClick={() => remove(product.slug)}>Eliminar</button>
              </div>
             </div>
            </li>
          ))}
        </ul>

        <div className="giftNote">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>¿Es un regalo?</strong>
            <p>En el siguiente paso podrás escribir una dedicatoria y programar la entrega para cada destinatario.</p>
          </div>
        </div>
      </div>

      <aside className="summaryCard sticky">
        <h3>Resumen del pedido</h3>
        <div><span>Subtotal ({units} {units === 1 ? "canasta" : "canastas"})</span><strong><AnimatedPrice value={subtotal} /></strong></div>
        <div><span>Delivery</span><span className="muted">Se calcula en el siguiente paso</span></div>
        <form className="couponRow" onSubmit={(e) => e.preventDefault()}>
          <label className="srOnly" htmlFor="cupon">Código de descuento</label>
          <input className="input" id="cupon" placeholder="Código de descuento" />
          <button type="submit" className="btn btnGhost">Aplicar</button>
        </form>
        <hr />
        <div className="summaryTotal"><span>Total</span><strong><AnimatedPrice value={subtotal} /></strong></div>
        <p className="muted summaryTax">Precios incluyen IGV.</p>
        {savings > 0 && <p className="saveTag summarySave">Estás ahorrando <AnimatedPrice value={savings} /> en promociones</p>}
        <Link className="btn btnPrimary full" href="/checkout">Continuar compra →</Link>
        <ul className="summaryPerks">
          <li>✦ Boleta o factura electrónica</li>
          <li>✦ Entrega programada en Lima</li>
        </ul>
        <Link className="summaryB2B" href="/cotizacion">¿Más de 20 canastas? <strong>Cotiza para empresa →</strong></Link>
      </aside>
    </div>
  );
}
