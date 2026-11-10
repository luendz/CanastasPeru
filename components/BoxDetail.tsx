"use client";

import Link from "next/link";
import { useState } from "react";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import { carrito } from "@/lib/carrito";
import { BasketType, Product, envaseElegido, formatPrice, separarInsignias } from "@/lib/mock-data";

/**
 * Ficha de un box navideño: foto completa, nombre, precio, lo que incluye y
 * agregar al carrito, todo a la vista en la primera pantalla.
 */
export default function BoxDetail({ product, basketTypes }: { product: Product; basketTypes: BasketType[] }) {
  const envase = envaseElegido(basketTypes, product);
  const precio = envase?.precio ?? product.price;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const incluye = product.incluye ?? [];

  function agregar() {
    carrito.agregar(product.slug, envase?.id ?? product.baseType ?? "box", qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  return (
    <div className="boxDetail">
      <div className="boxFoto">
        {product.badge && <span className="badges">{separarInsignias(product.badge).map((b) => <span className="badge" key={b}>{b}</span>)}</span>}
        {product.foto ? <img src={product.foto} alt={product.name} /> : <span className="boxFotoVacia" aria-hidden="true">🎁</span>}
      </div>

      <div className="boxInfo">
        <span className="eyebrow">Boxes navideños</span>
        <h1>{product.name}</h1>
        <div className="boxPrecio">
          <strong>{formatPrice(precio)}</strong>
          {product.oldPrice && product.oldPrice > precio && <del>{formatPrice(product.oldPrice)}</del>}
          <small className="igvNota">Incluido IGV</small>
        </div>
        {product.description && <p className="boxLead">{product.description}</p>}

        {incluye.length > 0 && (
          <div className="boxIncluye">
            <h2><span aria-hidden="true">🎁</span> ¿Qué incluye? <small>({incluye.length} {incluye.length === 1 ? "producto" : "productos"})</small></h2>
            <ul>
              {incluye.map((item, n) => (
                <li key={`${n}-${item}`}><span className="boxCheck" aria-hidden="true">✓</span>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="boxCompra">
          <div>
            <span className="buyLabel">Cantidad</span>
            <div className="stepper">
              <button type="button" aria-label="Quitar uno" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <input aria-label="Cantidad" inputMode="numeric" value={qty} onChange={(e) => setQty(Math.min(500, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} />
              <button type="button" aria-label="Agregar uno" onClick={() => setQty((q) => Math.min(500, q + 1))}>+</button>
            </div>
          </div>
          <div className="boxTotal">
            <span className="buyLabel">Total</span>
            <strong><AnimatedPrice value={precio * qty} /></strong>
          </div>
          <button type="button" className="btn btnPrimary addBtn boxAgregar" data-added={added || undefined} onClick={agregar}>
            <b className="addLabel">Agregar al carrito</b>
            <b className="addDone" aria-hidden={!added}>✓ Agregado al carrito</b>
          </button>
        </div>
        <p className="addFollow" data-show={added || undefined}><Link href="/carrito">Ver carrito →</Link></p>
        <p className="srOnly" aria-live="polite">{added ? `${qty} ${qty === 1 ? "box agregado" : "boxes agregados"} al carrito` : ""}</p>
      </div>
    </div>
  );
}
