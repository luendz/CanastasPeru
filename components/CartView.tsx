"use client";

import Link from "next/link";
import { useState } from "react";
import ProductComposition from "@/components/ProductComposition";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import { carrito, unidades, useCarrito } from "@/lib/carrito";
import type { Contenido } from "@/lib/contenido";
import { findBasketType, formatPrice, type BasketType, type Product } from "@/lib/mock-data";

type Props = {
  products: Product[];
  basketTypes: BasketType[];
  opciones: Pick<Contenido["checkout"], "notaImpuestos" | "tarjetaPrecio" | "tarjetaTitulo" | "tarjetaTexto" | "tarjetaImagen">;
};

/** Precio de una canasta con el tipo de canasta elegido (igual que en la base). */
export function precioCon(product: Product, tipo: BasketType | undefined, basketTypes: BasketType[]) {
  const propia = findBasketType(basketTypes, product);
  return product.price + (tipo ? tipo.priceDelta - propia.priceDelta : 0);
}

/** Líneas del carrito con su canasta y precio actuales (se ignoran las que ya no existen). */
export function lineasCarrito(lineas: { slug: string; tipo: string; cantidad: number }[], products: Product[], basketTypes: BasketType[]) {
  return lineas.flatMap((l) => {
    const product = products.find((p) => p.slug === l.slug);
    if (!product) return [];
    const tipo = basketTypes.find((t) => t.id === l.tipo) ?? findBasketType(basketTypes, product);
    // tipoId es el guardado en el carrito (para editar la línea); tipo, la canasta a mostrar.
    return [{ slug: l.slug, cantidad: l.cantidad, tipoId: l.tipo, product, tipo, precio: precioCon(product, tipo, basketTypes) }];
  });
}

