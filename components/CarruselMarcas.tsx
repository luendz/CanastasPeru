"use client";

import { useEffect, useRef } from "react";

/**
 * Fila de marcas que avanza sola en bucle (sin logo se muestra el nombre).
 * Se detiene al pasar el cursor y las flechas la mueven a mano.
 */
export default function CarruselMarcas({ marcas }: { marcas: { nombre: string; imagen: string }[] }) {
  const fila = useRef<HTMLUListElement>(null);
  const pausa = useRef(false);

  useEffect(() => {
    const el = fila.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let ultimo = performance.now();
    // Posición con decimales: el navegador redondea scrollLeft y perdería los avances pequeños.
    let pos = el.scrollLeft;
    const paso = (ahora: number) => {
      const dt = Math.min(64, ahora - ultimo);
      ultimo = ahora;
      if (pausa.current) {
        pos = el.scrollLeft;
      } else {
        pos += dt * 0.04; // ~40 px por segundo
        // La lista está duplicada: al llegar a la mitad se vuelve al inicio sin que se note.
        const mitad = el.scrollWidth / 2;
        if (pos >= mitad) pos -= mitad;
        el.scrollLeft = pos;
      }
      frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [marcas.length]);

  const mover = (dir: number) => {
    const el = fila.current;
    if (!el) return;
    pausa.current = true;
    const mitad = el.scrollWidth / 2;
    if (dir < 0 && el.scrollLeft < el.clientWidth) el.scrollLeft += mitad;
    el.scrollBy({ left: dir * el.clientWidth * 0.5, behavior: "smooth" });
    window.setTimeout(() => (pausa.current = false), 1200);
  };

  const lista = [...marcas, ...marcas];
  return (
    <div className="marcasCarrusel" onMouseEnter={() => (pausa.current = true)} onMouseLeave={() => (pausa.current = false)}>
      <button type="button" className="marcasFlecha" aria-label="Marcas anteriores" onClick={() => mover(-1)}>‹</button>
      <ul className="hmMarcas" ref={fila}>
        {lista.map((m, n) => (
          <li key={`${m.nombre}-${n}`} aria-hidden={n >= marcas.length || undefined}>
            {m.imagen ? <img src={m.imagen} alt={n >= marcas.length ? "" : m.nombre} /> : <span>{m.nombre}</span>}
          </li>
        ))}
      </ul>
      <button type="button" className="marcasFlecha" aria-label="Más marcas" onClick={() => mover(1)}>›</button>
    </div>
  );
}
