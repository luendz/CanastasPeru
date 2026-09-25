import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Capa de acceso del panel: toda página y acción de /admin pasa por aquí.
 * Verifica el token (getClaims) y que el usuario esté en la tabla admins.
 * Las políticas RLS de la base vuelven a exigir lo mismo como segunda barrera.
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

  return { supabase, email: (claims.email as string | undefined) ?? "", userId: claims.sub as string };
});
