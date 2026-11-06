import type { SupabaseClient } from "@supabase/supabase-js";
import { enviarCorreo } from "@/lib/brevo";
import { fechaReparto } from "@/lib/entrega";
import { formatPrice } from "@/lib/mock-data";

/*
 * Correos de la tienda (por Brevo): confirmación de pedido, cambios de estado
 * para el cliente y avisos de pedidos y cotizaciones nuevas para el negocio.
 */

export type LineaCorreo = { nombre: string; detalle?: string | null; cantidad: number; subtotal: number };
export type PedidoCorreo = {
  numero: string;
  nombre: string;
  email: string | null;
  telefono?: string | null;
  total: number;
  delivery?: number;
  fechaEntrega?: string | null;
  distrito?: string | null;
  metodoPago?: string | null;
  lineas: LineaCorreo[];
};
export type CambioPedido = "pagado" | "preparacion" | "entregada";

const sitio = () => (process.env.SITIO_URL?.trim() || "https://mkacanastas.com").replace(/\/+$/, "");
const correoNegocio = () => process.env.AVISOS_CORREO?.trim() || "";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fecha = (iso?: string | null) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? fechaReparto(iso.slice(0, 10)) : "");
const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? "";
const enlaceSeguimiento = (numero: string) => `${sitio()}/seguimiento?pedido=${encodeURIComponent(numero)}`;

