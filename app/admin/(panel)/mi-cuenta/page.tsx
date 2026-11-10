import { requireAdmin } from "@/lib/admin/auth";
import { MiClave } from "../usuarios/Formularios";

export const metadata = { title: "Mi cuenta" };

/** Cada usuario del panel cambia aquí su propia contraseña. */
export default async function MiCuentaPage() {
  const { email, permisos } = await requireAdmin();
  return (
    <>
      <header className="admHead">
        <div>
          <h1>Mi cuenta</h1>
          <p className="admMuted">{email}{permisos.rol ? ` · Rol: ${permisos.rol}` : ""}</p>
        </div>
      </header>
      <section className="admCard">
        <h2>Cambiar mi contraseña</h2>
        <MiClave />
      </section>
    </>
  );
}
