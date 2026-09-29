"use server";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type SuscripcionState = { ok?: boolean; error?: string };

/** Guarda el correo del pie de página en la lista de novedades. */
export async function suscribir(_prev: SuscripcionState, fd: FormData): Promise<SuscripcionState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 160) return { error: "Escribe un correo válido." };
  if (!supabaseConfigurado) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.rpc("suscribir_novedades", { p_email: email });
  if (error) return { error: "No pudimos registrarte. Inténtalo de nuevo." };
  return { ok: true };
}
