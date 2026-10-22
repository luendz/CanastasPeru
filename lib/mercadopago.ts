import { headers } from "next/headers";

/*
 * Mercado Pago (Checkout Pro) con su API REST, sin SDK: funciona igual en
 * Node y en Cloudflare Workers. Solo se usa en el servidor; el access token
 * y la clave del webhook son secretos del Worker, nunca NEXT_PUBLIC_*.
 */

const API = "https://api.mercadopago.com";

/** Valor de la columna "Pasarela" de un método de pago que cobra con Mercado Pago. */
export const PASARELA_MP = "mercadopago";

const token = () => process.env.MP_ACCESS_TOKEN ?? "";

/** Sin access token, los métodos marcados con Mercado Pago se comportan como manuales. */
export const mercadoPagoConfigurado = () => Boolean(token());

/**
 * MP_MODO_PRUEBA=1 mientras se usan credenciales de prueba: no se envía el
 * correo del cliente, porque un correo real junto a un vendedor de prueba hace
 * fallar el pago ("una de las partes es de prueba").
 */
const modoPrueba = () => ["1", "true", "si", "sí"].includes((process.env.MP_MODO_PRUEBA ?? "").trim().toLowerCase());

/** URL pública del sitio: SITIO_URL si está definida o, si no, la del pedido actual. */
export async function urlSitio() {
  const fija = process.env.SITIO_URL?.replace(/\/+$/, "");
  if (fija) return fija;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function api<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status} en ${ruta}: ${(await res.text()).slice(0, 300)}`);
  return res.json() as Promise<T>;
}

type Preferencia = { numero: string; total: number; email?: string; nombre?: string };

/**
 * Crea la preferencia de pago de una orden y devuelve la URL de Mercado Pago
 * a la que se lleva al cliente. Se cobra el total que calculó la base, como
 * una sola línea, para que coincida siempre con la orden.
 */
export async function crearPreferencia({ numero, total, email, nombre }: Preferencia): Promise<string> {
  const sitio = await urlSitio();
  const vuelta = `${sitio}/confirmacion?pedido=${encodeURIComponent(numero)}`;
  const publica = !/^http:\/\/(localhost|127\.0\.0\.1)/.test(sitio);
  const pref = await api<{ init_point: string }>("/checkout/preferences", {
    method: "POST",
    headers: { "X-Idempotency-Key": `${numero}-${Date.now()}` },
    body: JSON.stringify({
      items: [{ id: numero, title: `Pedido ${numero} · MKA Canastas`, quantity: 1, unit_price: Math.round(total * 100) / 100, currency_id: "PEN" }],
      // Los datos del comprador ayudan al antifraude de Mercado Pago y le ahorran escribirlos.
      payer: { name: nombre || undefined, email: (!modoPrueba() && email) || undefined },
      external_reference: numero,
      back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
      // Mercado Pago solo acepta auto_return y notificaciones con URLs públicas.
      auto_return: publica ? "approved" : undefined,
      notification_url: publica ? `${sitio}/api/mercadopago/webhook` : undefined,
      statement_descriptor: "MKA CANASTAS",
    }),
  });
  return pref.init_point;
}

export type PagoMP = {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
};

/** Consulta un pago en la API: la única fuente confiable de su estado. */
export const obtenerPago = (id: string) => api<PagoMP>(`/v1/payments/${encodeURIComponent(id)}`);

/**
 * Valida la firma x-signature de una notificación (HMAC-SHA256 con la clave
 * secreta del webhook, según la documentación de Mercado Pago).
 */
export async function firmaValida({ firma, requestId, dataId }: { firma: string | null; requestId: string | null; dataId: string }) {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto || !firma) return false;
  const partes = Object.fromEntries(firma.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  if (!partes.ts || !partes.v1) return false;

  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifiesto = `${id ? `id:${id};` : ""}${requestId ? `request-id:${requestId};` : ""}ts:${partes.ts};`;
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(manifiesto)));
  const calculada = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  // Comparación en tiempo constante.
  if (calculada.length !== partes.v1.length) return false;
  let dif = 0;
  for (let i = 0; i < calculada.length; i++) dif |= calculada.charCodeAt(i) ^ partes.v1.charCodeAt(i);
  return dif === 0;
}
