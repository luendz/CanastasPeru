"use client";

import { useId, useRef, useState } from "react";

export type OpcionBuscable = { valor: string; texto?: string };

type Props = {
  name: string;
  opciones: OpcionBuscable[];
  /** Valor elegido (controlado) o inicial. Solo cuenta si está en las opciones. */
  valor?: string;
  valorInicial?: string;
  onValor?: (valor: string) => void;
  placeholder?: string;
  /** Obligatorio: el formulario no se envía sin elegir una opción. */
  requerido?: boolean;
};

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Desplegable en el que se escribe para buscar, pero solo se puede elegir una
 * de las opciones (o dejarlo vacío). Envía el valor en un input oculto.
 */
export default function SelectorBuscable({ name, opciones, valor, valorInicial = "", onValor, placeholder = "Escribe para buscar", requerido }: Props) {
  const [propio, setPropio] = useState(valorInicial);
  const elegido = valor ?? propio;
  const [texto, setTexto] = useState<string | null>(null);
  const [activo, setActivo] = useState(0);
  const lista = useId();
  const entrada = useRef<HTMLInputElement>(null);

  const abierto = texto !== null;
  const filtro = normal(texto ?? "");
  const visibles = opciones.filter((o) => normal(o.valor).includes(filtro));

  const elegir = (v: string) => {
    if (valor === undefined) setPropio(v);
    entrada.current?.setCustomValidity("");
    onValor?.(v);
    setTexto(null);
  };

  return (
    <div className="admBuscador">
      <input type="hidden" name={name} value={elegido} />
      <input
        ref={entrada}
        className="admInput"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={lista}
        autoComplete="off"
        required={requerido}
        onInvalid={(e) => e.currentTarget.setCustomValidity("Elige una opción de la lista.")}
        onInput={(e) => e.currentTarget.setCustomValidity("")}
        placeholder={placeholder}
        value={texto ?? elegido}
        onFocus={(e) => { setTexto(""); setActivo(0); e.currentTarget.placeholder = elegido || placeholder; }}
        onChange={(e) => { setTexto(e.target.value); setActivo(0); }}
        onBlur={(e) => { e.currentTarget.placeholder = placeholder; setTexto(null); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActivo((a) => Math.min(a + 1, visibles.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && abierto) { e.preventDefault(); if (visibles[activo]) elegir(visibles[activo].valor); }
          else if (e.key === "Escape") setTexto(null);
        }}
      />
      {elegido && !abierto && (
        <button type="button" className="admBuscadorQuitar" aria-label="Quitar" onClick={() => elegir("")}>×</button>
      )}
      {abierto && (
        <ul id={lista} role="listbox" className="admBuscadorLista">
          {visibles.length === 0 ? (
            <li className="admBuscadorVacio">Sin resultados</li>
          ) : (
            visibles.map((o, i) => (
              <li
                key={o.valor}
                role="option"
                aria-selected={o.valor === elegido}
                data-activo={i === activo || undefined}
                onMouseDown={(e) => { e.preventDefault(); elegir(o.valor); }}
                onMouseEnter={() => setActivo(i)}
              >
                <span>{o.valor}</span>
                {o.texto && <small>{o.texto}</small>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
