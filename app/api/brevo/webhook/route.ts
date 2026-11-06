import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Webhook de marketing de Brevo: avisa cuando un contacto se da de baja o marca
 * un correo como spam. La web lo marca como dado de baja en Panel → Suscriptores.
 *
 * Brevo llama a https://mkacanastas.com/api/brevo/webhook con la clave
 * BREVO_WEBHOOK_TOKEN del Worker en la autenticación del webhook: token
 * (Authorization: Bearer …), básica (la clave como contraseña) o la cabecera
 * x-webhook-token. También se acepta ?token=… en la URL. Sin clave válida no se hace nada.
 */

const EVENTOS_BAJA = new Set(["unsubscribed", "unsubscribe", "spam"]);

function tokenValido(recibido: string | null) {
  const esperado = process.env.BREVO_WEBHOOK_TOKEN?.trim() ?? "";
  if (!esperado || !recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Claves que trae la llamada, en cualquiera de las formas que permite Brevo. */
function clavesRecibidas(request: Request) {
  const claves = [new URL(request.url).searchParams.get("token"), request.headers.get("x-webhook-token")];
  const auth = request.headers.get("authorization") ?? "";
  const [tipo, valor = ""] = auth.trim().split(/\s+/, 2);
  if (/^bearer$/i.test(tipo)) claves.push(valor);
  if (/^basic$/i.test(tipo)) {
    const texto = Buffer.from(valor, "base64").toString("utf8");
    claves.push(texto.slice(texto.indexOf(":") + 1));
  }
  return claves;
}

export async function POST(request: Request) {
  if (!clavesRecibidas(request).some(tokenValido)) return new Response("No autorizado", { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as unknown;
  // Brevo puede enviar un evento o una lista de eventos.
  type Evento = { event?: string; type?: string; email?: string; contact?: { email?: string } };
  const eventos = (Array.isArray(cuerpo) ? cuerpo : [cuerpo]).filter((e): e is Evento => Boolean(e) && typeof e === "object");
  // El nombre del evento cambia según el tipo de webhook de Brevo ("unsubscribed", "spam", "contact_unsubscribed"…).
  const esBaja = (e: Evento) => {
    const nombre = String(e.event ?? e.type ?? "").toLowerCase();
    return EVENTOS_BAJA.has(nombre) || nombre.includes("unsubscri") || nombre.includes("spam");
  };
  const bajas = eventos
    .filter(esBaja)
    .map((e) => String(e.email ?? e.contact?.email ?? "").trim().toLowerCase())
    .filter((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 160);
  if (!bajas.length) {
    if (eventos.length) console.log("Webhook de Brevo sin bajas:", eventos.map((e) => e.event ?? e.type ?? "?").join(", "));
    return new Response(null, { status: 200 });
  }

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
