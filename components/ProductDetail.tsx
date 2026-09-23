"use client";

import Link from "next/link";
import { useState } from "react";
import ProductComposition from "@/components/ProductComposition";
import { BasketType, Product, basketTypes, findBasketType, formatPrice } from "@/lib/mock-data";

function deltaLabel(delta: number) {
  if (delta === 0) return "Incluida";
  return delta > 0 ? `+ ${formatPrice(delta)}` : `− ${formatPrice(Math.abs(delta))}`;
}

export default function ProductDetail({ product }: { product: Product }) {
  const ownBasket = findBasketType(product.baseImage);
  const [selected, setSelected] = useState<BasketType>(ownBasket);
  const [qty, setQty] = useState(1);

  const delta = selected.priceDelta - ownBasket.priceDelta;
  const unitPrice = product.price + delta;
  const savings = delta === 0 && product.oldPrice ? product.oldPrice - product.price : 0;
  const imageFor = (name: string) => product.visualItems.find((item) => item.name === name);

  return (
    <>
      <div className="detailMedia">
        <div className="detailVisual">
          {product.badge && <span className="badge">{product.badge}</span>}
          <ProductComposition baseImage={selected.image} product={product} variant="detail" />
          <span className="detailHint">Pasa el cursor sobre cada producto</span>
        </div>
      </div>

      <div className="detailInfo">
        <span className="eyebrow">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="detailLead">{product.description}</p>

        <div className="detailPrice">
          <strong>{formatPrice(unitPrice)}</strong>
          {savings > 0 && <><del>{formatPrice(product.oldPrice!)}</del><span className="saveTag">Ahorras {formatPrice(savings)}</span></>}
        </div>
        {delta !== 0 && <p className="basketNote">{delta > 0 ? `Incluye ${formatPrice(delta)} por la ${selected.label.toLowerCase()}.` : `Descuenta ${formatPrice(Math.abs(delta))} por la ${selected.label.toLowerCase()}.`}</p>}

        <div className="includesPanel">
          <h3>Incluye <small>{product.items.length} productos</small></h3>
          <ul>
            {product.items.map((item) => {
              const visual = imageFor(item);
              return (
                <li key={item}>
                  <span className="includesThumb">
                    {visual?.image ? <img src={visual.image} alt="" /> : <span aria-hidden="true">{visual?.emoji ?? "✦"}</span>}
                  </span>
                  {item}
                </li>
              );
            })}
          </ul>
        </div>

        <fieldset className="basketPicker">
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

        <div className="buyBox">
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
              <strong>{formatPrice(unitPrice * qty)}</strong>
            </div>
          </div>
          <Link className="btn btnPrimary full" href="/carrito">Agregar al carrito</Link>
          {qty >= 10 && <p className="volumeHint">¿Más de 10? <Link href="/cotizacion">Pide precio por volumen →</Link></p>}
        </div>

        <ul className="perks">
          <li><span aria-hidden="true">✦</span><div><strong>Delivery programado</strong><small>Eliges fecha y hora en Lima</small></div></li>
          <li><span aria-hidden="true">✦</span><div><strong>Boleta o factura</strong><small>Comprobante electrónico</small></div></li>
          <li><span aria-hidden="true">✦</span><div><strong>Lista para regalar</strong><small>Con lazo y tarjeta</small></div></li>
        </ul>
      </div>
    </>
  );
}
