"use client";

import { useActionState, useEffect, useRef, useState } from "react";

export type CampoEditable = {
  clave: string;
  etiqueta: string;
  tipo?: "texto" | "email" | "tel" | "fecha" | "numero" | "area" | "select";
  opciones?: { valor: string; texto: string }[];
  ancho?: boolean;
  max?: number;
  ayuda?: string;
};

type Estado = { ok?: boolean; error?: string; en?: number };

type Props = {
  titulo: string;
  id: string;
  campos: CampoEditable[];
  valores: Record<string, string | number | null>;
  accion: (prev: Estado, fd: FormData) => Promise<Estado>;
  etiquetaBoton?: string;
};

/** Botón pequeño "Editar" que abre una ventana para corregir datos. */
export default function EditarDatos({ titulo, id, campos, valores, accion, etiquetaBoton = "Editar" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [estado, enviar, guardando] = useActionState<Estado, FormData>(accion, {});
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  useEffect(() => {
    if (estado.ok) setAbierto(false);
  }, [estado.en, estado.ok]);

  return (
    <>
      <button type="button" className="admIconBtn" onClick={() => setAbierto(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></svg>
        <span>{etiquetaBoton}</span>
      </button>
      {estado.ok && !abierto && <span className="admSuccess admAvisoCorto" role="status">Datos actualizados.</span>}

      <dialog ref={dialogo} className="admDialog admDialogMedio" onClose={() => setAbierto(false)}>
        {abierto && (
          <form action={enviar} className="admDialogBody">
            <div className="admCardHead">
              <h2>{titulo}</h2>
              <button type="button" className="admLinkMuted" onClick={() => setAbierto(false)}>Cerrar ✕</button>
            </div>
            <input type="hidden" name="id" value={id} />
            <div className="admForm admFormGrid">
              {campos.map((c) => {
                const v = valores[c.clave] ?? "";
                const comun = { className: "admInput", name: c.clave, defaultValue: String(v), maxLength: c.max };
                return (
                  <label key={c.clave} className={c.ancho ? "admSpan2" : undefined}>{c.etiqueta}
                    {c.tipo === "area" ? (
                      <textarea {...comun} rows={3} />
                    ) : c.tipo === "select" ? (
                      <select className="admInput" name={c.clave} defaultValue={String(v)}>
                        {c.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
                      </select>
                    ) : (
                      <input
                        {...comun}
                        type={c.tipo === "email" ? "email" : c.tipo === "tel" ? "tel" : c.tipo === "fecha" ? "date" : c.tipo === "numero" ? "number" : "text"}
                        inputMode={c.tipo === "numero" ? "numeric" : undefined}
                      />
                    )}
                    {c.ayuda && <small className="admMuted">{c.ayuda}</small>}
                  </label>
                );
              })}
            </div>
            <div className="admFormFootRow">
              <button className="admBtn admBtnPrimary" type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
              <button type="button" className="admBtn" onClick={() => setAbierto(false)}>Cancelar</button>
              {estado.error && <span className="admError" role="alert">{estado.error}</span>}
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
