"use client";

import { useState } from "react";

type Props = {
  posicion: number;
  total: number;
  etiqueta: string;
  onCambiar: (posicion: number) => void;
};

/** Número de orden de una fila. El cambio se aplica al salir del campo o con Enter. */
export default function CampoOrden({ posicion, total, etiqueta, onCambiar }: Props) {
  const [valor, setValor] = useState(String(posicion));

  function aplicar() {
    const n = Math.min(Math.round(Number(valor)), total);
    if (n >= 1 && n !== posicion) onCambiar(n);
    // Si la fila no se mueve (valor vacío o repetido), el campo vuelve a su posición.
    else setValor(String(posicion));
  }

  return (
    <input
      className="admInput admInputOrden"
      type="number"
      min={1}
      max={total}
      value={valor}
      aria-label={etiqueta}
      onChange={(e) => setValor(e.target.value)}
      onBlur={aplicar}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
