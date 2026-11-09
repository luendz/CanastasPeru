"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cambiarClaveUsuario, cambiarMiClave, crearUsuario, type UsuarioState } from "./actions";

const AYUDA_CLAVE = "Mínimo 8 caracteres, con letras y números.";

function Mensaje({ estado }: { estado: UsuarioState }) {
  if (estado.error) return <p className="admError" role="alert">{estado.error}</p>;
  if (estado.ok) return <p className="admSuccess" role="status">{estado.ok}</p>;
  return null;
}

/** Campo de contraseña con botón Ver/Ocultar. */
function CampoClave({ name, etiqueta, autoComplete = "new-password" }: { name: string; etiqueta: string; autoComplete?: string }) {
  const [ver, setVer] = useState(false);
  return (
    <label>
      {etiqueta}
      <span className="admClave">
        <input className="admInput" name={name} type={ver ? "text" : "password"} autoComplete={autoComplete} minLength={8} required />
        <button type="button" className="admLinkMuted" onClick={() => setVer(!ver)}>{ver ? "Ocultar" : "Ver"}</button>
      </span>
    </label>
  );
}

/** Agregar una persona con acceso al panel. */
export function NuevoUsuario() {
  const [estado, accion, enviando] = useActionState<UsuarioState, FormData>(crearUsuario, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado]);
  return (
    <form ref={form} action={accion} className="admForm">
      <div className="admForm admFormGrid">
        <label>Nombre<input className="admInput" name="nombre" maxLength={120} placeholder="Ej. Ana Pérez" required /></label>
        <label>Correo<input className="admInput" name="email" type="email" autoComplete="off" placeholder="nombre@correo.com" required /></label>
      </div>
      <CampoClave name="clave" etiqueta="Contraseña temporal" />
      <p className="admMuted admSmall">{AYUDA_CLAVE} Compártela por un medio privado; la persona puede cambiarla después en esta misma sección.</p>
      <Mensaje estado={estado} />
      <div><button className="admBtn" type="submit" disabled={enviando}>{enviando ? "Creando…" : "Dar acceso"}</button></div>
    </form>
  );
}

/** Contraseña nueva para otro administrador (si la olvidó). */
export function NuevaClave({ id, nombre }: { id: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState<UsuarioState, FormData>(cambiarClaveUsuario, {});
  if (!abierto && !estado.ok) return <button type="button" className="admLinkMuted" onClick={() => setAbierto(true)}>Nueva contraseña</button>;
  return (
    <form action={accion} className="admForm admClaveForm">
      <input type="hidden" name="id" value={id} />
      {!estado.ok && <CampoClave name="clave" etiqueta={`Nueva contraseña para ${nombre}`} />}
      <Mensaje estado={estado} />
      {!estado.ok && (
        <div className="admFormFootRow">
          <button className="admBtn" type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</button>
          <button type="button" className="admLinkMuted" onClick={() => setAbierto(false)}>Cancelar</button>
        </div>
      )}
    </form>
  );
}

/** Cambiar la propia contraseña. */
export function MiClave() {
  const [estado, accion, enviando] = useActionState<UsuarioState, FormData>(cambiarMiClave, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) form.current?.reset(); }, [estado]);
  return (
    <form ref={form} action={accion} className="admForm">
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
