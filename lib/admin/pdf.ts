/*
 * PDF de órdenes y cotizaciones, armado en el navegador con jsPDF.
 * Se importa de forma dinámica para no cargar la librería hasta que se use.
 */
import type { jsPDF } from "jspdf";
import { fecha, fechaCorta, soles } from "@/lib/admin/format";
import { etiquetaProducto, type ProductoCanasta } from "@/lib/admin/recetas";
import { labelCanal, labelEstado, type Cotizacion, type Orden, type OrdenItem } from "@/lib/admin/types";

type Marca = { nombre: string; lema: string };
type Contacto = { telefono: string; correo: string };
type Linea = OrdenItem & { envase: string; productos?: ProductoCanasta[] };

export type DatosPdfOrden = { orden: Orden; items: Linea[]; marca: Marca; contacto: Contacto };
export type DatosPdfCotizacion = {
  cotizacion: Cotizacion;
  items: Linea[];
  marca: Marca & { logo: string };
  contacto: Contacto & { ciudad: string };
  textos: { subtitulo: string; formaPago: string; horarioEntrega: string; condiciones: string[] };
};

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
${it.productos.map(etiquetaProducto).join(", ")}` : it.producto_nombre, it.envase, String(it.cantidad), soles(it.precio_unitario), soles(it.subtotal)]),
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


/* ------------------------------------------------------------------------
 * Cotización comercial (según el modelo del cliente, con sus mejoras)
 * ---------------------------------------------------------------------- */

const PINO: [number, number, number] = [27, 58, 51];
const ORO: [number, number, number] = [201, 164, 74];
const CREMA: [number, number, number] = [246, 241, 231];
const LINEA: [number, number, number] = [221, 212, 196];

/** Logo de la marca en PNG (convierte WebP/JPG con un canvas); si falla, el ícono. */
async function logoPng(url: string): Promise<{ data: string; ancho: number; alto: number } | null> {
  const cargar = (src: string) =>
    new Promise<{ data: string; ancho: number; alto: number } | null>((ok) => {
      if (typeof Image === "undefined") return ok(src.startsWith("data:image/png") ? { data: src, ancho: 1, alto: 1 } : null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          // Se reduce a 360 px como máximo: nítido impreso y liviano en el PDF.
          const escala = Math.min(1, 360 / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement("canvas");
          c.width = Math.round(img.naturalWidth * escala);
          c.height = Math.round(img.naturalHeight * escala);
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          ok({ data: c.toDataURL("image/png"), ancho: c.width, alto: c.height });
        } catch {
          ok(null);
        }
      };
      img.onerror = () => ok(null);
      img.src = src;
    });
  return (await cargar(url)) ?? (await cargar("/marca/mka-icono.png"));
}

const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function letrasMenorMil(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const resto = r < 30 ? UNIDADES[r] : `${DECENAS[Math.floor(r / 10)]}${r % 10 ? ` y ${UNIDADES[r % 10]}` : ""}`;
  return [CENTENAS[c], resto].filter(Boolean).join(" ");
}

/** 419.5 → "Cuatrocientos diecinueve con 50/100 soles". */
export function montoEnLetras(monto: number) {
  const entero = Math.floor(monto + 1e-9);
  const centimos = Math.round((monto - entero) * 100);
  const millones = Math.floor(entero / 1_000_000);
  const miles = Math.floor((entero % 1_000_000) / 1000);
  const resto = entero % 1000;
  const apocope = (t: string) => t.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
  const partes = [
    millones ? (millones === 1 ? "un millón" : `${apocope(letrasMenorMil(millones))} millones`) : "",
    miles ? (miles === 1 ? "mil" : `${apocope(letrasMenorMil(miles))} mil`) : "",
    letrasMenorMil(resto),
  ].filter(Boolean);
  const texto = partes.length ? partes.join(" ") : "cero";
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)} con ${String(centimos).padStart(2, "0")}/100 soles`;
}

