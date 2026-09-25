/*
 * PDF de órdenes y cotizaciones, armado en el navegador con jsPDF.
 * Se importa de forma dinámica para no cargar la librería hasta que se use.
 */
import type { jsPDF } from "jspdf";
import { fecha, fechaCorta, soles } from "@/lib/admin/format";
import { labelCanal, labelEstado, type Cotizacion, type Orden, type OrdenItem } from "@/lib/admin/types";

type Marca = { nombre: string; lema: string };
type Contacto = { telefono: string; correo: string };
type Linea = OrdenItem & { envase: string; productos?: string[] };

export type DatosPdfOrden = { orden: Orden; items: Linea[]; marca: Marca; contacto: Contacto };
export type DatosPdfCotizacion = { cotizacion: Cotizacion; items: Linea[]; marca: Marca; contacto: Contacto };

const VINO: [number, number, number] = [123, 30, 44];
const TINTA: [number, number, number] = [36, 25, 21];
const GRIS: [number, number, number] = [111, 98, 90];

async function logo(): Promise<string | null> {
  try {
    const r = await fetch("/marca/mka-icono.png");
    const b = await r.blob();
    return await new Promise((ok) => {
      const fr = new FileReader();
      fr.onload = () => ok(String(fr.result));
      fr.onerror = () => ok(null);
      fr.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}

async function nuevoDocumento(marca: Marca, contacto: Contacto, titulo: string, numero: string, sub: string) {
  const [{ jsPDF }, { default: autoTable }, img] = await Promise.all([import("jspdf"), import("jspdf-autotable"), logo()]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();

  if (img) doc.addImage(img, "PNG", 15, 12, 18, 18);
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...VINO).text(marca.nombre, 37, 19);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GRIS).text(marca.lema, 37, 24);
  doc.text([contacto.telefono, contacto.correo].filter(Boolean).join(" · "), 37, 29);

  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...TINTA).text(titulo, ancho - 15, 18, { align: "right" });
  doc.setFontSize(12).setTextColor(...VINO).text(numero, ancho - 15, 25, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GRIS).text(sub, ancho - 15, 30, { align: "right" });

  doc.setDrawColor(...VINO).setLineWidth(0.6).line(15, 35, ancho - 15, 35);
  return { doc, autoTable, ancho, y: 43 };
}

/** Bloque de datos en dos columnas; devuelve la nueva altura. */
function seccion(doc: jsPDF, titulo: string, datos: [string, string | null | undefined][], y: number, ancho: number) {
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...VINO).text(titulo, 15, y);
  y += 6;
  const col = (ancho - 30) / 2;
  const filas = datos.filter(([, v]) => v);
  filas.forEach(([k, v], i) => {
    const x = 15 + (i % 2) * col;
    const yy = y + Math.floor(i / 2) * 10;
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GRIS).text(k, x, yy);
    doc.setFontSize(10).setTextColor(...TINTA).text(doc.splitTextToSize(String(v), col - 4)[0], x, yy + 4.5);
  });
  return y + Math.ceil(filas.length / 2) * 10 + 3;
}

function tablaCanastas(
  doc: jsPDF,
  autoTable: typeof import("jspdf-autotable").default,
  items: Linea[],
  y: number,
  pie: [string, string][],
) {
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...VINO).text("Detalle de canasta", 15, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: 15, right: 15 },
    head: [["Tipo de canasta", "Envase", "Cantidad", "Precio unid.", "Subtotal"]],
    body: items.map((it) => [it.productos?.length ? `${it.producto_nombre}
${it.productos.join(", ")}` : it.producto_nombre, it.envase, String(it.cantidad), soles(it.precio_unitario), soles(it.subtotal)]),
    foot: pie.map(([k, v]) => [{ content: k, colSpan: 4 }, v]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9.5, textColor: TINTA, lineColor: [231, 221, 205], cellPadding: 2.5 },
    headStyles: { fillColor: VINO, textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [250, 246, 239], textColor: TINTA, fontStyle: "bold" },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    didParseCell: (d) => {
      if (d.section !== "body" && d.column.index >= 2) d.cell.styles.halign = "right";
    },
  });
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

