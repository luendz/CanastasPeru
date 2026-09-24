"use client";

import { useEffect, useRef } from "react";

type RevealProps = {
  as?: "div" | "section" | "ul" | "ol" | "li" | "p" | "span" | "header" | "article";
  className?: string;
  /** Retraso en milisegundos antes de empezar. */
  delay?: number;
  /** Qué tanto del elemento debe verse para dispararse (0–1). */
  threshold?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/**
 * Marca el elemento con `data-inview` la primera vez que entra en pantalla.
 * El CSS decide qué animar: el propio elemento (`data-reveal`) y sus hijos
 * con `data-reveal-item`, escalonados con la variable `--i`.
 */
export default function Reveal({ as: Tag = "div", className, delay = 0, threshold = 0.2, children, style }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.inview = "";
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      data-reveal=""
      style={{ ...style, "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
