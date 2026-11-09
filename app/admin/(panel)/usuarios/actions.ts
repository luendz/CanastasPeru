"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { CLAVES, SECCIONES } from "@/lib/admin/permisos";
import { createAdminClient } from "@/lib/supabase/admin";

export type UsuarioState = { ok?: string; error?: string };

const MIN_CLAVE = 8;
const SIN_CLAVE_SECRETA = "Falta SUPABASE_SECRET_KEY en el servidor: no se pueden gestionar usuarios.";
const SOLO_ADMINISTRADOR = "Solo el rol Administrador puede gestionar usuarios y roles.";
const SIEMPRE_SIN_ACCESO = "876000h"; // ~100 años: equivale a bloquear el ingreso.

function validarClave(clave: string) {
  if (clave.length < MIN_CLAVE) return `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.`;
  if (!/[a-zA-Z]/.test(clave) || !/\d/.test(clave)) return "La contraseña debe combinar letras y números.";
  return null;
}

const correoValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Sesión del Administrador + cliente con la secret key (usuarios de Auth). */
async function administrador() {
  const ctx = await requireAdmin();
  if (!ctx.permisos.administrador) return { error: SOLO_ADMINISTRADOR } as const;
  const admin = createAdminClient();
  if (!admin) return { error: SIN_CLAVE_SECRETA } as const;
  return { ...ctx, admin } as const;
}

/** ¿Quedaría al menos un Administrador activo si este usuario deja de serlo? */
async function quedaOtroAdministrador(admin: NonNullable<ReturnType<typeof createAdminClient>>, sinUsuario: string) {
  const { data: rol } = await admin.from("roles").select("id").eq("es_administrador", true).single();
  const { count } = await admin.from("admins").select("user_id", { count: "exact", head: true }).eq("rol_id", rol?.id ?? "").eq("activo", true).neq("user_id", sinUsuario);
  return (count ?? 0) > 0;
}

async function rolValido(admin: NonNullable<ReturnType<typeof createAdminClient>>, rolId: string) {
  const { data } = await admin.from("roles").select("id,es_administrador").eq("id", rolId).maybeSingle();
  return data as { id: string; es_administrador: boolean } | null;
}

/* ───────────── Usuarios ───────────── */

/** Crea un usuario del panel (correo + contraseña temporal, ya confirmado) con su rol. */
export async function crearUsuario(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  const ctx = await administrador();
  if ("error" in ctx) return { error: ctx.error };
  const { admin } = ctx;
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const clave = String(fd.get("clave") ?? "");
  const rolId = String(fd.get("rol") ?? "");
  if (!nombre) return { error: "Escribe el nombre de la persona." };
  if (!correoValido(email)) return { error: "Escribe un correo válido." };
  const falla = validarClave(clave);
  if (falla) return { error: falla };
  if (!(await rolValido(admin, rolId))) return { error: "Elige un rol." };

  let userId: string | undefined;
  const { data: creado, error } = await admin.auth.admin.createUser({ email, password: clave, email_confirm: true, user_metadata: { nombre } });
  if (error) {
    // Correo ya registrado: se busca su usuario para darle acceso.
    if (!/already|registered|exists/i.test(error.message)) return { error: `No se pudo crear el usuario: ${error.message}` };
    const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = lista?.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (!userId) return { error: "Ese correo ya está registrado, pero no se encontró su usuario." };
    const { data: ya } = await admin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
    if (ya) return { error: `${email} ya es usuario del panel.` };
    await admin.auth.admin.updateUserById(userId, { password: clave, ban_duration: "none" });
  } else {
    userId = creado.user?.id;
  }
  if (!userId) return { error: "No se pudo crear el usuario." };

  const { error: errAdmin } = await admin.from("admins").insert({ user_id: userId, nombre, rol_id: rolId, activo: true });
  if (errAdmin) return { error: `No se pudo dar acceso: ${errAdmin.message}` };
  revalidatePath("/admin/usuarios");
  return { ok: `Listo: ${nombre} ya puede entrar al panel con ${email} y la contraseña que escribiste.` };
}

