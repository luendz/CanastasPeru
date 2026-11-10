import { requireAdministrador } from "@/lib/admin/auth";
import { SECCIONES } from "@/lib/admin/permisos";
import { createAdminClient } from "@/lib/supabase/admin";
import Matriz, { type RolMatriz } from "./Matriz";

export const metadata = { title: "Roles y accesos" };

/** Roles editables: a qué secciones entra cada uno y qué puede hacer en ellas. */
export default async function RolesPage() {
  const { supabase } = await requireAdministrador();
  const admin = createAdminClient();
  const [{ data: roles, error }, { data: permisos }, usuarios] = await Promise.all([
    supabase.from("roles").select("id,nombre,es_administrador").order("es_administrador", { ascending: false }).order("created_at"),
    supabase.from("rol_permisos").select("rol_id,permiso"),
    // El conteo por rol necesita ver todas las filas de admins (secret key).
    admin ? admin.from("admins").select("rol_id") : Promise.resolve({ data: null }),
  ]);

  const lista: RolMatriz[] = ((roles ?? []) as { id: string; nombre: string; es_administrador: boolean }[]).map((r) => ({
    ...r,
    usuarios: usuarios.data ? (usuarios.data as { rol_id: string }[]).filter((u) => u.rol_id === r.id).length : null,
    permisos: ((permisos ?? []) as { rol_id: string; permiso: string }[]).filter((p) => p.rol_id === r.id).map((p) => p.permiso),
  }));

  return (
    <div className="admStack">
      {error && <p className="admError">No se pudieron cargar los roles: {error.message}</p>}
      <Matriz roles={lista} secciones={SECCIONES} />
    </div>
  );
}
