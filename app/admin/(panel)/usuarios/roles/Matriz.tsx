"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { Seccion } from "@/lib/admin/permisos";
import { alternarSeccion, crearRol, eliminarRol, guardarAcciones, renombrarRol, type UsuarioState } from "../actions";
import { Mensaje, Modal } from "../Formularios";

export type RolMatriz = { id: string; nombre: string; es_administrador: boolean; usuarios: number | null; permisos: string[] };

/**
 * Tabla de accesos: filas = secciones, columnas = roles. La casilla da o
 * quita la entrada a la sección; «Permisos» abre las acciones permitidas.
 * El rol Administrador lo tiene todo y no se edita.
 */
export default function Matriz({ roles, secciones }: { roles: RolMatriz[]; secciones: Seccion[] }) {
  // Copia local para marcar al instante; el servidor confirma y revalida.
  const [permisos, setPermisos] = useState(() => Object.fromEntries(roles.map((r) => [r.id, new Set(r.permisos)])));
  useEffect(() => { setPermisos(Object.fromEntries(roles.map((r) => [r.id, new Set(r.permisos)]))); }, [roles]);
  const [error, setError] = useState("");
  const [, iniciar] = useTransition();
  const [modal, setModal] = useState<{ rol: RolMatriz; seccion: Seccion } | null>(null);
  const [renombrar, setRenombrar] = useState<RolMatriz | null>(null);

  const tiene = (rol: RolMatriz, clave: string) => rol.es_administrador || permisos[rol.id]?.has(clave);

  function alternar(rol: RolMatriz, seccion: Seccion, permitir: boolean) {
    setError("");
    setPermisos((prev) => {
      const s = new Set(prev[rol.id]);
      if (permitir) s.add(seccion.id);
      else for (const c of [...s]) if (c === seccion.id || c.startsWith(`${seccion.id}.`)) s.delete(c);
      return { ...prev, [rol.id]: s };
    });
    iniciar(async () => {
      try { await alternarSeccion(rol.id, seccion.id, permitir); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); }
    });
  }

  function borrarRol(rol: RolMatriz) {
    if (!window.confirm(`¿Eliminar el rol «${rol.nombre}»? Solo se puede si no tiene usuarios.`)) return;
    setError("");
    const fd = new FormData();
    fd.set("id", rol.id);
    iniciar(async () => {
      try { await eliminarRol(fd); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar."); }
    });
  }

  return (
    <>
      {error && <p className="admError" role="alert">{error}</p>}
      <div className="admCard admCardFlush admMatrizWrap">
        <table className="admTable admMatriz">
          <thead>
            <tr>
              <th>Sección</th>
              {roles.map((r) => (
                <th key={r.id}>
                  <span className="admMatrizRol">{r.nombre}</span>
                  <small className="admMuted admBlock">{r.usuarios == null ? "" : `${r.usuarios} usuario${r.usuarios === 1 ? "" : "s"}`}</small>
                  {!r.es_administrador && (
                    <span className="admMatrizRolAcciones">
                      <button type="button" className="admLinkMuted" onClick={() => setRenombrar(r)}>Renombrar</button>
                      <button type="button" className="admLinkDanger" onClick={() => borrarRol(r)}>Eliminar</button>
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {secciones.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.nombre}</strong></td>
                {roles.map((r) => {
                  const dentro = tiene(r, s.id);
                  const marcadas = s.acciones.filter((a) => tiene(r, `${s.id}.${a.id}`)).length;
                  return (
                    <td key={r.id} className="admMatrizCelda">
                      <label className="admMatrizCheck">
                        <input type="checkbox" checked={dentro} disabled={r.es_administrador} onChange={(e) => alternar(r, s, e.target.checked)} aria-label={`${r.nombre} entra a ${s.nombre}`} />
                      </label>
                      {dentro && s.acciones.length > 0 && (
                        r.es_administrador
                          ? <small className="admMuted">Todo</small>
                          : <button type="button" className="admLinkMuted admSmall" onClick={() => setModal({ rol: r, seccion: s })}>Permisos {marcadas}/{s.acciones.length}</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td><strong>Usuarios y roles</strong></td>
              {roles.map((r) => (
                <td key={r.id} className="admMatrizCelda">
                  <input type="checkbox" checked={r.es_administrador} disabled aria-label={`${r.nombre} gestiona usuarios`} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="admMuted admSmall">El rol Administrador siempre tiene todo y es el único que gestiona usuarios y roles. Los cambios se guardan al marcar; la persona los ve al recargar el panel.</p>

      <NuevoRol />

      {modal && (
        <ModalAcciones
          key={`${modal.rol.id}-${modal.seccion.id}`}
          rol={modal.rol}
          seccion={modal.seccion}
          marcadas={modal.seccion.acciones.filter((a) => tiene(modal.rol, `${modal.seccion.id}.${a.id}`)).map((a) => a.id)}
          onGuardado={(acciones) => setPermisos((prev) => {
            const s = new Set([...prev[modal.rol.id]].filter((c) => !c.startsWith(`${modal.seccion.id}.`)));
            s.add(modal.seccion.id);
            for (const a of acciones) s.add(`${modal.seccion.id}.${a}`);
            return { ...prev, [modal.rol.id]: s };
          })}
          onCerrar={() => setModal(null)}
        />
      )}

      {renombrar && <ModalRenombrar rol={renombrar} onCerrar={() => setRenombrar(null)} />}
    </>
  );
}

/** Modal con las acciones que el rol puede hacer dentro de la sección. */
function ModalAcciones({ rol, seccion, marcadas, onGuardado, onCerrar }: { rol: RolMatriz; seccion: Seccion; marcadas: string[]; onGuardado: (acciones: string[]) => void; onCerrar: () => void }) {
  const [elegidas, setElegidas] = useState(new Set(marcadas));
  const [error, setError] = useState("");
  const [guardando, iniciar] = useTransition();
  const todas = elegidas.size === seccion.acciones.length;

  function guardar() {
    setError("");
    iniciar(async () => {
      try {
        await guardarAcciones(rol.id, seccion.id, [...elegidas]);
        onGuardado([...elegidas]);
        onCerrar();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <Modal abierto titulo={`${seccion.nombre} · ${rol.nombre}`} onCerrar={onCerrar}>
      <div className="admPermisosLista">
        <label className="admCheck"><input type="checkbox" checked disabled /> Entrar y ver la sección</label>
        {seccion.acciones.map((a) => (
          <label key={a.id} className="admCheck">
            <input
              type="checkbox"
              checked={elegidas.has(a.id)}
              onChange={(e) => setElegidas((prev) => { const s = new Set(prev); if (e.target.checked) s.add(a.id); else s.delete(a.id); return s; })}
            />
            {a.nombre}
          </label>
        ))}
      </div>
      <button type="button" className="admLinkMuted admSmall" onClick={() => setElegidas(new Set(todas ? [] : seccion.acciones.map((a) => a.id)))}>{todas ? "Desmarcar todas" : "Marcar todas"}</button>
      {error && <p className="admError" role="alert">{error}</p>}
      <div className="admFormFootRow">
        <button type="button" className="admBtn" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
        <button type="button" className="admLinkMuted" onClick={onCerrar}>Cancelar</button>
      </div>
    </Modal>
  );
}

function ModalRenombrar({ rol, onCerrar }: { rol: RolMatriz; onCerrar: () => void }) {
  const [estado, accion, enviando] = useActionState<UsuarioState, FormData>(renombrarRol, {});
  useEffect(() => { if (estado.ok) onCerrar(); }, [estado, onCerrar]);
  return (
    <Modal abierto titulo={`Renombrar rol · ${rol.nombre}`} onCerrar={onCerrar}>
      <form action={accion} className="admForm">
        <input type="hidden" name="id" value={rol.id} />
        <label>Nombre<input className="admInput" name="nombre" defaultValue={rol.nombre} maxLength={60} required /></label>
        <Mensaje estado={estado} />
        <div className="admFormFootRow"><button className="admBtn" type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</button></div>
      </form>
    </Modal>
  );
}

function NuevoRol() {
  const [estado, accion, enviando] = useActionState<UsuarioState, FormData>(crearRol, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado]);
  return (
    <section className="admCard">
      <h2>Nuevo rol</h2>
      <form ref={form} action={accion} className="admForm admUsuariosForm">
        <div className="admNuevoRol">
          <input className="admInput" name="nombre" maxLength={60} placeholder="Ej. Ventas" required aria-label="Nombre del rol" />
          <button className="admBtn" type="submit" disabled={enviando}>{enviando ? "Creando…" : "Crear rol"}</button>
        </div>
        <Mensaje estado={estado} />
      </form>
    </section>
  );
}
