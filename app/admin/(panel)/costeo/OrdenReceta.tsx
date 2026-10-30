"use client";

import { useTransition } from "react";
import CampoOrden from "../CampoOrden";
import { moverRecetaItem } from "./actions";

type Props = { productoId: string; insumoId: string; posicion: number; total: number; nombre: string };

/** Posición de un insumo en la receta; al cambiarla se guarda y se reordena la lista. */
export default function OrdenReceta({ productoId, insumoId, posicion, total, nombre }: Props) {
  const [, iniciar] = useTransition();
  return (
    <CampoOrden
      key={posicion}
      posicion={posicion}
      total={total}
      etiqueta={`Orden de ${nombre}`}
      onCambiar={(n) => iniciar(() => moverRecetaItem(productoId, insumoId, n))}
    />
  );
}
