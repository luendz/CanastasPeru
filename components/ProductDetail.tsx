"use client";

import Link from "next/link";
import { useState, ViewTransition } from "react";
import ProductComposition from "@/components/ProductComposition";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import SplitWords from "@/components/motion/SplitWords";
import { BasketType, Product, findBasketType, formatPrice } from "@/lib/mock-data";

function deltaLabel(delta: number) {
  if (delta === 0) return "Incluida";
  return delta > 0 ? `+ ${formatPrice(delta)}` : `− ${formatPrice(Math.abs(delta))}`;
}

export default function ProductDetail({ product, basketTypes }: { product: Product; basketTypes: BasketType[] }) {
  const ownBasket = findBasketType(basketTypes, product);
  const [selected, setSelected] = useState<BasketType>(ownBasket);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function addToCart() {
    // Prototipo: avisa al header para que sume y anime el contador.
    window.dispatchEvent(new CustomEvent("mka:cart-add", { detail: { qty } }));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  const delta = selected.priceDelta - ownBasket.priceDelta;
  const unitPrice = product.price + delta;
  const savings = delta === 0 && product.oldPrice ? product.oldPrice - product.price : 0;
  const imageFor = (name: string) => product.visualItems.find((item) => item.name === name);

  return (
    <>
      <div className="detailMedia">
        <div className="detailVisual">
          {product.badge && <span className="badge">{product.badge}</span>}
          <ViewTransition name={`basket-${product.slug}`} share="basketMorph" default="none">
            <div className="detailBasket">
              <ProductComposition baseImage={selected.image} product={product} variant="detail" />
            </div>
          </ViewTransition>
          <span className="detailHint">Pasa el cursor sobre cada producto</span>
        </div>
      </div>

      <div className="detailInfo">
        <span className="eyebrow" style={{ "--i": 0 } as React.CSSProperties}>{product.category}</span>
        <h1><SplitWords text={product.name} immediate /></h1>
        <p className="detailLead" style={{ "--i": 2 } as React.CSSProperties}>{product.description}</p>

        <div className="detailPrice" style={{ "--i": 3 } as React.CSSProperties}>
          <strong><AnimatedPrice value={unitPrice} /></strong>
          {savings > 0 && <><del>{formatPrice(product.oldPrice!)}</del><span className="saveTag">Ahorras {formatPrice(savings)}</span></>}
        </div>
        {delta !== 0 && <p className="basketNote">{delta > 0 ? `Incluye ${formatPrice(delta)} por la ${selected.label.toLowerCase()}.` : `Descuenta ${formatPrice(Math.abs(delta))} por la ${selected.label.toLowerCase()}.`}</p>}

        <div className="includesPanel" style={{ "--i": 4 } as React.CSSProperties}>
          <h3>Incluye <small>{product.items.length} productos</small></h3>
          <ul>
            {product.items.map((item, j) => {
              const visual = imageFor(item);
              return (
                <li key={item} style={{ "--j": j } as React.CSSProperties}>
                  <span className="includesThumb">
                    {visual?.image ? <img src={visual.image} alt="" /> : <span aria-hidden="true">{visual?.emoji ?? "✦"}</span>}
                  </span>
                  {item}
                </li>
              );
            })}
          </ul>
        </div>

        <fieldset className="basketPicker" style={{ "--i": 5 } as React.CSSProperties}>
          <legend><span className="stepNum">1</span> Elige la canasta</legend>
          <div className="basketGrid">
            {basketTypes.map((type) => (
              <label className="basketOption" key={type.id}>
                <input checked={type.id === selected.id} name="tipoCanasta" onChange={() => setSelected(type)} type="radio" value={type.id} />
                <span className="basketCheck" aria-hidden="true">✓</span>
                <img alt="" className="basketThumb" src={type.image} />
                <span className="basketLabel">{type.label}</span>
                <small className="basketHint">{type.hint}</small>
                <small className="basketPrice">{deltaLabel(type.priceDelta - ownBasket.priceDelta)}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="buyBox" style={{ "--i": 6 } as React.CSSProperties}>
          <div className="buyRow">
            <div>
              <span className="buyLabel"><span className="stepNum">2</span> Cantidad</span>
              <div className="stepper">
                <button type="button" aria-label="Quitar una" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <input aria-label="Cantidad" inputMode="numeric" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} />
                <button type="button" aria-label="Agregar una" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            </div>
            <div className="buyTotal">
              <span className="buyLabel">Total</span>
              <strong><AnimatedPrice value={unitPrice * qty} /></strong>
            </div>
          </div>
          <button type="button" className="btn btnPrimary full addBtn" data-added={added || undefined} onClick={addToCart}>
            <b className="addLabel">Agregar al carrito</b>
            <b className="addDone" aria-hidden={!added}>✓ Agregada al carrito</b>
          </button>
          <p className="addFollow" data-show={added || undefined}>
            <Link href="/carrito">Ver carrito →</Link>
          </p>
          <p className="srOnly" aria-live="polite">{added ? `${qty} ${qty === 1 ? "canasta agregada" : "canastas agregadas"} al carrito` : ""}</p>
          {qty >= 10 && <p className="volumeHint">¿Más de 10? <Link href="/cotizacion">Pide precio por volumen →</Link></p>}
        </div>

        <ul className="perks" style={{ "--i": 7 } as React.CSSProperties}>
          <li><span aria-hidden="true">✦</span><div><strong>Delivery programado</strong><small>Eliges fecha y hora en Lima</small></div></li>
          <li><span aria-hidden="true">✦</span><div><strong>Boleta o factura</strong><small>Comprobante electrónico</small></div></li>
          <li><span aria-hidden="true">✦</span><div><strong>Lista para regalar</strong><small>Con lazo y tarjeta</small></div></li>
        </ul>
      </div>
    </>
  );
}
