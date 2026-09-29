"use client";

import { useEffect, useState } from "react";

/** Fondo del banner: una o varias fotos que pasan solas, con puntos para elegir. */
export default function HeroBanner({ imagenes, children }: { imagenes: string[]; children: React.ReactNode }) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (imagenes.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setActual((a) => (a + 1) % imagenes.length), 6000);
    return () => window.clearInterval(t);
  }, [imagenes.length]);

  return (
    <section className="hbBanner" data-con-imagen={imagenes.length > 0 || undefined}>
      {imagenes.map((src, n) => (
        <img key={src + n} className="hbFondo" src={src} alt="" data-activa={n === actual || undefined} fetchPriority={n === 0 ? "high" : undefined} />
      ))}
      <div className="hbVelo" aria-hidden="true" />
      {children}
      {imagenes.length > 1 && (
        <div className="hbPuntos">
          {imagenes.map((_, n) => (
            <button key={n} type="button" aria-label={`Imagen ${n + 1} de ${imagenes.length}`} aria-current={n === actual || undefined} onClick={() => setActual(n)} />
          ))}
        </div>
      )}
    </section>
  );
}
