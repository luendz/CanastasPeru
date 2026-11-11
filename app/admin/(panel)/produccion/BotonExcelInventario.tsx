"use client";

import { useState } from "react";
import { descargarInventario, type DatosInventario } from "./excel";

/** Descarga en Excel lo mismo que se ve en Producción e inventario. */
export default function BotonExcelInventario({ datos }: { datos: DatosInventario }) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    setGenerando(true);
    setError("");
    try {
      await descargarInventario(datos);
    } catch {
      setError("No se pudo generar el Excel. Inténtalo de nuevo.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <button className="admBtn admBtnPrimary" type="button" onClick={descargar} disabled={generando}>
        {generando ? "Generando…" : "Descargar Excel"}
      </button>
      {error && <p className="admError" role="alert">{error}</p>}
    </div>
  );
}
