"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  alternarAcceso, cambiarClaveUsuario, cambiarMiClave, crearUsuario, editarUsuario, eliminarUsuario, type UsuarioState,
} from "./actions";

export type RolOpcion = { id: string; nombre: string; es_administrador: boolean };
export type UsuarioFila = { id: string; nombre: string; email: string; rolId: string; activo: boolean };

const AYUDA_CLAVE = "Mínimo 8 caracteres, con letras y números.";

export function Mensaje({ estado }: { estado: UsuarioState }) {
  if (estado.error) return <p className="admError" role="alert">{estado.error}</p>;
  if (estado.ok) return <p className="admSuccess" role="status">{estado.ok}</p>;
  return null;
}

/** Campo de contraseña con botón Ver/Ocultar. */
function CampoClave({ name, etiqueta }: { name: string; etiqueta: string }) {
  const [ver, setVer] = useState(false);
  return (
    <label>
      {etiqueta}
      <span className="admClave">
        <input className="admInput" name={name} type={ver ? "text" : "password"} autoComplete="new-password" minLength={8} required />
        <button type="button" className="admLinkMuted" onClick={() => setVer(!ver)}>{ver ? "Ocultar" : "Ver"}</button>
      </span>
    </label>
  );
}

function SelectRol({ roles, valor, bloqueado }: { roles: RolOpcion[]; valor?: string; bloqueado?: boolean }) {
  return (
    <label>
      Rol
      <select className="admInput" name="rol" defaultValue={valor ?? roles.find((r) => !r.es_administrador)?.id ?? roles[0]?.id} required disabled={bloqueado}>
        {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
      </select>
      {bloqueado && <input type="hidden" name="rol" value={valor} />}
    </label>
  );
}

/** Modal genérico del panel (dialog nativo). */
export function Modal({ abierto, titulo, onCerrar, children, ancho = "admDialogSmall" }: { abierto: boolean; titulo: string; onCerrar: () => void; children: React.ReactNode; ancho?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog ref={ref} className={`admDialog ${ancho}`} onClose={onCerrar}>
      {abierto && (
        <div className="admDialogBody">
          <div className="admCardHead">
            <h2>{titulo}</h2>
            <button type="button" className="admLinkMuted" onClick={onCerrar}>Cerrar ✕</button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** Agregar una persona con acceso al panel. */
export function NuevoUsuario({ roles }: { roles: RolOpcion[] }) {
  const [estado, accion, enviando] = useActionState<UsuarioState, FormData>(crearUsuario, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado]);
  return (
    <form ref={form} action={accion} className="admForm admUsuariosForm">
      <div className="admForm admFormGrid">
        <label>Nombre<input className="admInput" name="nombre" maxLength={120} placeholder="Ej. Ana Pérez" required /></label>
        <label>Correo<input className="admInput" name="email" type="email" autoComplete="off" placeholder="nombre@correo.com" required /></label>
        <CampoClave name="clave" etiqueta="Contraseña temporal" />
        <SelectRol roles={roles} />
      </div>
      <p className="admMuted admSmall">{AYUDA_CLAVE} Compártela por un medio privado; la persona puede cambiarla en Mi cuenta.</p>
      <Mensaje estado={estado} />
      <div><button className="admBtn" type="submit" disabled={enviando}>{enviando ? "Creando…" : "Crear usuario"}</button></div>
    </form>
  );
}

/** Acciones de una fila: editar, contraseña, dejar sin acceso / reactivar, eliminar. */
export function AccionesUsuario({ usuario, roles, esYo }: { usuario: UsuarioFila; roles: RolOpcion[]; esYo: boolean }) {
  const [modal, setModal] = useState<"editar" | "clave" | null>(null);
  const [editado, editar, guardando] = useActionState<UsuarioState, FormData>(editarUsuario, {});
  const [claveEstado, cambiarClave, cambiando] = useActionState<UsuarioState, FormData>(cambiarClaveUsuario, {});
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();

  const ejecutar = (accion: (fd: FormData) => Promise<void>, extra: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set("id", usuario.id);
    for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    setError("");
    iniciar(async () => {
      try { await accion(fd); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la acción."); }
    });
  };

  return (
    <div className="admFilaAcciones admUsuarioAcciones">
      <button type="button" className="admLinkMuted" onClick={() => setModal("editar")}>Editar</button>
      <button type="button" className="admLinkMuted" onClick={() => setModal("clave")}>Contraseña</button>
      {!esYo && (usuario.activo ? (
        <button type="button" className="admLinkMuted" disabled={pendiente} onClick={() => { if (window.confirm(`¿Dejar sin acceso a ${usuario.nombre}? No podrá entrar al panel hasta que lo reactives. Su historial se conserva.`)) ejecutar(alternarAcceso, { activar: "0" }); }}>Dejar sin acceso</button>
      ) : (
        <button type="button" className="admLinkMuted" disabled={pendiente} onClick={() => ejecutar(alternarAcceso, { activar: "1" })}>Reactivar</button>
      ))}
      {!esYo && (
        <button type="button" className="admLinkDanger" disabled={pendiente} onClick={() => { if (window.confirm(`¿Eliminar a ${usuario.nombre} (${usuario.email})? Se borra su cuenta y no se puede deshacer. Si solo quieres que no entre, usa «Dejar sin acceso».`)) ejecutar(eliminarUsuario); }}>Eliminar</button>
      )}
      {error && <p className="admError admSmall" role="alert">{error}</p>}

      <Modal abierto={modal === "editar"} titulo={`Editar · ${usuario.nombre}`} onCerrar={() => setModal(null)}>
        <form action={editar} className="admForm">
          <input type="hidden" name="id" value={usuario.id} />
          <label>Nombre<input className="admInput" name="nombre" defaultValue={usuario.nombre} maxLength={120} required /></label>
          <label>Correo<input className="admInput" name="email" type="email" defaultValue={usuario.email} required /></label>
          <SelectRol roles={roles} valor={usuario.rolId} bloqueado={esYo} />
          {esYo && <p className="admMuted admSmall">No puedes cambiar tu propio rol.</p>}
          <Mensaje estado={editado} />
          <div className="admFormFootRow"><button className="admBtn" type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button></div>
        </form>
      </Modal>

      <Modal abierto={modal === "clave"} titulo={`Nueva contraseña · ${usuario.nombre}`} onCerrar={() => setModal(null)}>
        <form action={cambiarClave} className="admForm">
          <input type="hidden" name="id" value={usuario.id} />
          <CampoClave name="clave" etiqueta="Nueva contraseña" />
          <p className="admMuted admSmall">{AYUDA_CLAVE}</p>
          <Mensaje estado={claveEstado} />
          <div className="admFormFootRow"><button className="admBtn" type="submit" disabled={cambiando}>{cambiando ? "Guardando…" : "Guardar contraseña"}</button></div>
        </form>
      </Modal>
    </div>
  );
}

/** Cambiar la propia contraseña. */
export function MiClave() {
  const [estado, accion, enviando] = useActionState<UsuarioState, FormData>(cambiarMiClave, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado]);
  return (
    <form ref={form} action={accion} className="admForm admUsuariosForm">
      <div className="admForm admFormGrid">
        <CampoClave name="clave" etiqueta="Nueva contraseña" />
        <CampoClave name="repetir" etiqueta="Repite la contraseña" />
      </div>
      <p className="admMuted admSmall">{AYUDA_CLAVE}</p>
      <Mensaje estado={estado} />
      <div><button className="admBtn" type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Cambiar mi contraseña"}</button></div>
    </form>
  );
}
