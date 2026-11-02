"use client";

import { useState, useTransition } from "react";
import { eliminarProducto } from "./actions";

/** Elimina un producto de la lista tras confirmar. Si está en uso, explica por qué no se puede. */
export default function EliminarProducto({ id, nombre }: { id: string; nombre: string }) {
  const [error, setError] = useState("");
  const [eliminando, iniciar] = useTransition();

  function eliminar() {
    if (!window.confirm(`¿Eliminar ${nombre}? Esta acción no se puede deshacer.`)) return;
    setError("");
    iniciar(async () => {
      try {
        const r = await eliminarProducto(id);
        if (r.error) setError(r.error);
      } catch {
        setError("No se pudo eliminar. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <>
      <button type="button" className="admLinkDanger" disabled={eliminando} aria-label={`Eliminar ${nombre}`} onClick={eliminar}>
        {eliminando ? "Eliminando…" : "Eliminar"}
      </button>
      {error && <small className="admError admBlock admEliminarError" role="alert">{error}</small>}
    </>
  );
}