export async function pdfCotizacion({ cotizacion: c, items, marca, contacto, textos }: DatosPdfCotizacion) {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([import("jspdf"), import("jspdf-autotable"), logoPng(marca.logo)]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  const ancho = W - 2 * M;
  const finY = () => (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const base = { font: "helvetica", fontSize: 9, textColor: TINTA, lineColor: LINEA, lineWidth: 0.2, cellPadding: { top: 3.2, bottom: 3.2, left: 4.5, right: 4.5 } };

  // Encabezado: logo · marca · bloque con el número.
  const altoCab = 30;
  const col = ancho / 3;
  doc.setDrawColor(...LINEA).setLineWidth(0.3).rect(M, 12, ancho, altoCab);
  doc.line(M + col, 12, M + col, 12 + altoCab);
  if (logo) {
    const escala = Math.min((col - 14) / logo.ancho, (altoCab - 8) / logo.alto);
    const w = logo.ancho * escala;
    const h = logo.alto * escala;
    doc.addImage(logo.data, "PNG", M + (col - w) / 2, 12 + (altoCab - h) / 2, w, h);
  }
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...TINTA).text(marca.nombre.toUpperCase(), M + col * 1.5, 23, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS).text(marca.lema, M + col * 1.5, 28.5, { align: "center" });
  doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...VINO).text(textos.subtitulo, M + col * 1.5, 35, { align: "center" });
  doc.setFillColor(...VINO).rect(M + col * 2, 12, col, altoCab, "F");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255).text("COTIZACIÓN COMERCIAL", M + col * 2.5, 24.5, { align: "center" });
  doc.setFontSize(13).text(c.numero, M + col * 2.5, 32, { align: "center" });

  let y = 12 + altoCab + 8;

  const barra = (titulo: string) => {
    if (y > H - 40) { doc.addPage(); y = 20; }
    doc.setFillColor(...PINO).rect(M, y, ancho, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(255, 255, 255).text(titulo, M + 4.5, y + 5.4);
    y += 11;
  };
  const datos = (filas: [string, string | null | undefined, string, string | null | undefined][]) => {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: base,
      body: filas.map(([a, b, c2, d]) => [a, b || "—", c2, d || "—"]),
      columnStyles: {
        0: { fillColor: CREMA, cellWidth: 40, textColor: GRIS },
        1: { cellWidth: ancho / 2 - 40 },
        2: { fillColor: CREMA, cellWidth: 40, textColor: GRIS },
      },
    });
    y = finY() + 9;
  };

  barra("DATOS DEL CLIENTE");
  datos([
    ["Empresa / Razón social", c.empresa, "RUC", c.ruc],
    ["Contacto", c.contacto, "Cargo", c.cargo],
    ["Teléfono / WhatsApp", c.telefono, "Correo", c.email],
    ["Dirección de entrega", c.lugar_entrega, "Ciudad / Distrito", c.distrito],
  ]);

  barra("DETALLES DE LA COTIZACIÓN");
  datos([
    ["Fecha", fechaCorta(new Date().toISOString()), "Vigencia", c.valida_hasta ? `Hasta el ${fechaCorta(c.valida_hasta)}` : null],
    ["Asesor comercial", c.asesor, "Forma de pago", c.forma_pago || textos.formaPago],
    ["Fecha de entrega", c.fecha_requerida ? fechaCorta(c.fecha_requerida) : "Por coordinar", "Horario de entrega", c.horario_entrega || textos.horarioEntrega],
  ]);

  // Cada canasta con su tabla de productos.
  items.forEach((it, i) => {
    if (y > H - 60) { doc.addPage(); y = 20; }
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { ...base, fontSize: 9.5 },
      headStyles: { fillColor: PINO, textColor: 255, fontStyle: "bold", halign: "center" },
      head: [[items.length > 1 ? `${i + 1}. TIPO DE CANASTA / BOX` : "TIPO DE CANASTA / BOX", "TIPO DE ENVASE", "CANTIDAD", "PRECIO UNIT.", "TOTAL"]],
      body: [[it.producto_nombre, it.envase, String(it.cantidad), soles(it.precio_unitario), soles(it.subtotal)]],
      columnStyles: { 0: { cellWidth: 54, fontStyle: "bold" }, 1: { cellWidth: 40 }, 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
    });
    y = finY();
    if (it.productos?.length) {
      autoTable(doc, {
        startY: y + 3,
        margin: { left: M, right: M },
        theme: "grid",
        styles: { ...base, fontSize: 8.8, cellPadding: { top: 2.4, bottom: 2.4, left: 4.5, right: 4.5 }, lineColor: [226, 206, 150] },
        headStyles: { fillColor: ORO, textColor: 255, fontStyle: "bold", halign: "center" },
        head: [["N.º", "PRODUCTO / PRESENTACIÓN", "CANT. POR CANASTA"]],
        body: it.productos.map((p, j) => [String(j + 1), p.nombre, String(p.cantidad)]),
        columnStyles: { 0: { cellWidth: 16, halign: "center" }, 2: { cellWidth: 36, halign: "center" } },
        alternateRowStyles: { fillColor: [252, 249, 241] },
      });
      y = finY();
    }
    y += 9;
  });

  // Totales (los precios incluyen IGV).
  const total = items.reduce((s, it) => s + Number(it.subtotal), 0);
  const subtotal = Math.round((total / 1.18) * 100) / 100;
  const igv = Math.round((total - subtotal) * 100) / 100;
  const unidades = items.reduce((s, it) => s + it.cantidad, 0);
  if (y > H - 50) { doc.addPage(); y = 20; }
  autoTable(doc, {
    startY: y,
    margin: { left: M + ancho / 2, right: M },
    theme: "grid",
    styles: { ...base, fontSize: 10 },
    body: [
      ["SUBTOTAL", soles(subtotal)],
      ["IGV (18 %)", soles(igv)],
      [`TOTAL${unidades ? ` · ${unidades} canastas` : ""}`, soles(total)],
    ],
    columnStyles: { 0: { fontStyle: "bold", fillColor: CREMA }, 1: { halign: "right" } },
    didParseCell: (d) => {
      if (d.row.index === 2) {
        d.cell.styles.fillColor = VINO;
        d.cell.styles.textColor = 255;
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.fontSize = 11;
      }
    },
  });
  y = finY() + 6;
  doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(...GRIS);
  doc.text(`Son: ${montoEnLetras(total)}.`, W - M, y, { align: "right" });
  y += 11;

  if (textos.condiciones.length) {
    barra("CONDICIONES Y OBSERVACIONES");
    autoTable(doc, {
      startY: y - 3,
      margin: { left: M, right: M },
      theme: "plain",
      styles: { ...base, fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 5, right: 5 } },
      body: textos.condiciones.map((t) => [`•  ${t}`]),
      tableLineColor: LINEA,
      tableLineWidth: 0.2,
    });
    y = finY() + 10;
  }

  // Firmas.
  if (y > H - 45) { doc.addPage(); y = 25; }
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...TINTA);
  doc.text(`Autorizado por: ${c.asesor || marca.nombre}`, M, y);
  const yFirma = y + 24;
  doc.setDrawColor(...TINTA).setLineWidth(0.3);
  doc.line(M + 10, yFirma, M + 75, yFirma);
  doc.line(W - M - 75, yFirma, W - M - 10, yFirma);
  doc.setFontSize(8.5).setTextColor(...GRIS);
  doc.text("Firma del cliente", M + 42.5, yFirma + 5, { align: "center" });
  doc.text(`Firma del proveedor · ${marca.nombre}`, W - M - 42.5, yFirma + 5, { align: "center" });

  // Pie de página en todas las hojas.
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINEA).setLineWidth(0.3).line(M, H - 14, W - M, H - 14);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...GRIS);
    doc.text([marca.nombre, contacto.telefono, contacto.correo, contacto.ciudad].filter(Boolean).join("  ·  "), M, H - 9);
    doc.text(`${c.numero} · Página ${p} de ${paginas}`, W - M, H - 9, { align: "right" });
  }

  const empresa = c.empresa.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return { doc, nombre: `Cotizacion-${c.numero}${empresa ? `-${empresa}` : ""}.pdf` };
}
