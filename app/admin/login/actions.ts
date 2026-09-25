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
  if (error) return { error: "Correo o contraseña incorrectos." };

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