/** Cambia nombre, correo y rol de un usuario. */
export async function editarUsuario(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  const ctx = await administrador();
  if ("error" in ctx) return { error: ctx.error };
  const { admin, userId: yo } = ctx;
  const id = String(fd.get("id") ?? "");
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const rolId = String(fd.get("rol") ?? "");
  if (!nombre) return { error: "Escribe el nombre." };
  if (!correoValido(email)) return { error: "Escribe un correo válido." };

  const { data: actual } = await admin.from("admins").select("rol_id").eq("user_id", id).maybeSingle();
  if (!actual) return { error: "Ese usuario no existe." };
  const rol = await rolValido(admin, rolId);
  if (!rol) return { error: "Elige un rol." };
  if (rolId !== actual.rol_id) {
    if (id === yo) return { error: "No puedes cambiar tu propio rol." };
    const eraAdministrador = (await rolValido(admin, actual.rol_id))?.es_administrador;
    if (eraAdministrador && !rol.es_administrador && !(await quedaOtroAdministrador(admin, id))) return { error: "Debe quedar al menos un Administrador activo." };
  }

  const { data: auth } = await admin.auth.admin.getUserById(id);
  if (auth.user && auth.user.email?.toLowerCase() !== email) {
    const { error } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
    if (error) return { error: `No se pudo cambiar el correo: ${error.message}` };
  }
  const { error } = await admin.from("admins").update({ nombre, rol_id: rolId }).eq("user_id", id);
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/admin/usuarios");
  return { ok: "Cambios guardados." };
}

/** Pone una contraseña nueva a un usuario (por ejemplo, si la olvidó). */
export async function cambiarClaveUsuario(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  const ctx = await administrador();
  if ("error" in ctx) return { error: ctx.error };
  const id = String(fd.get("id") ?? "");
  const clave = String(fd.get("clave") ?? "");
  const falla = validarClave(clave);
  if (falla) return { error: falla };
  const { data: existe } = await ctx.admin.from("admins").select("user_id").eq("user_id", id).maybeSingle();
  if (!existe) return { error: "Ese usuario no existe." };
  const { error } = await ctx.admin.auth.admin.updateUserById(id, { password: clave });
  if (error) return { error: `No se pudo cambiar la contraseña: ${error.message}` };
  return { ok: "Contraseña actualizada. Compártela con la persona por un medio privado." };
}

/**
 * Deja sin acceso a un usuario o se lo devuelve. Sin acceso: no puede entrar
 * (ingreso bloqueado en Auth) y la base le niega los datos al instante,
 * aunque tuviera la sesión abierta. Se conserva su historial.
 */
export async function alternarAcceso(fd: FormData) {
  const ctx = await administrador();
  if ("error" in ctx) throw new Error(ctx.error);
  const id = String(fd.get("id") ?? "");
  const activar = fd.get("activar") === "1";
  if (id === ctx.userId) throw new Error("No puedes quitarte el acceso a ti mismo.");
  if (!activar && !(await quedaOtroAdministrador(ctx.admin, id))) throw new Error("Debe quedar al menos un Administrador activo.");
  const { error } = await ctx.admin.from("admins").update({ activo: activar }).eq("user_id", id);
  if (error) throw new Error(error.message);
  const { error: errAuth } = await ctx.admin.auth.admin.updateUserById(id, { ban_duration: activar ? "none" : SIEMPRE_SIN_ACCESO });
  if (errAuth) throw new Error(errAuth.message);
  revalidatePath("/admin/usuarios");
}

/** Borra el usuario por completo (su cuenta de acceso). No se puede deshacer. */
export async function eliminarUsuario(fd: FormData) {
  const ctx = await administrador();
  if ("error" in ctx) throw new Error(ctx.error);
  const id = String(fd.get("id") ?? "");
  if (id === ctx.userId) throw new Error("No puedes eliminarte a ti mismo.");
  if (!(await quedaOtroAdministrador(ctx.admin, id))) throw new Error("Debe quedar al menos un Administrador activo.");
  const { error } = await ctx.admin.auth.admin.deleteUser(id);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
  revalidatePath("/admin/usuarios");
}

/** Cambia la contraseña de quien tiene la sesión abierta (no requiere la secret key). */
export async function cambiarMiClave(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  const { supabase } = await requireAdmin();
  const clave = String(fd.get("clave") ?? "");
  const repetir = String(fd.get("repetir") ?? "");
  const falla = validarClave(clave);
  if (falla) return { error: falla };
  if (clave !== repetir) return { error: "Las dos contraseñas no coinciden." };
  const { error } = await supabase.auth.updateUser({ password: clave });
  if (error) return { error: `No se pudo cambiar tu contraseña: ${error.message}` };
  return { ok: "Tu contraseña se cambió. Úsala la próxima vez que entres." };
}

