"use client";

import { useActionState } from "react";
import { iniciarSesion, type LoginState } from "./actions";

export default function LoginForm({ aviso }: { aviso?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(iniciarSesion, { error: aviso });

  return (
    <form action={action} className="admLoginForm">
      <label>
        Correo
        <input className="admInput" name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Contraseña
        <input className="admInput" name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error && <p className="admError" role="alert">{state.error}</p>}
      <button className="admBtn admBtnPrimary" type="submit" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</button>
    </form>
  );
}
