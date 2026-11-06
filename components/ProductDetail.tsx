"use client";

import Link from "next/link";
import { useState, ViewTransition } from "react";
import ProductComposition from "@/components/ProductComposition";
import AnimatedPrice from "@/components/motion/AnimatedPrice";
import SplitWords from "@/components/motion/SplitWords";
import { carrito, useCarrito } from "@/lib/carrito";
import { BasketType, EnvaseProducto, Product, envaseElegido, envasesDe, faltaMinimo, formatPrice, separarInsignias } from "@/lib/mock-data";

function deltaLabel(delta: number) {
  if (delta === 0) return "Incluida";
  return delta > 0 ? `+ ${formatPrice(delta)}` : `− ${formatPrice(Math.abs(delta))}`;
}

export default function ProductDetail({ product, basketTypes }: { product: Product; basketTypes: BasketType[] }) {
  const envases = envasesDe(basketTypes, product);
  const ownBasket = envaseElegido(basketTypes, product);
  const [selected, setSelected] = useState<EnvaseProducto>(ownBasket);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // Lo que ya hay en el carrito de esta canasta con este envase también cuenta para el mínimo.
  const enCarrito = useCarrito().lineas.find((l) => l.slug === product.slug && l.tipo === selected.id)?.cantidad ?? 0;

  function addToCart() {
    const falta = faltaMinimo(selected, enCarrito + qty);
    if (falta) {
      setAviso(`${falta} Aumenta la cantidad para agregarla al carrito.`);
      return;
    }
    setAviso(null);
    // Se guarda con el tipo de canasta elegido; el header anima el contador.
    carrito.agregar(product.slug, selected.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  const delta = selected.precio - ownBasket.precio;
  const unitPrice = selected.precio;
  const savings = delta === 0 && product.oldPrice ? product.oldPrice - product.price : 0;
  // Cada producto cuenta por sus unidades (si no se sabe, 1).
  const unidadesDe = (name: string) => product.itemFotos?.[name]?.cantidad ?? 1;
  const totalUnidades = product.items.reduce((s, item) => s + unidadesDe(item), 0);
  const imageFor = (name: string) => product.visualItems.find((item) => item.name === name);

  return (
    <>
      <div className="detailMedia">
        <div className="detailVisual">
          {product.badge && <span className="badges">{separarInsignias(product.badge).map((b) => <span className="badge" key={b}>{b}</span>)}</span>}
          <ViewTransition name={`basket-${product.slug}`} share="basketMorph" default="none">
            <div className="detailBasket">
              <ProductComposition baseImage={selected.image} envaseId={selected.id} product={product} variant="detail" />
            </div>
          </ViewTransition>
          <span className="detailHint">Pasa el cursor sobre cada producto</span>
        </div>
        {selected.mostrarCondicion && selected.condicion && <p className="detailCondicion">{selected.condicion}</p>}
        {product.fullDescription && <p className="detailDescripcion">{product.fullDescription}</p>}
      </div>

      <div className="detailInfo">
        <span className="eyebrow" style={{ "--i": 0 } as React.CSSProperties}>{product.category}</span>
        <h1><SplitWords text={product.name} immediate /></h1>
        <p className="detailLead" style={{ "--i": 2 } as React.CSSProperties}>{product.description}</p>

        <div className="detailPrice" style={{ "--i": 3 } as React.CSSProperties}>
          <strong><AnimatedPrice value={unitPrice} /></strong>
          {savings > 0 && <><del>{formatPrice(product.oldPrice!)}</del><span className="saveTag">Ahorras {formatPrice(savings)}</span></>}
          <small className="igvNota">Incluido IGV</small>
        </div>
        {delta !== 0 && <p className="basketNote">{delta > 0 ? `Incluye ${formatPrice(delta)} por la ${selected.label.toLowerCase()}.` : `Descuenta ${formatPrice(Math.abs(delta))} por la ${selected.label.toLowerCase()}.`}</p>}

        <div className="includesPanel" style={{ "--i": 4 } as React.CSSProperties}>
          <h3>Incluye <small>{totalUnidades} {totalUnidades === 1 ? "producto" : "productos"}</small></h3>
          <div className="includesCabecera" aria-hidden="true"><span>Producto</span><span>Cantidad</span></div>
          <ul>
            {product.items.map((item, j) => {
              // La foto sale del artículo del contenido; si no la trae, de la imagen de la canasta.
              const visual = product.itemFotos?.[item] ?? imageFor(item);
              return (
                <li key={item} style={{ "--j": j } as React.CSSProperties}>
                  <span className="includesThumb">
                    {visual?.image ? <img src={visual.image} alt="" /> : <span aria-hidden="true">{visual?.emoji ?? "✦"}</span>}
                  </span>
                  <span className="includesNombre">{item}</span>
                  <span className="includesCantidad">{unidadesDe(item)} {unidadesDe(item) === 1 ? "unidad" : "unidades"}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <fieldset className="basketPicker" style={{ "--i": 5 } as React.CSSProperties}>
          <legend><span className="stepNum">1</span> Elige el envase</legend>
          <div className="basketGrid">
            {envases.map((type) => (
              <label className="basketOption" key={type.id}>
                <input checked={type.id === selected.id} name="tipoCanasta" onChange={() => { setSelected(type); setAviso(null); }} type="radio" value={type.id} />
                <span className="basketCheck" aria-hidden="true">✓</span>
                <img alt="" className="basketThumb" src={type.image} />
                <span className="basketLabel">{type.label}</span>
                <small className="basketPrice">{deltaLabel(type.precio - ownBasket.precio)}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="buyBox" style={{ "--i": 6 } as React.CSSProperties}>
          <div className="buyRow">
            <div>
              <span className="buyLabel"><span className="stepNum">2</span> Cantidad</span>
              <div className="stepper">
                <button type="button" aria-label="Quitar una" disabled={qty <= 1} onClick={() => { setQty((q) => Math.max(1, q - 1)); setAviso(null); }}>−</button>
                <input aria-label="Cantidad" inputMode="numeric" value={qty} onChange={(e) => { setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)); setAviso(null); }} />
                <button type="button" aria-label="Agregar una" onClick={() => { setQty((q) => q + 1); setAviso(null); }}>+</button>
              </div>
            </div>
            <div className="buyTotal">
              <span className="buyLabel">Total</span>
              <strong><AnimatedPrice value={unitPrice * qty} /></strong>
              <small className="igvNota">Incluido IGV</small>
            </div>
          </div>
          <button type="button" className="btn btnPrimary full addBtn" data-added={added || undefined} onClick={addToCart}>
            <b className="addLabel">Agregar al carrito</b>
            <b className="addDone" aria-hidden={!added}>✓ Agregada al carrito</b>
          </button>
          {aviso && <p className="detailAviso" role="alert">{aviso}</p>}
          <p className="addFollow" data-show={added || undefined}>
            <Link href="/carrito">Ver carrito →</Link>
          </p>
          <p className="srOnly" aria-live="polite">{added ? `${qty} ${qty === 1 ? "canasta agregada" : "canastas agregadas"} al carrito` : ""}</p>
          {qty >= 10 && <p className="volumeHint">¿Más de 10? <Link href="/cotizacion">Pide precio por volumen →</Link></p>}
        </div>

      </div>
    </>
  );
}
