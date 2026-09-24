"use client";

import Link from "next/link";
import { useRef } from "react";
import ProductComposition from "@/components/ProductComposition";
import { formatPrice, type Product } from "@/lib/mock-data";

/** Canasta del hero: se arma al cargar y se inclina siguiendo el puntero. */
export default function HeroBasket({ product, fromPrice }: { product: Product; fromPrice: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(x * 100 + 50).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100 + 50).toFixed(1)}%`);
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div className="heroStageV2" ref={ref} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <svg className="heroRing" viewBox="0 0 400 400" aria-hidden="true">
        <path d="M200 22c96 2 176 78 174 178-2 102-84 178-180 176C98 374 24 296 26 198 28 104 106 24 206 26" />
      </svg>
      <div className="heroTilt">
        <Link className="heroBasketLink" href={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`}>
          <ProductComposition product={product} assemble />
        </Link>
      </div>
      <p className="heroNote">
        <span>desde</span>
        <strong>{formatPrice(fromPrice)}</strong>
        <svg viewBox="0 0 90 60" aria-hidden="true"><path d="M4 8c22 2 52 10 66 38m0 0-2-14m2 14-13-5" /></svg>
      </p>
    </div>
  );
}
