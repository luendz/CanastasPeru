"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cuenta desde 0 hasta el número que aparece en el texto (por ejemplo
 * "+1 200", "48 h" o "4.9 ★") cuando entra en pantalla, conservando
 * el prefijo, el sufijo y los decimales.
 */
export default function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const match = value.match(/^(\D*)([\d\s.,]*\d)(.*)$/);
  const prefix = match?.[1] ?? "";
  const rawNumber = match?.[2] ?? "";
  const suffix = match?.[3] ?? "";
  const decimals = rawNumber.includes(".") ? rawNumber.split(".")[1].length : 0;
  const target = Number(rawNumber.replace(/[\s,]/g, "")) || 0;
  const grouped = /\s/.test(rawNumber);

  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    let raf = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setShown(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!match) return <span>{value}</span>;
  const format = (n: number) => {
    const fixed = n.toFixed(decimals);
    return grouped ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : fixed;
  };

  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{prefix}{shown === null ? rawNumber : format(shown)}{suffix}</span>
    </span>
  );
}
