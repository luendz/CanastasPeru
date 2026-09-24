"use client";

import Link from "next/link";
import { useRef } from "react";
import ProductComposition from "@/components/ProductComposition";
import { formatPrice, type Product } from "@/lib/mock-data";

/** Arte del hero: la canasta se arma al cargar y todo se inclina siguiendo el puntero. */
export default function HeroArt({ product, fromPrice }: { product: Product; fromPrice: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    el.style.setProperty("--px", `${(x * 18).toFixed(1)}px`);
    el.style.setProperty("--py", `${(y * 14).toFixed(1)}px`);
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    ["--rx", "--ry"].forEach((v) => el.style.setProperty(v, "0deg"));
    ["--px", "--py"].forEach((v) => el.style.setProperty(v, "0px"));
  }

  return (
    <div className="heroArt" ref={ref} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div className="heroArch" aria-hidden="true" />
      <Link className="heroStage" href={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`}>
        <ProductComposition product={product} assemble />
      </Link>
      <div className="heroStamp" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <defs><path id="stampCircle" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
          <text><textPath href="#stampCircle">hecho a mano · navidad 2026 · </textPath></text>
        </svg>
        <span>✦</span>
      </div>
      <div className="heroTag">
        <small>Desde</small>
        <strong>{formatPrice(fromPrice)}</strong>
      </div>
    </div>
  );
}
