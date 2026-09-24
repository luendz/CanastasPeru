"use client";

import { useEffect, useRef, useState } from "react";
import ProductComposition from "@/components/ProductComposition";
import type { Product } from "@/lib/mock-data";

const steps = [
  { title: "Eliges la canasta", text: "Cesta, caja o ratán. Cada una cambia el precio y la presentación, y puedes cambiarla en el detalle." },
  { title: "La armamos a mano", text: "Panetón, champagne, conservas. Acomodamos cada producto para que llegue firme y se vea bien al abrirla." },
  { title: "Le ponemos tu tarjeta", text: "Escribes la dedicatoria en el checkout y la imprimimos en una tarjeta que va amarrada al lazo." },
  { title: "Llega a su puerta", text: "Eliges distrito, día y horario. Si es sorpresa, la recibe otra persona y tú te enteras por WhatsApp." },
];

/** Pasos con una canasta fija que cambia según el paso visible. */
export default function StoryBasket({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const empty = { ...product, visualItems: [] };

  return (
    <div className="story">
      <div className="storyStage" data-step={active} aria-hidden="true">
        <div className="storyPlate">
          {active === 0 ? (
            <ProductComposition key="empty" product={empty} />
          ) : (
            <ProductComposition key="full" product={product} assemble />
          )}
          <div className="storyTag"><span>Para Rosa,</span><span>¡feliz Navidad!</span></div>
          <div className="storyStamp">Entregado<br /><small>24 dic · 10:40</small></div>
        </div>
        <ol className="storyDots">
          {steps.map((s, i) => <li key={s.title} data-on={i === active || undefined} />)}
        </ol>
      </div>
      <ol className="storySteps">
        {steps.map((s, i) => (
          <li key={s.title} ref={(el) => { refs.current[i] = el; }} data-step={i} data-on={i === active || undefined}>
            <span className="storyNum">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