export default function CartView({ products, basketTypes, opciones }: Props) {
  const c = useCarrito();
  const [leaving, setLeaving] = useState<string[]>([]);

  const lines = lineasCarrito(c.lineas, products, basketTypes);
  const units = unidades(c);
  const canastas = lines.reduce((sum, l) => sum + l.precio * l.cantidad, 0);
  const tarjetas = c.tarjetas.activa ? c.tarjetas.cantidad : 0;
  const totalTarjetas = tarjetas * opciones.tarjetaPrecio;
  const subtotal = canastas + totalTarjetas;
  const savings = lines.reduce((sum, l) => sum + ((l.product.oldPrice ?? l.product.price) - l.product.price) * l.cantidad, 0);
  const clave = (l: { slug: string; tipoId: string }) => `${l.slug}|${l.tipoId}`;

  // Primero la fila se pliega y recién después sale del carrito.
  const remove = (slug: string, tipo: string) => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = `${slug}|${tipo}`;
    setLeaving((l) => [...l, k]);
    window.setTimeout(() => {
      carrito.quitar(slug, tipo);
      setLeaving((l) => l.filter((s) => s !== k));
    }, reduce ? 0 : 420);
  };

  if (lines.length === 0) {
    return (
      <div className="emptyState cartEmpty">
        <span aria-hidden="true">✦</span>
        <h3>Tu carrito está vacío</h3>
        <p>Todavía hay tiempo de sorprender a alguien esta Navidad.</p>
        <div className="emptyActions">
          <Link className="btn btnPrimary" href="/canastas">Ver canastas</Link>
          <Link className="btn btnGhost" href="/boxes">Ver boxes navideños</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cartLayout">
      <div>
        <div className="cartListHead">
          <span><strong>{units}</strong> {units === 1 ? "canasta" : "canastas"}</span>
          <Link className="textLink" href="/canastas">+ Agregar otra</Link>
        </div>
        <ul className="cartList">
          {lines.map((l, i) => (
            <li className="cartRow" key={clave(l)} data-leaving={leaving.includes(clave(l)) || undefined} style={{ "--i": i } as React.CSSProperties}>
              <div className="cartItem">
                <Link className="cartThumb" href={`/producto/${l.product.slug}`} aria-label={`Ver ${l.product.name}`}>
                  <span className="cartThumbStage"><ProductComposition product={l.product} baseImage={l.tipo.image} /></span>
                </Link>
                <div className="cartInfo">
                  <span className="eyebrow">{l.product.category}</span>
                  <Link className="cartName" href={`/producto/${l.product.slug}`}>{l.product.name}</Link>
                  <span className="cartMeta">{l.tipo.label} · {l.product.items.length} productos</span>
                  <span className="cartUnit">{formatPrice(l.precio)} c/u</span>
                </div>
                <div className="cartControls">
                  <div className="stepper stepperSm">
                    <button type="button" aria-label={`Quitar una ${l.product.name}`} disabled={l.cantidad <= 1} onClick={() => carrito.cantidad(l.slug, l.tipoId, l.cantidad - 1)}>−</button>
                    <input aria-label={`Cantidad de ${l.product.name}`} inputMode="numeric" value={l.cantidad} onChange={(e) => carrito.cantidad(l.slug, l.tipoId, Number(e.target.value.replace(/\D/g, "")) || 1)} />
                    <button type="button" aria-label={`Agregar una ${l.product.name}`} onClick={() => carrito.cantidad(l.slug, l.tipoId, l.cantidad + 1)}>+</button>
                  </div>
                  <strong className="cartLineTotal"><AnimatedPrice value={l.precio * l.cantidad} duration={450} /></strong>
                  <button type="button" className="linkButton" onClick={() => remove(l.slug, l.tipoId)}>Eliminar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <section className="giftCard" data-activa={c.tarjetas.activa || undefined}>
          <div className="giftCardImg" aria-hidden="true">
            {opciones.tarjetaImagen ? <img src={opciones.tarjetaImagen} alt="" /> : <span className="giftCardFallback">¡Feliz<br />Navidad!</span>}
          </div>
          <div className="giftCardBody">
            <div className="giftCardHead">
              <h3>{opciones.tarjetaTitulo}</h3>
              <span className="giftCardPrice">{formatPrice(opciones.tarjetaPrecio)} por tarjeta</span>
            </div>
            <p>{opciones.tarjetaTexto}</p>
            <label className="giftCardCheck">
              <input type="checkbox" checked={c.tarjetas.activa} onChange={(e) => carrito.tarjetas({ activa: e.target.checked, cantidad: e.target.checked ? Math.max(1, c.tarjetas.cantidad) : c.tarjetas.cantidad })} />
              <span>Sí, es un regalo: agregar tarjeta <small>(+ {formatPrice(opciones.tarjetaPrecio)} c/u)</small></span>
            </label>
            {c.tarjetas.activa && (
              <div className="giftCardFields">
                <div className="giftCardQty">
                  <span>¿Cuántas tarjetas?</span>
                  <div className="stepper stepperSm">
                    <button type="button" aria-label="Una tarjeta menos" disabled={c.tarjetas.cantidad <= 1} onClick={() => carrito.tarjetas({ cantidad: c.tarjetas.cantidad - 1 })}>−</button>
                    <input aria-label="Cantidad de tarjetas" inputMode="numeric" value={c.tarjetas.cantidad} onChange={(e) => carrito.tarjetas({ cantidad: Math.min(500, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)) })} />
                    <button type="button" aria-label="Una tarjeta más" onClick={() => carrito.tarjetas({ cantidad: c.tarjetas.cantidad + 1 })}>+</button>
                  </div>
                  {units > 1 && c.tarjetas.cantidad !== units && (
                    <button type="button" className="textLink" onClick={() => carrito.tarjetas({ cantidad: units })}>Una por canasta ({units})</button>
                  )}
                </div>
                <label className="giftCardText">
                  <span>Escribe tu dedicatoria</span>
                  <textarea className="textarea" maxLength={240} value={c.tarjetas.dedicatoria} placeholder="Ej.: ¡Feliz Navidad! Gracias por compartir este año con nosotros." onChange={(e) => carrito.tarjetas({ dedicatoria: e.target.value })} />
                  <small>{c.tarjetas.dedicatoria.length}/240</small>
                </label>
              </div>
            )}
          </div>
        </section>
      </div>

      <aside className="summaryCard sticky">
        <h3>Resumen del pedido</h3>
        {lines.map((l) => (
          <div key={clave(l)} className="summaryLine"><span>{l.product.name} ({l.cantidad})</span><span>{formatPrice(l.precio * l.cantidad)}</span></div>
        ))}
        {tarjetas > 0 && <div className="summaryLine"><span>Tarjeta de dedicatoria ({tarjetas})</span><span>{formatPrice(totalTarjetas)}</span></div>}
        <hr />
        <div><span>Subtotal</span><strong><AnimatedPrice value={subtotal} /></strong></div>
        <div><span>Delivery</span><span className="muted">Se calcula en el siguiente paso</span></div>
        <hr />
        <div className="summaryTotal"><span>Total</span><strong><AnimatedPrice value={subtotal} /></strong></div>
        <p className="muted summaryTax">{opciones.notaImpuestos}</p>
        {savings > 0 && <p className="saveTag summarySave">Estás ahorrando <AnimatedPrice value={savings} /> en promociones</p>}
        <Link className="btn btnPrimary full" href="/checkout">Continuar con la compra →</Link>
        <Link className="btn btnGhost full" href="/canastas">← Seguir comprando</Link>
        <ul className="summaryPerks">
          <li>✦ Boleta o factura electrónica</li>
          <li>✦ Entrega programada en Lima</li>
        </ul>
        <Link className="summaryB2B" href="/cotizacion">¿Más de 20 canastas? <strong>Cotiza para empresa →</strong></Link>
      </aside>
    </div>
  );
}
