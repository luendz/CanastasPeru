import { requireAdministrador } from "@/lib/admin/auth";
import Pestanas from "./Pestanas";

/** Usuarios y roles: solo el rol Administrador. */
export default async function UsuariosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdministrador();
  return (
    <>
      <header className="admHead">
        <div>
          <h1>Usuarios</h1>
          <p className="admMuted">Quién entra al panel y qué puede hacer cada rol. Solo el rol Administrador ve esta sección.</p>
        </div>
      </header>
      <Pestanas />
      {children}
    </>
  );
}
