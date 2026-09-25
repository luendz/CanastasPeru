"use client";

import { useActionState, useState } from "react";
import SelectorImagen from "../medios/SelectorImagen";
import { guardarContenido, restaurarContenido, type EstadoContenido } from "./actions";

type Columna = { clave: string; etiqueta: string; tipo?: "texto" | "numero"; largo?: boolean };

export type Campo =
  | { tipo: "texto"; clave: string; etiqueta: string; ayuda?: string; largo?: boolean }
  | { tipo: "imagen"; clave: string; etiqueta: string; ayuda?: string }
  | { tipo: "canasta"; clave: string; etiqueta: string; ayuda?: string }
  | { tipo: "lineas"; clave: string; etiqueta: string; ayuda?: string }
  | { tipo: "numeros"; clave: string; etiqueta: string; ayuda?: string }
  | { tipo: "filas"; clave: string; etiqueta: string; ayuda?: string; columnas: Columna[] };

type Fila = Record<string, string | number>;

type Props = {
  seccion: string;
  campos: Campo[];
  valor: Record<string, unknown>;
  canastas: { slug: string; nombre: string }[];
  editado: boolean;
};

/** Pasa el estado del formulario a la forma que se guarda (listas limpias y números). */
function serializar(campos: Campo[], estado: Record<string, unknown>) {
  const res: Record<string, unknown> = {};
  for (const c of campos) {
    const v = estado[c.clave];
    if (c.tipo === "lineas") res[c.clave] = (v as string[]).map((s) => s.trim()).filter(Boolean);
    else if (c.tipo === "numeros") res[c.clave] = String(v).split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    else res[c.clave] = v;
  }
  return JSON.stringify(res);
}

export default function EditorSeccion({ seccion, campos, valor, canastas, editado }: Props) {
  const [estado, setEstado] = useState<Record<string, unknown>>(() => {
    const e: Record<string, unknown> = { ...valor };
    for (const c of campos) if (c.tipo === "numeros") e[c.clave] = (valor[c.clave] as number[]).join(", ");
    return e;
  });
  const [guardado, guardar, guardando] = useActionState<EstadoContenido, FormData>(guardarContenido, {});
  const [restaurado, restaurar, restaurando] = useActionState<EstadoContenido, FormData>(restaurarContenido, {});
  const [cambios, setCambios] = useState(false);

  const set = (clave: string, v: unknown) => {
    setEstado((e) => ({ ...e, [clave]: v }));
    setCambios(true);
  };

  const ultimo = (guardado.en ?? 0) > (restaurado.en ?? 0) ? guardado : restaurado;

  return (
    <div className="admForm">
      <form action={guardar} onSubmit={() => setCambios(false)} className="admFormGrid">
        <input type="hidden" name="seccion" value={seccion} />
        <input type="hidden" name="valor" value={serializar(campos, estado)} />

        {campos.map((c) => {
          const ayuda = c.ayuda && <small className="admMuted">{c.ayuda}</small>;
          switch (c.tipo) {
            case "texto":
              return (
                <label key={c.clave} className={c.largo ? "admSpan2" : undefined}>{c.etiqueta}
                  {c.largo ? (
                    <textarea className="admInput" rows={3} value={String(estado[c.clave] ?? "")} onChange={(e) => set(c.clave, e.target.value)} />
                  ) : (
                    <input className="admInput" value={String(estado[c.clave] ?? "")} onChange={(e) => set(c.clave, e.target.value)} />
                  )}
                  {ayuda}
                </label>
              );
            case "imagen":
              return (
                <div key={c.clave} className="admField">
                  <SelectorImagen name={`_${c.clave}`} label={c.etiqueta} defaultValue={String(estado[c.clave] ?? "")} onChange={(url) => set(c.clave, url)} />
                  {ayuda}
                </div>
              );
            case "canasta":
              return (
                <label key={c.clave}>{c.etiqueta}
                  <select className="admInput" value={String(estado[c.clave] ?? "")} onChange={(e) => set(c.clave, e.target.value)}>
                    {canastas.map((p) => <option key={p.slug} value={p.slug}>{p.nombre}</option>)}
                  </select>
                  {ayuda}
                </label>
              );
            case "lineas":
              return (
                <label key={c.clave} className="admSpan2">{c.etiqueta}
                  <textarea className="admInput" rows={Math.max(3, (estado[c.clave] as string[]).length + 1)}
                    value={(estado[c.clave] as string[]).join("\n")} onChange={(e) => set(c.clave, e.target.value.split("\n"))} />
                  <small className="admMuted">Uno por línea.{c.ayuda ? ` ${c.ayuda}` : ""}</small>
                </label>
              );
            case "numeros":
              return (
                <label key={c.clave}>{c.etiqueta}
                  <input className="admInput" inputMode="numeric" value={String(estado[c.clave] ?? "")} onChange={(e) => set(c.clave, e.target.value)} />
                  <small className="admMuted">Separados por comas.{c.ayuda ? ` ${c.ayuda}` : ""}</small>
                </label>
              );
            case "filas": {
              const filas = estado[c.clave] as Fila[];
              const vacia = Object.fromEntries(c.columnas.map((col) => [col.clave, col.tipo === "numero" ? 0 : ""]));
              const cambiar = (i: number, k: string, v: string | number) => set(c.clave, filas.map((f, j) => (j === i ? { ...f, [k]: v } : f)));
              const mover = (i: number, d: number) => {
                const n = [...filas];
                [n[i], n[i + d]] = [n[i + d], n[i]];
                set(c.clave, n);
              };
              return (
                <fieldset key={c.clave} className="admSpan2 admFilas">
                  <legend>{c.etiqueta}</legend>
                  {ayuda}
                  {filas.map((f, i) => (
                    <div key={i} className="admFila" style={{ gridTemplateColumns: `${c.columnas.map((col) => (col.largo ? "2fr" : col.tipo === "numero" ? "110px" : "1fr")).join(" ")} auto` }}>
                      {c.columnas.map((col) => (
                        <label key={col.clave}><span className="admSmall admMuted">{col.etiqueta}</span>
                          <input className="admInput" type={col.tipo === "numero" ? "number" : "text"} min={0} step="any"
                            value={f[col.clave] ?? ""} onChange={(e) => cambiar(i, col.clave, col.tipo === "numero" ? Number(e.target.value) : e.target.value)} />
                        </label>
                      ))}
                      <div className="admFilaAcc">
                        <button type="button" className="admLinkMuted" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
                        <button type="button" className="admLinkMuted" disabled={i === filas.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">↓</button>
                        <button type="button" className="admLinkDanger" onClick={() => set(c.clave, filas.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="admLinkMuted" onClick={() => set(c.clave, [...filas, vacia])}>+ Agregar</button>
                </fieldset>
              );
            }
          }
        })}

        <div className="admSpan2 admFormFoot">
          <button className="admBtn admBtnPrimary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar y publicar"}</button>
          {cambios && <span className="admMuted admSmall">Cambios sin guardar</span>}
          {!cambios && ultimo.ok && <span className="admSuccess" role="status">Publicado en la web.</span>}
          {ultimo.error && <span className="admError" role="alert">{ultimo.error}</span>}
        </div>
      </form>

      {editado && (
        <form action={restaurar} onSubmit={(e) => { if (!window.confirm("¿Volver a los textos originales de esta sección?")) e.preventDefault(); }} className="admRestaurar">
          <input type="hidden" name="seccion" value={seccion} />
          <button className="admLinkMuted" disabled={restaurando}>Restaurar textos originales</button>
        </form>
      )}
    </div>
  );
}
