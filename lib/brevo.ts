/*
 * Brevo (correo): contactos de la lista de novedades y correos transaccionales.
 *
 * Todo se configura en las variables del Worker (Cloudflare → Workers →
 * mka-canastas → Configuración → Variables y secretos):
 * - BREVO_API_KEY            (secreto) clave de API de Brevo.
 * - BREVO_REMITENTE          correo remitente verificado en Brevo, p. ej. pedidos@mkacanastas.com.
 * - BREVO_REMITENTE_NOMBRE   nombre que ve el cliente (por defecto "MKA Canastas").
 * - BREVO_LISTA_NOVEDADES    número de la lista de Brevo para los suscriptores.
 * - AVISOS_CORREO            correo del negocio que recibe los avisos de pedidos y cotizaciones.
 *
 * Sin BREVO_API_KEY no se envía nada y la web funciona igual. Un fallo de
 * Brevo nunca interrumpe un pedido: solo queda en el registro del Worker.
 */

const API = "https://api.brevo.com/v3";

const clave = () => process.env.BREVO_API_KEY?.trim() ?? "";
export const brevoConfigurado = () => Boolean(clave());

async function llamar(ruta: string, cuerpo: unknown) {
  const res = await fetch(`${API}${ruta}`, {
    method: "POST",
    headers: { "api-key": clave(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(cuerpo),
    cache: "no-store",
  });
  if (!res.ok && res.status !== 204) throw new Error(`Brevo ${ruta}: ${res.status} ${(await res.text()).slice(0, 300)}`);
}

/** Agrega (o actualiza) un correo en la lista de novedades. */
export async function agregarSuscriptor(email: string) {
  const lista = Number(process.env.BREVO_LISTA_NOVEDADES);
  if (!brevoConfigurado() || !Number.isInteger(lista) || lista <= 0) return;
  try {
    await llamar("/contacts", { email, listIds: [lista], updateEnabled: true });
  } catch (e) {
    console.error("No se pudo agregar el suscriptor a Brevo.", e);
  }
}

export type Correo = { para: string; nombre?: string; asunto: string; html: string; responderA?: string };

/** Envía un correo transaccional. Devuelve false si no se envió (sin configurar o error). */
export async function enviarCorreo({ para, nombre, asunto, html, responderA }: Correo) {
  const remitente = process.env.BREVO_REMITENTE?.trim();
  if (!brevoConfigurado() || !remitente || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(para)) return false;
  try {
    await llamar("/smtp/email", {
      sender: { email: remitente, name: process.env.BREVO_REMITENTE_NOMBRE?.trim() || "MKA Canastas" },
      to: [{ email: para, ...(nombre ? { name: nombre } : {}) }],
      ...(responderA ? { replyTo: { email: responderA } } : {}),
      subject: asunto,
      htmlContent: html,
    });
    return true;
  } catch (e) {
    console.error(`No se pudo enviar el correo "${asunto}".`, e);
    return false;
  }
}
