"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { soles } from "@/lib/admin/format";
import { guardarRecetaItem } from "../../costeo/actions";

type Producto = { id: string; nombre: string; costo: number | null };

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Lista desplegable para agregar un producto a la canasta: muestra todos y se puede escribir para buscar. */
export default function AgregarInsumo({ productoId, productos }: { productoId: string; productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [abierta, setAbierta] = useState(false);
  const [activo, setActivo] = useState(0);
  const [error, setError] = useState("");
  const [guardando, iniciar] = useTransition();
  const idLista = useId();

  // Búsqueda por cualquier parte del nombre (sin tildes ni mayúsculas, varias palabras). Sin texto, salen todos.
  const resultados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return productos.filter((p) => palabras.every((w) => normalizar(p.nombre).includes(w)));
  }, [busqueda, productos]);

  function agregar(id: string) {
    const fd = new FormData();
    fd.set("canasta_id", productoId);
    fd.set("articulo_id", id);
    fd.set("cantidad", "1");
    setBusqueda("");
    setAbierta(false);
    setError("");
    iniciar(async () => {
      try {
        await guardarRecetaItem(fd);
      } catch {
        setError("No se pudo agregar el producto. Inténtalo de nuevo.");
      }
    });
  }

  function mover(paso: number) {
    const siguiente = Math.min(Math.max(activo + paso, 0), Math.max(resultados.length - 1, 0));
    setAbierta(true);
    setActivo(siguiente);
    document.getElementById(`${idLista}-${siguiente}`)?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className="admBuscador">
      <label>Agregar producto a la canasta
        <span className="admCombo">
          <input
            className="admInput"
            type="text"
            role="combobox"
            aria-expanded={abierta}
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={abierta && resultados[activo] ? `${idLista}-${activo}` : undefined}
            placeholder={`Elige o escribe para buscar (${productos.length} productos)`}
            value={busqueda}
            disabled={guardando}
            onFocus={() => setAbierta(true)}
            onClick={() => setAbierta(true)}
            onBlur={() => setAbierta(false)}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setActivo(0);
              setAbierta(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); mover(1); }
              else if (e.key === "ArrowUp") { e.preventDefault(); mover(-1); }
              else if (e.key === "Escape") setAbierta(false);
              else if (e.key === "Enter") {
                e.preventDefault();
                if (abierta && resultados[activo]) agregar(resultados[activo].id);
              }
            }}
          />
          <span className="admComboFlecha" aria-hidden="true">▾</span>
        </span>
      </label>
      {abierta && (
        // mousedown evita que el campo pierda el foco antes de elegir.
        <ul className="admBuscadorLista" role="listbox" id={idLista} onMouseDown={(e) => e.preventDefault()}>
          {resultados.length ? resultados.map((p, i) => (
            <li key={p.id} id={`${idLista}-${i}`} role="option" aria-selected={i === activo}>
              <button type="button" tabIndex={-1} data-activo={i === activo || undefined} onMouseEnter={() => setActivo(i)} onClick={() => agregar(p.id)}>
                <span>{p.nombre}</span>
                <small>{p.costo != null ? soles(p.costo) : "sin costo"}</small>
              </button>
            </li>
          )) : <li className="admMuted admSmall">{productos.length ? "Sin resultados." : "Todos los productos ya están en la canasta."}</li>}
        </ul>
      )}
      {error && <p className="admError" role="alert">{error}</p>}
    </div>
  );
}
