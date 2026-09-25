"use client";

import { useState, useTransition } from "react";
import { ESTADOS_ORDEN, type EstadoOrden } from "@/lib/admin/types";
import { cambiarEstadoOrden } from "./actions";

/** Cambia el estado de una orden directo desde la lista. */
export default function EstadoRapido({ id, numero, estado }: { id: string; numero: string; estado: EstadoOrden }) {
  const [valor, setValor] = useState(estado);
  const [guardando, start] = useTransition();
  const [error, setError] = useState(false);

  return (
    <select
      className="admEstadoSelect"
      data-estado={valor}
      value={valor}
      disabled={guardando}
      aria-label={`Estado de ${numero}`}
      title={error ? "No se pudo guardar, intenta de nuevo" : undefined}
      onChange={(e) => {
        const nuevo = e.target.value as EstadoOrden;
        const anterior = valor;
        setValor(nuevo);
        setError(false);
        start(async () => {
          try {
            await cambiarEstadoOrden(id, nuevo);
          } catch {
            setValor(anterior);
            setError(true);
          }
        });
      }}
    >
      {ESTADOS_ORDEN.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
    </select>
  );
}
