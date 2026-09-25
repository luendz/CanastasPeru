"use client";

import { useState } from "react";
import { pdfOrden } from "@/lib/admin/pdf";
import { datosPdfOrden } from "./actions";

/** Descarga el PDF de una orden. En modo compacto es solo un ícono (lista de órdenes). */
export default function BotonPdfOrden({ id, numero, compacto }: { id: string; numero: string; compacto?: boolean }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    setCargando(true);
    setError("");
    try {
      const { doc, nombre } = await pdfOrden(await datosPdfOrden(id));
      doc.save(nombre);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el PDF.");
    } finally {
      setCargando(false);
    }
  }

  if (compacto) {
    return (
      <button type="button" className="admIconBtn" onClick={descargar} disabled={cargando} title={error || `Descargar PDF de ${numero}`} aria-label={`Descargar PDF de ${numero}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" /></svg>
        <span>PDF</span>
      </button>
    );
  }
  return (
    <>
      <button type="button" className="admBtn admBtnBlock" onClick={descargar} disabled={cargando}>
        {cargando ? "Generando PDF…" : "Descargar PDF del pedido"}
      </button>
      {error && <p className="admError">{error}</p>}
    </>
  );
}
