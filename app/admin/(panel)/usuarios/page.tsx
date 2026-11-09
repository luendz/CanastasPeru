import { requireAdministrador } from "@/lib/admin/auth";
import { fechaCorta, fechaHora } from "@/lib/admin/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { AccionesUsuario, NuevoUsuario, type RolOpcion } from "./Formularios";

export const metadata = { title: "Usuarios" };

type Fila = { id: string; nombre: string; email: string; rolId: string; rol: string; activo: boolean; creado: string; ultimoIngreso: string | null };

/** Personas con acceso al panel: crear, editar, contraseña, dejar sin acceso y eliminar. */
export default async function UsuariosPage() {
  const { supabase, userId } = await requireAdministrador();
  const admin = createAdminClient();
  const { data: rolesData } = await supabase.from("roles").select("id,nombre,es_administrador").order("es_administrador", { ascending: false }).order("nombre");
  const roles = (rolesData ?? []) as RolOpcion[];

  let filas: Fila[] = [];
  let error = "";
  if (!admin) {
    error = "Falta SUPABASE_SECRET_KEY en el servidor: aquí no se pueden listar ni crear usuarios. Tu contraseña se cambia en Mi cuenta.";
  } else {
    const [{ data, error: e1 }, { data: auth, error: e2 }] = await Promise.all([
      admin.from("admins").select("user_id,nombre,rol_id,activo,created_at").order("created_at"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    if (e1 || e2) error = `No se pudo cargar la lista: ${(e1 ?? e2)?.message}`;
    const porId = new Map((auth?.users ?? []).map((u) => [u.id, u]));
    const nombreRol = new Map(roles.map((r) => [r.id, r.nombre]));
    filas = ((data ?? []) as { user_id: string; nombre: string | null; rol_id: string; activo: boolean; created_at: string }[]).map((f) => {
      const u = porId.get(f.user_id);
      return {
        id: f.user_id,
        nombre: f.nombre || u?.email?.split("@")[0] || "Sin nombre",
        email: u?.email ?? "",
        rolId: f.rol_id,
        rol: nombreRol.get(f.rol_id) ?? "—",
        activo: f.activo,
        creado: f.created_at,
        ultimoIngreso: u?.last_sign_in_at ?? null,
      };
    });
  }

  return (
    <div className="admStack">
      {error && <p className="admError">{error}</p>}

      <section className="admCard admCardFlush">
        {filas.length === 0 ? (
          <p className="admEmpty">{admin ? "No hay usuarios." : "Lista no disponible."}</p>
        ) : (
          <table className="admTable">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último ingreso</th><th><span className="admSrOnly">Acciones</span></th></tr></thead>
            <tbody>
              {filas.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}{u.id === userId && <small className="admMuted admBlock">Tú</small>}</td>
                  <td>{u.email}<small className="admMuted admBlock">Desde {fechaCorta(u.creado)}</small></td>
                  <td>{u.rol}</td>
                  <td>{u.activo ? <span className="admBadge" data-estado="entregada">Activo</span> : <span className="admBadge" data-estado="anulada">Sin acceso</span>}</td>
                  <td>{u.ultimoIngreso ? fechaHora(u.ultimoIngreso) : <span className="admMuted">Nunca</span>}</td>
                  <td><AccionesUsuario usuario={{ id: u.id, nombre: u.nombre, email: u.email, rolId: u.rolId, activo: u.activo }} roles={roles} esYo={u.id === userId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {admin && roles.length > 0 && (
        <section className="admCard">
          <h2>Crear usuario</h2>
          <NuevoUsuario roles={roles} />
        </section>
      )}
    </div>
  );
}
