import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Webhook de marketing de Brevo: avisa cuando un contacto se da de baja o marca
 * un correo como spam. La web lo marca como dado de baja en Panel → Suscriptores.
 *
 * Brevo llama a https://mkacanastas.com/api/brevo/webhook?token=… ; el token es
 * la variable BREVO_WEBHOOK_TOKEN del Worker. Sin token válido no se hace nada.
 */

const EVENTOS_BAJA = new Set(["unsubscribed", "unsubscribe", "spam"]);

function tokenValido(recibido: string | null) {
  const esperado = process.env.BREVO_WEBHOOK_TOKEN?.trim() ?? "";
  if (!esperado || !recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!tokenValido(new URL(request.url).searchParams.get("token"))) return new Response("No autorizado", { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as unknown;
  // Brevo puede enviar un evento o una lista de eventos.
  const eventos = (Array.isArray(cuerpo) ? cuerpo : [cuerpo]) as { event?: string; email?: string; date?: string }[];
  const bajas = eventos
    .filter((e) => e && EVENTOS_BAJA.has(String(e.event ?? "").toLowerCase()) && typeof e.email === "string")
    .map((e) => e.email!.trim().toLowerCase())
    .filter((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 160);
  if (!bajas.length) return new Response(null, { status: 200 });

  const supabase = createAdminClient();
  if (!supabase) {
    console.error("Webhook de Brevo sin SUPABASE_SECRET_KEY: no se pudo registrar la baja.");
    return new Response("Sin configurar", { status: 503 });
  }
  const { error } = await supabase.from("suscriptores").update({ baja_at: new Date().toISOString() }).in("email", bajas).is("baja_at", null);
  if (error) {
    console.error("No se pudo registrar la baja de Brevo.", error);
    return new Response("Error", { status: 500 });
  }
  return new Response(null, { status: 200 });
}
