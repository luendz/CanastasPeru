"use client";

import { useState } from "react";

/** Copiar todos los correos o bajarlos en CSV. */
export default function ListaCorreos({ correos }: { correos: string[] }) {
  const [copiado, setCopiado] = useState(false);
  if (!correos.length) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(correos.join(", "));
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Sin permiso de portapapeles: queda el CSV. */
    }
  }

  function csv() {
    const blob = new Blob([`correo\n${correos.join("\n")}\n`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "suscriptores-mka.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="admFormFootRow">
      <button type="button" className="admBtn" onClick={copiar}>{copiado ? "Copiados ✓" : "Copiar correos"}</button>
      <button type="button" className="admBtn admBtnPrimary" onClick={csv}>Descargar CSV</button>
    </div>
  );
}
