"use client";

import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/mock-data";

/** Estante horizontal: se arrastra con el mouse, se desliza en táctil y tiene flechas. */
export default function Shelf({ products }: { products: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 1);
      setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".shelfItem");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 28), behavior: "smooth" });
  };

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = track.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5 && !d.moved) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "";
    }
    if (d.moved) el.scrollLeft = d.left - dx;
  }

  function endDrag() {
    const el = track.current;
    if (el) delete el.dataset.dragging;
    // Deja pasar un tick para que el click posterior al arrastre se cancele.
    setTimeout(() => { drag.current = null; }, 0);
  }

  return (
    <div className="shelf">
      <div
        className="shelfTrack"
        ref={track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } }}
      >
        {products.map((p, i) => (
          <div className="shelfItem" key={p.slug} style={{ "--i": i } as React.CSSProperties}>
            <span className="shelfIndex">{String(i + 1).padStart(2, "0")}</span>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className="shelfControls">
        <div className="shelfProgress" aria-hidden="true"><span style={{ transform: `scaleX(${0.15 + progress * 0.85})` }} /></div>
        <button type="button" className="roundBtn" onClick={() => step(-1)} disabled={edges.start} aria-label="Canastas anteriores">←</button>
        <button type="button" className="roundBtn" onClick={() => step(1)} disabled={edges.end} aria-label="Más canastas">→</button>
      </div>
    </div>
  );
}
