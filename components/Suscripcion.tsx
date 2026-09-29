"use client";

import { useActionState } from "react";
import { suscribir, type SuscripcionState } from "@/app/(sitio)/suscribir/actions";

export default function Suscripcion({ titulo }: { titulo: string }) {
  const [estado, accion, enviando] = useActionState<SuscripcionState, FormData>(suscribir, {});
  return (
    <div className="footerSuscribir">
      <h4>{titulo}</h4>
      {estado.ok ? (
        <p className="footerSuscrito" role="status">¡Listo! Te avisaremos de las novedades.</p>
      ) : (
        <form action={accion} className="footerSuscribirForm">
          <input className="input" name="email" type="email" required maxLength={160} placeholder="Tu correo electrónico" aria-label="Tu correo electrónico" />
          <button type="submit" aria-label="Suscribirme" disabled={enviando}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </form>
      )}
      {estado.error && <p className="footerSuscribirError" role="alert">{estado.error}</p>}
    </div>
  );
}
