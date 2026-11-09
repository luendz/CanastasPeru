"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type UsuarioState = { ok?: string; error?: string };

const MIN_CLAVE = 8;
const SIN_CLAVE_SECRETA = "Falta SUPABASE_SECRET_KEY en el servidor: no se pueden gestionar usuarios.";

function validarClave(clave: string) {
  if (clave.length < MIN_CLAVE) return `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.`;
  if (!/[a-zA-Z]/.test(clave) || !/\d/.test(clave)) return "La contraseña debe combinar letras y números.";
  return null;
}

/**
 * Da acceso al panel a una persona: crea su usuario (correo + contraseña
 * temporal, ya confirmado) y la registra en admins. Si el correo ya tenía
 * usuario, solo se le da acceso. Requiere la secret key (auth.admin).
 */
export async function crearUsuario(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  await requireAdmin();
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const clave = String(fd.get("clave") ?? "");
  if (!nombre) return { error: "Escribe el nombre de la persona." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Escribe un correo válido." };
  const falla = validarClave(clave);
  if (falla) return { error: falla };

  const admin = createAdminClient();
  if (!admin) return { error: SIN_CLAVE_SECRETA };

  let userId: string | undefined;
  const { data: creado, error } = await admin.auth.admin.createUser({ email, password: clave, email_confirm: true, user_metadata: { nombre } });
  if (error) {
    // Correo ya registrado: se busca su usuario para darle acceso.
    if (!/already|registered|exists/i.test(error.message)) return { error: `No se pudo crear el usuario: ${error.message}` };
    const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = lista?.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (!userId) return { error: "Ese correo ya está registrado, pero no se encontró su usuario." };
  } else {
    userId = creado.user?.id;
  }
  if (!userId) return { error: "No se pudo crear el usuario." };

  const { data: ya } = await admin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (ya) return { error: `${email} ya tiene acceso al panel.` };
  const { error: errAdmin } = await admin.from("admins").insert({ user_id: userId, nombre });
  if (errAdmin) return { error: `No se pudo dar acceso: ${errAdmin.message}` };

  revalidatePath("/admin/usuarios");
  return { ok: `Listo: ${nombre} ya puede entrar al panel con ${email} y la contraseña que escribiste.` };
}

/** Pone una contraseña nueva a otro administrador (por ejemplo, si la olvidó). */
export async function cambiarClaveUsuario(_prev: UsuarioState, fd: FormData): Promise<UsuarioState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const clave = String(fd.get("clave") ?? "");
  const falla = validarClave(clave);
  if (falla) return { error: falla };
  const admin = createAdminClient();
  if (!admin) return { error: SIN_CLAVE_SECRETA };
  const { data: esAdmin } = await admin.from("admins").select("user_id").eq("user_id", id).maybeSingle();
  if (!esAdmin) return { error: "Ese usuario no es administrador." };
  const { error } = await admin.auth.admin.updateUserById(id, { password: clave });
  if (error) return { error: `No se pudo cambiar la contraseña: ${error.message}` };
  return { ok: "Contraseña actualizada. Compártela con la persona por un medio privado." };
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

/**
 * Quita el acceso al panel y borra el usuario (en la web solo los
 * administradores tienen cuenta). No se puede quitar a uno mismo ni al último.
 */
export async function quitarAcceso(fd: FormData) {
  const { userId } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id || id === userId) throw new Error("No puedes quitarte el acceso a ti mismo.");
  const admin = createAdminClient();
  if (!admin) throw new Error(SIN_CLAVE_SECRETA);
  const { count } = await admin.from("admins").select("user_id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) throw new Error("Debe quedar al menos un administrador.");
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(`No se pudo quitar el acceso: ${error.message}`);
  revalidatePath("/admin/usuarios");
}