export async function pdfOrden({ orden: o, items, marca, contacto }: DatosPdfOrden) {
  const { doc, autoTable, ancho, y: y0 } = await nuevoDocumento(marca, contacto, "Orden de pedido", o.numero, `Creada el ${fechaCorta(o.created_at)} · ${labelCanal(o.canal)}`);
  let y = seccion(doc, "Datos del cliente", [
    ["Cliente", o.cliente_nombre],
    ["Correo", o.cliente_email],
    ["Celular", o.cliente_telefono],
    ["Comprobante", o.comprobante_tipo === "factura" ? "Factura" : "Boleta"],
    [o.comprobante_tipo === "factura" ? "RUC" : "DNI", o.comprobante_documento],
    [o.comprobante_tipo === "factura" ? "Razón social" : "Nombre", o.comprobante_nombre],
  ], y0, ancho);
  y = seccion(doc, "Detalles de entrega", [
    ["Fecha de entrega", o.fecha_entrega ? fecha(o.fecha_entrega) : null],
    ["Horario", o.horario],
    ["Distrito", o.distrito],
    ["Dirección", o.direccion],
    ["Referencia", o.referencia],
    ["Recibe", o.recibe_nombre ? `${o.recibe_nombre}${o.recibe_telefono ? ` · ${o.recibe_telefono}` : ""}` : null],
  ], y, ancho);
  y = tablaCanastas(doc, autoTable, items, y, [
    ["Subtotal", soles(o.subtotal)],
    ["Delivery", soles(o.delivery)],
    ["Total", soles(o.total)],
  ]);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GRIS);
  doc.text(`Estado: ${labelEstado(o.estado)} · Pago: ${o.estado_pago === "pagado" ? "Pagado" : "Pendiente"}${o.metodo_pago ? ` (${o.metodo_pago})` : ""}`, 15, y);
  if (o.dedicatoria) doc.text(doc.splitTextToSize(`Dedicatoria: “${o.dedicatoria}”`, ancho - 30), 15, y + 6);
  return { doc, nombre: `${o.numero}.pdf` };
}

export async function pdfCotizacion({ cotizacion: c, items, marca, contacto }: DatosPdfCotizacion) {
  const { doc, autoTable, ancho, y: y0 } = await nuevoDocumento(marca, contacto, "Cotización", c.numero, `Emitida el ${fechaCorta(new Date().toISOString())}${c.valida_hasta ? ` · válida hasta ${fechaCorta(c.valida_hasta)}` : ""}`);
  let y = seccion(doc, "Datos del cliente", [
    ["Cliente / Empresa", c.empresa],
    ["RUC", c.ruc],
    ["Contacto", c.cargo ? `${c.contacto} · ${c.cargo}` : c.contacto],
    ["Correo", c.email],
    ["Celular", c.telefono],
  ], y0, ancho);
  y = seccion(doc, "Detalles de entrega", [
    ["Fecha requerida", c.fecha_requerida ? fecha(c.fecha_requerida) : null],
    ["Dirección de entrega", c.lugar_entrega],
    ["Personalización", c.personalizacion.length ? c.personalizacion.join(", ") : null],
  ], y, ancho);
  const cantidad = items.reduce((s, it) => s + it.cantidad, 0);
  const total = items.reduce((s, it) => s + Number(it.subtotal), 0);
  y = tablaCanastas(doc, autoTable, items, y, [["Total" + (cantidad ? ` (${cantidad} canastas)` : ""), soles(total)]]);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GRIS);
  doc.text(doc.splitTextToSize("Precios incluyen IGV. El delivery se coordina según la dirección de entrega. Para confirmar el pedido, responde a este mensaje o escríbenos.", ancho - 30), 15, y);
  return { doc, nombre: `${c.numero}.pdf` };
}
