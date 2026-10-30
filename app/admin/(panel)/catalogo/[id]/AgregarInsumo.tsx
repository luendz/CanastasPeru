"use client";

import { useMemo, useState, useTransition } from "react";
import { soles } from "@/lib/admin/format";
import { guardarRecetaItem } from "../../costeo/actions";

type Producto = { id: string; nombre: string; costo: number | null };

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Buscador para agregar un producto a la receta: se escribe y se selecciona. */
export default function AgregarInsumo({ productoId, productos }: { productoId: string; productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [guardando, iniciar] = useTransition();

  // Búsqueda por cualquier parte del nombre (sin tildes ni mayúsculas, varias palabras).
  const resultados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    if (!palabras.length) return [];
    return productos.filter((p) => palabras.every((w) => normalizar(p.nombre).includes(w))).slice(0, 8);
  }, [busqueda, productos]);

  function agregar(id: string) {
    const fd = new FormData();
    fd.set("producto_id", productoId);
    fd.set("insumo_id", id);
    fd.set("cantidad", "1");
    setBusqueda("");
    setError("");
    iniciar(async () => {
      try {
        await guardarRecetaItem(fd);
      } catch {
        setError("No se pudo agregar el producto. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <div className="admBuscador">
      <label>Agregar insumo
        <input
          className="admInput"
          type="search"
          placeholder="Escribe para buscar (ej. panetón, leche, arroz…)"
          value={busqueda}
          disabled={guardando}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (resultados[0]) agregar(resultados[0].id);
            }
          }}
        />
      </label>
      {busqueda.trim() && (
        <ul className="admBuscadorLista" role="listbox">
          {resultados.length ? resultados.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => agregar(p.id)}>
                <span>{p.nombre}</span>
                <small>{p.costo != null ? soles(p.costo) : "sin costo"}</small>
              </button>
            </li>
          )) : <li className="admMuted admSmall">Sin resultados.</li>}
        </ul>
      )}
      {error && <p className="admError" role="alert">{error}</p>}
    </div>
  );
}
