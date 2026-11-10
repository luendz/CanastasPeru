import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { SECCIONES, puede, type MisPermisos } from "@/lib/admin/permisos";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Capa de acceso del panel: toda página y acción de /admin pasa por aquí.
 * Verifica el token (getClaims), que el usuario esté activo en la tabla admins
 * y trae su rol y permisos. Las políticas RLS de la base vuelven a exigir el
 * acceso como segunda barrera.
 */
export const requireAdmin = cache(async () => {
  // El panel siempre depende de la sesión: nunca se prerenderiza.
  await connection();
  if (!supabaseConfigurado) redirect("/admin/login");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/admin/login");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) redirect("/admin/login?error=sin-permiso");

  const { data: mis } = await supabase.rpc("mis_permisos");
  const permisos = (mis as MisPermisos | null) ?? { rol: "", administrador: false, permisos: [] };

  return { supabase, email: (claims.email as string | undefined) ?? "", userId: claims.sub as string, permisos };
});

/** Primera página del panel que el rol puede ver (o Mi cuenta si no tiene ninguna sección). */
export function inicioPermitido(p: MisPermisos) {
  return SECCIONES.find((s) => puede(p, s.id))?.href ?? "/admin/mi-cuenta";
}

/** Exige acceso a una sección del panel; si no lo tiene, lo lleva a una que sí. */
export async function requireSeccion(seccion: string) {
  const ctx = await requireAdmin();
  if (!puede(ctx.permisos, seccion)) redirect(inicioPermitido(ctx.permisos));
  return ctx;
}

/** Exige un permiso concreto (acción); si falta, la acción se rechaza. */
export async function requirePermiso(clave: string) {
  const ctx = await requireAdmin();
  if (!puede(ctx.permisos, clave)) throw new Error("Tu rol no tiene permiso para hacer esto.");
  return ctx;
}

/** Solo el rol Administrador: usuarios y roles. */
export async function requireAdministrador() {
  const ctx = await requireAdmin();
  if (!ctx.permisos.administrador) redirect(inicioPermitido(ctx.permisos));
  return ctx;
}
