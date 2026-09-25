/**
 * Datos públicos del proyecto de Supabase (se definen en .env.local).
 * La publishable key es pública por diseño: la seguridad la dan las
 * políticas RLS de la base, no el secreto de esta clave.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Sin estas variables la tienda funciona en modo demostración y el panel lo avisa. */
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_KEY);
