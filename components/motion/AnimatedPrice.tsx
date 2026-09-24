"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/mock-data";

/** Precio que cuenta hasta el nuevo valor cuando cambia, en lugar de saltar. */
export default function AnimatedPrice({ value, duration = 600, prefix = "" }: { value: number; duration?: number; prefix?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    // Sin animación si el usuario la reduce o la pestaña está oculta (ahí se pausa requestAnimationFrame).
    if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = start + (value - start) * eased;
      from.current = next;
      setShown(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="animatedPrice">{prefix}{formatPrice(Math.round(shown * 100) / 100)}</span>;
}
