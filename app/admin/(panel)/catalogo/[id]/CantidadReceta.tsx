"use client";

import { useState, useTransition } from "react";
import { guardarRecetaItem } from "../../costeo/actions";

type Props = { productoId: string; insumoId: string; cantidad: number; nombre: string };

/** Cantidad de un producto en la receta. Se guarda al salir del campo o con Enter. */
export default function CantidadReceta({ productoId, insumoId, cantidad, nombre }: Props) {
  const [valor, setValor] = useState(String(cantidad));
  const [error, setError] = useState(false);
  const [guardando, iniciar] = useTransition();

  function aplicar() {
    const n = Number(valor);
    if (!(n > 0) || n === cantidad) {
      setValor(String(cantidad));
      return;
    }
    const fd = new FormData();
    fd.set("producto_id", productoId);
    fd.set("insumo_id", insumoId);
    fd.set("cantidad", String(n));
    setError(false);
    iniciar(async () => {
      try {
        await guardarRecetaItem(fd);
      } catch {
        setError(true);
        setValor(String(cantidad));
      }
    });
  }

  return (
    <>
      <input
        className="admInput admInputSm"
        type="number"
        min="0.01"
        step="0.01"
        value={valor}
        disabled={guardando}
        aria-label={`Cantidad de ${nombre}`}
        onChange={(e) => setValor(e.target.value)}
        onBlur={aplicar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
      {error && <small className="admError admBlock" role="alert">No se guardó</small>}
    </>
  );
}