/* ───────────── Roles y permisos (con la sesión: RLS solo deja al Administrador) ───────────── */

async function sesionAdministrador() {
  const ctx = await requireAdmin();
  if (!ctx.permisos.administrador) throw new Error(SOLO_ADMINISTRADOR);
  return ctx.supabase;
}

export async function crearRol(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  const ctx = await requireAdmin();
  if (!ctx.permisos.administrador) return { error: SOLO_ADMINISTRADOR };
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 60);
  if (!nombre) return { error: "Escribe el nombre del rol." };
  const { error } = await ctx.supabase.from("roles").insert({ nombre });
  if (error) return { error: /duplicate|unique/i.test(error.message) ? "Ya existe un rol con ese nombre." : error.message };
  revalidatePath("/admin/usuarios/roles");
  return { ok: `Rol «${nombre}» creado. Marca las secciones a las que puede entrar.` };
}

export async function renombrarRol(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  const ctx = await requireAdmin();
  if (!ctx.permisos.administrador) return { error: SOLO_ADMINISTRADOR };
  const id = String(fd.get("id") ?? "");
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 60);
  if (!nombre) return { error: "Escribe el nombre del rol." };
  const { error, count } = await ctx.supabase.from("roles").update({ nombre }, { count: "exact" }).eq("id", id);
  if (error) return { error: /duplicate|unique/i.test(error.message) ? "Ya existe un rol con ese nombre." : error.message };
  if (!count) return { error: "Este rol no se puede renombrar." };
  revalidatePath("/admin/usuarios", "layout");
  return { ok: "Rol renombrado." };
}

/** Borra un rol que no tenga usuarios. */
export async function eliminarRol(fd: FormData) {
  const supabase = await sesionAdministrador();
  const id = String(fd.get("id") ?? "");
  const admin = createAdminClient();
  if (admin) {
    const { count } = await admin.from("admins").select("user_id", { count: "exact", head: true }).eq("rol_id", id);
    if (count) throw new Error(`Este rol tiene ${count} usuario${count === 1 ? "" : "s"}: cámbiales el rol antes de eliminarlo.`);
  }
  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) throw new Error(/foreign key/i.test(error.message) ? "Este rol tiene usuarios: cámbiales el rol antes de eliminarlo." : error.message);
  revalidatePath("/admin/usuarios", "layout");
}

/** Da o quita a un rol la entrada a una sección (al quitarla, también sus acciones). */
export async function alternarSeccion(rolId: string, seccion: string, permitir: boolean) {
  const supabase = await sesionAdministrador();
  if (!SECCIONES.some((s) => s.id === seccion)) throw new Error("Sección desconocida.");
  if (permitir) {
    const { error } = await supabase.from("rol_permisos").upsert({ rol_id: rolId, permiso: seccion });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("rol_permisos").delete().eq("rol_id", rolId).eq("permiso", seccion);
    if (error) throw new Error(error.message);
    const { error: e2 } = await supabase.from("rol_permisos").delete().eq("rol_id", rolId).like("permiso", `${seccion}.%`);
    if (e2) throw new Error(e2.message);
  }
  revalidatePath("/admin/usuarios/roles");
}

/** Guarda las acciones permitidas de un rol en una sección (reemplaza las anteriores). */
export async function guardarAcciones(rolId: string, seccion: string, acciones: string[]) {
  const supabase = await sesionAdministrador();
  const claves = acciones.map((a) => `${seccion}.${a}`).filter((c) => CLAVES.has(c));
  const { error: e1 } = await supabase.from("rol_permisos").delete().eq("rol_id", rolId).like("permiso", `${seccion}.%`);
  if (e1) throw new Error(e1.message);
  const filas = [{ rol_id: rolId, permiso: seccion }, ...claves.map((permiso) => ({ rol_id: rolId, permiso }))];
  const { error: e2 } = await supabase.from("rol_permisos").upsert(filas);
  if (e2) throw new Error(e2.message);
  revalidatePath("/admin/usuarios/roles");
}
