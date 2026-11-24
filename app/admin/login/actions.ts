"use server";

import { redirect } from "next/navigation";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function iniciarSesion(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!supabaseConfigurado) return { error: "Supabase todavía no está configurado." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Usuario dejado sin acceso desde Panel → Usuarios (ingreso bloqueado en Auth).
    if (error.code === "user_banned" || /banned/i.test(error.message)) return { error: "Esta cuenta está sin acceso al panel. Pide a un administrador que la reactive." };
    // 402: Supabase restringió el proyecto por pasar la cuota del plan (Dashboard → Usage).
    if (error.status === 402) return { error: "Supabase tiene el proyecto restringido por superar la cuota del plan. Revisa Usage y Billing en el dashboard de Supabase." };
    if (!error.status || error.status >= 500) return { error: "No se pudo conectar con Supabase. Inténtalo de nuevo en unos minutos." };
    return { error: "Correo o contraseña incorrectos." };
  }

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel." };
  }

  redirect("/admin");
}

export async function cerrarSesion() {
  if (supabaseConfigurado) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
