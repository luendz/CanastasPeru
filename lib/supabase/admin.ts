import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/*
 * Cliente de Supabase con la secret key, solo para el servidor. Se usa
 * únicamente en el webhook de Mercado Pago para llamar a registrar_pago_mp.
 * La clave es un secreto del Worker (SUPABASE_SECRET_KEY): nunca NEXT_PUBLIC_*.
 */
export function createAdminClient() {
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !clave) return null;
  return createClient(SUPABASE_URL, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}
