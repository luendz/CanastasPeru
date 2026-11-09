import { requireAdmin } from "@/lib/admin/auth";
import { fechaCorta, fechaHora } from "@/lib/admin/format";
import { createAdminClient } from "@/lib/supabase/admin";
import BotonEliminar from "../BotonEliminar";
import { quitarAcceso } from "./actions";
import { MiClave, NuevaClave, NuevoUsuario } from "./Formularios";

export const metadata = { title: "Usuarios" };

type Usuario = { id: string; nombre: string; email: string; creado: string; ultimoIngreso: string | null };

/** Personas con acceso al panel: agregar, cambiar contraseña y quitar acceso. */
export default async function UsuariosPage() {
  const { userId, email: miCorreo } = await requireAdmin();
  const admin = createAdminClient();

  let usuarios: Usuario[] = [];
  let error = "";
  if (!admin) {
    error = "Falta SUPABASE_SECRET_KEY en el servidor: aquí solo puedes cambiar tu propia contraseña.";
  } else {
    const [{ data: filas, error: e1 }, { data: auth, error: e2 }] = await Promise.all([
      admin.from("admins").select("user_id,nombre,created_at").order("created_at"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    if (e1 || e2) error = `No se pudo cargar la lista: ${(e1 ?? e2)?.message}`;
    const porId = new Map((auth?.users ?? []).map((u) => [u.id, u]));
    usuarios = ((filas ?? []) as { user_id: string; nombre: string | null; created_at: string }[]).map((f) => {
      const u = porId.get(f.user_id);
      return { id: f.user_id, nombre: f.nombre || u?.email?.split("@")[0] || "Sin nombre", email: u?.email ?? "", creado: f.created_at, ultimoIngreso: u?.last_sign_in_at ?? null };
    });
  }

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Usuarios</h1>
          <p className="admMuted">Personas que pueden entrar al panel con su correo y contraseña. Todas tienen acceso completo.</p>
        </div>
      </header>

      {error && <p className="admError">{error}</p>}

      <div className="admStack">
        <section className="admCard admCardFlush">
          {usuarios.length === 0 ? (
            <p className="admEmpty">{admin ? "No hay usuarios." : "Lista no disponible."}</p>
          ) : (
            <table className="admTable">
              <thead><tr><th>Nombre</th><th>Correo</th><th>Desde</th><th>Último ingreso</th><th><span className="admSrOnly">Acciones</span></th></tr></thead>
              <tbody>
                {usuarios.map((u) => {
                  const yo = u.id === userId;
                  return (
                    <tr key={u.id}>
                      <td>{u.nombre}{yo && <small className="admMuted admBlock">Tú</small>}</td>
                      <td>{u.email}</td>
                      <td>{fechaCorta(u.creado)}</td>
                      <td>{u.ultimoIngreso ? fechaHora(u.ultimoIngreso) : <span className="admMuted">Nunca</span>}</td>
                      <td>
                        {!yo && (
                          <div className="admFilaAcciones">
                            <NuevaClave id={u.id} nombre={u.nombre} />
                            {usuarios.length > 1 && (
                              <BotonEliminar id={u.id} accion={quitarAcceso} mensaje={`¿Quitar el acceso de ${u.nombre} (${u.email})? Ya no podrá entrar al panel. Para devolvérselo, agrégalo de nuevo.`} />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {admin && (
          <section className="admCard">
            <h2>Agregar usuario</h2>
            <NuevoUsuario />
          </section>
        )}

        <section className="admCard">
          <h2>Mi contraseña</h2>
          <p className="admMuted">Cambia la contraseña con la que entras ({miCorreo}).</p>
          <MiClave />
        </section>
      </div>
    </>
  );
}