/** Plantilla de marca: cabecera vino, contenido y pie con el sitio. */
function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#fbf6ee;font-family:Arial,Helvetica,sans-serif;color:#2a1a17">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ee;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #eadfcd;border-radius:16px;overflow:hidden">
<tr><td style="background:#7b1e2c;padding:20px 28px;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:.5px">MKA <span style="font-weight:normal;font-size:14px;color:#e8c98a">Canastas Navideñas &amp; Regalos</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:22px;color:#7b1e2c">${esc(titulo)}</h1>
${cuerpo}
${boton ? `<p style="margin:26px 0 6px"><a href="${esc(boton.url)}" style="display:inline-block;background:#7b1e2c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:99px;font-weight:bold">${esc(boton.texto)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 28px;background:#f3e8d6;font-size:12px;color:#75655a">MKA Canastas Navideñas y Regalos · <a href="${esc(sitio())}" style="color:#7b1e2c">${esc(sitio().replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const parrafo = (html: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">${html}</p>`;

function tablaPedido(p: PedidoCorreo) {
  const filas = p.lineas
    .map((l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0e6d6;font-size:14px"><b>${esc(l.cantidad)} × ${esc(l.nombre)}</b>${l.detalle ? `<br><span style="color:#75655a;font-size:12px">${esc(l.detalle)}</span>` : ""}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #f0e6d6;font-size:14px;white-space:nowrap">${esc(formatPrice(l.subtotal))}</td></tr>`)
    .join("");
  const extra = [
    p.delivery != null ? `<tr><td style="padding:6px 0;font-size:13px;color:#75655a">Delivery${p.distrito ? ` · ${esc(p.distrito)}` : ""}</td><td align="right" style="font-size:13px">${esc(formatPrice(p.delivery))}</td></tr>` : "",
    `<tr><td style="padding:10px 0;font-size:16px"><b>Total</b></td><td align="right" style="font-size:18px;color:#7b1e2c"><b>${esc(formatPrice(p.total))}</b></td></tr>`,
  ].join("");
  const datos = [
    fecha(p.fechaEntrega) && `<b>Entrega:</b> ${esc(fecha(p.fechaEntrega))}`,
    p.metodoPago && `<b>Pago:</b> ${esc(p.metodoPago)}`,
  ].filter(Boolean).join("<br>");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 14px">${filas}${extra}</table>${datos ? parrafo(datos) : ""}`;
}

/** Al registrar un pedido: confirmación al cliente y aviso al negocio. */
export async function notificarPedidoRegistrado(p: PedidoCorreo) {
  const tareas: Promise<unknown>[] = [];
  if (p.email) {
    tareas.push(enviarCorreo({
      para: p.email,
      nombre: p.nombre,
      asunto: `Recibimos tu pedido ${p.numero}`,
      responderA: correoNegocio() || undefined,
      html: plantilla(
        `¡Gracias por tu pedido, ${primerNombre(p.nombre)}!`,
        parrafo(`Registramos tu pedido <b>${esc(p.numero)}</b>. Te avisaremos por este medio cuando confirmemos el pago y cuando empecemos a preparar tus canastas.`) + tablaPedido(p),
        { texto: "Seguir mi pedido", url: enlaceSeguimiento(p.numero) },
      ),
    }));
  }
  if (correoNegocio()) {
    tareas.push(enviarCorreo({
      para: correoNegocio(),
      asunto: `Nuevo pedido ${p.numero} · ${formatPrice(p.total)}`,
      responderA: p.email || undefined,
      html: plantilla(
        `Nuevo pedido ${p.numero}`,
        parrafo(`<b>Cliente:</b> ${esc(p.nombre)}${p.email ? `<br><b>Correo:</b> ${esc(p.email)}` : ""}${p.telefono ? `<br><b>Celular:</b> ${esc(p.telefono)}` : ""}`) + tablaPedido(p),
        { texto: "Ver en el panel", url: `${sitio()}/admin/ordenes` },
      ),
    }));
  }
  await Promise.all(tareas);
}

const TEXTO_CAMBIO: Record<CambioPedido, { asunto: string; titulo: string; texto: string }> = {
  pagado: { asunto: "Confirmamos el pago de tu pedido", titulo: "¡Pago confirmado!", texto: "Recibimos el pago de tu pedido <b>{n}</b>. Ya lo pasamos a preparación." },
  preparacion: { asunto: "Estamos preparando tu pedido", titulo: "Tus canastas están en preparación", texto: "Empezamos a armar a mano las canastas de tu pedido <b>{n}</b>." },
  entregada: { asunto: "Tu pedido fue entregado", titulo: "¡Pedido entregado!", texto: "Tu pedido <b>{n}</b> fue entregado. Gracias por confiar en MKA; esperamos que lo disfruten." },
};

/** Avisa al cliente un cambio de su pedido (pago confirmado, en preparación o entregado). */
export async function notificarCambioPedido(p: PedidoCorreo, cambio: CambioPedido) {
  if (!p.email) return;
  const t = TEXTO_CAMBIO[cambio];
  const entrega = cambio !== "entregada" && fecha(p.fechaEntrega) ? parrafo(`<b>Entrega programada:</b> ${esc(fecha(p.fechaEntrega))}`) : "";
  await enviarCorreo({
    para: p.email,
    nombre: p.nombre,
    asunto: `${t.asunto} ${p.numero}`,
    responderA: correoNegocio() || undefined,
    html: plantilla(
      t.titulo,
      parrafo(`Hola, ${esc(primerNombre(p.nombre))}.`) + parrafo(t.texto.replace("{n}", esc(p.numero))) + entrega,
      { texto: "Seguir mi pedido", url: enlaceSeguimiento(p.numero) },
    ),
  });
}

/** Qué cambios de una orden merecen correo al cliente. */
export function cambiosNotificables(antes: { estado: string; estado_pago: string }, despues: { estado: string; estado_pago: string }): CambioPedido[] {
  const cambios: CambioPedido[] = [];
  if (antes.estado_pago !== "pagado" && despues.estado_pago === "pagado") cambios.push("pagado");
  if (antes.estado !== "preparacion" && despues.estado === "preparacion") cambios.push("preparacion");
  if (antes.estado !== "entregada" && despues.estado === "entregada") cambios.push("entregada");
  // Si en un solo paso se pagó y se puso en preparación, basta un correo: el de pago ya lo dice.
  return cambios.includes("pagado") ? cambios.filter((c) => c !== "preparacion") : cambios;
}

/** Arma los datos del correo a partir de una orden guardada. */
export async function pedidoDesdeOrden(supabase: SupabaseClient, ordenId: string): Promise<PedidoCorreo | null> {
  const [{ data: o }, { data: items }, { data: envases }] = await Promise.all([
    supabase.from("ordenes").select("numero,cliente_nombre,cliente_email,cliente_telefono,total,delivery,fecha_entrega,distrito,metodo_pago").eq("id", ordenId).maybeSingle(),
    supabase.from("orden_items").select("canasta_nombre,envase_id,cantidad,subtotal").eq("orden_id", ordenId),
    supabase.from("envases").select("id,nombre"),
  ]);
  if (!o) return null;
  const envase = new Map(((envases ?? []) as { id: string; nombre: string }[]).map((e) => [e.id, e.nombre]));
  return {
    numero: o.numero,
    nombre: o.cliente_nombre,
    email: o.cliente_email,
    telefono: o.cliente_telefono,
    total: Number(o.total),
    delivery: Number(o.delivery),
    fechaEntrega: o.fecha_entrega,
    distrito: o.distrito,
    metodoPago: o.metodo_pago,
    lineas: ((items ?? []) as { canasta_nombre: string; envase_id: string | null; cantidad: number; subtotal: number }[]).map((i) => ({
      nombre: i.canasta_nombre,
      detalle: i.envase_id ? envase.get(i.envase_id) ?? null : null,
      cantidad: i.cantidad,
      subtotal: Number(i.subtotal),
    })),
  };
}

export type CotizacionCorreo = { numero?: string; empresa: string; ruc?: string; contacto: string; email?: string; telefono?: string; cantidad?: string; fecha?: string; distrito?: string; requerimientos?: string };

/** Aviso al negocio de una cotización nueva. */
export async function notificarCotizacion(c: CotizacionCorreo) {
  if (!correoNegocio()) return;
  const filas = [
    ["Empresa", c.empresa], ["RUC", c.ruc], ["Contacto", c.contacto], ["Correo", c.email], ["Celular", c.telefono],
    ["Cantidad estimada", c.cantidad], ["Fecha requerida", fecha(c.fecha)], ["Distrito", c.distrito], ["Requerimientos", c.requerimientos],
  ].filter(([, v]) => v).map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`).join("<br>");
  await enviarCorreo({
    para: correoNegocio(),
    asunto: `Nueva cotización${c.numero ? ` ${c.numero}` : ""} · ${c.empresa}`,
    responderA: c.email || undefined,
    html: plantilla(`Nueva solicitud de cotización${c.numero ? ` ${c.numero}` : ""}`, parrafo(filas), { texto: "Ver en el panel", url: `${sitio()}/admin/cotizaciones` }),
  });
}
