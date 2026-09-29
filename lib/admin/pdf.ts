/*
 * PDF de cotizaciones y órdenes de pedido, armado en el navegador con jsPDF
 * según el modelo del cliente. Ambos documentos comparten el mismo formato:
 * encabezado, datos del cliente, detalles, canastas con sus productos,
 * totales, notas, condiciones y firmas.
 * Se importa de forma dinámica para no cargar la librería hasta que se use.
 */
import type { jsPDF } from "jspdf";
import { fechaCorta, soles } from "@/lib/admin/format";
import type { ProductoCanasta } from "@/lib/admin/recetas";
import { labelEstado, type Cotizacion, type Orden, type OrdenItem } from "@/lib/admin/types";

type Marca = { nombre: string; lema: string; logo: string };
type Contacto = { telefono: string; correo: string; ciudad: string };
type Linea = OrdenItem & { envase: string; productos?: ProductoCanasta[] };

export type DatosPdfCotizacion = {
  cotizacion: Cotizacion;
  items: Linea[];
  marca: Marca;
  contacto: Contacto;
  textos: { subtitulo: string; formaPago: string; horarioEntrega: string; condiciones: string[] };
};

export type DatosPdfOrden = {
  orden: Orden;
  items: Linea[];
  marca: Marca;
  contacto: Contacto;
  /** Datos de la cotización de origen, si la orden vino de una. */
  cotizacion: Pick<Cotizacion, "numero" | "cargo" | "asesor" | "forma_pago" | "distrito"> | null;
  textos: { subtitulo: string; condiciones: string[] };
};

type Color = [number, number, number];
const VINO: Color = [123, 30, 44];
const TINTA: Color = [36, 25, 21];
const GRIS: Color = [111, 98, 90];
const PINO: Color = [27, 58, 51];
const ORO: Color = [201, 164, 74];
const CREMA: Color = [246, 241, 231];
const LINEA: Color = [221, 212, 196];

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
  return (await cargar(url)) ?? (await cargar("/marca/mka-logo-color.webp"));
}

/* ---------- Monto en letras ---------- */

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

/* ---------- Documento comercial ---------- */

type Dato = [string, string | null | undefined];

type Documento = {
  titulo: string;
  numero: string;
  subtitulo: string;
  marca: Marca;
  contacto: Contacto;
  cliente: Dato[];
  tituloDetalles: string;
  detalles: Dato[];
  items: Linea[];
  /** Filas previas al total (el total siempre va al final, en vino). */
  totales: [string, number][];
  total: number;
  etiquetaTotal: string;
  notas: string[];
  condiciones: string[];
  autorizado: string | null;
  firmas: [string, string];
  archivo: string;
  /** Franja de estado para producción (solo en la orden de pedido). */
  estado?: { pagado: boolean; pedido: string; entrega: string };
};

const nombreArchivo = (prefijo: string, numero: string, cliente: string) => {
  const limpio = cliente.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${prefijo}-${numero}${limpio ? `-${limpio}` : ""}.pdf`;
};

async function documentoComercial(d: Documento) {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([import("jspdf"), import("jspdf-autotable"), logoPng(d.marca.logo)]);
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
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...TINTA).text(d.marca.nombre.toUpperCase(), M + col * 1.5, 23, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS).text(d.marca.lema, M + col * 1.5, 28.5, { align: "center" });
  doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...VINO).text(d.subtitulo, M + col * 1.5, 35, { align: "center" });
  doc.setFillColor(...VINO).rect(M + col * 2, 12, col, altoCab, "F");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255).text(d.titulo, M + col * 2.5, 24.5, { align: "center" });
  doc.setFontSize(13).text(d.numero, M + col * 2.5, 32, { align: "center" });

  let y = 12 + altoCab + 8;

  // Franja de estado: el pago salta a la vista para el área de producción.
  if (d.estado) {
    const alto = 13;
    const colorPago: Color = d.estado.pagado ? [29, 107, 69] : [161, 44, 44];
    const anchoPago = 70;
    doc.setFillColor(...colorPago).rect(W - M - anchoPago, y, anchoPago, alto, "F");
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(255, 255, 255);
    doc.text(d.estado.pagado ? "PAGADO" : "PAGO PENDIENTE", W - M - anchoPago / 2, y + 8.6, { align: "center" });
    doc.setFillColor(...CREMA).rect(M, y, ancho - anchoPago - 3, alto, "F");
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GRIS).text("ESTADO DEL PEDIDO", M + 4.5, y + 5);
    doc.text("ENTREGA", M + 60, y + 5);
    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...TINTA).text(d.estado.pedido, M + 4.5, y + 10.2);
    doc.text(d.estado.entrega, M + 60, y + 10.2);
    y += alto + 7;
  }

  const barra = (titulo: string) => {
    if (y > H - 40) { doc.addPage(); y = 20; }
    doc.setFillColor(...PINO).rect(M, y, ancho, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(255, 255, 255).text(titulo, M + 4.5, y + 5.4);
    y += 11;
  };
  const cuadricula = (datos: Dato[]) => {
    const filas: string[][] = [];
    for (let i = 0; i < datos.length; i += 2) {
      const [a, b] = datos[i];
      const [c, e] = datos[i + 1] ?? ["", ""];
      filas.push([a, b || "—", c, c ? e || "—" : ""]);
    }
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: base,
      body: filas,
      columnStyles: {
        0: { fillColor: CREMA, cellWidth: 40, textColor: GRIS },
        1: { cellWidth: ancho / 2 - 40 },
        2: { fillColor: CREMA, cellWidth: 40, textColor: GRIS },
      },
    });
    y = finY() + 9;
  };

  barra("DATOS DEL CLIENTE");
  cuadricula(d.cliente);
  barra(d.tituloDetalles);
  cuadricula(d.detalles);

  // Cada canasta con su tabla de productos.
  d.items.forEach((it, i) => {
    if (y > H - 60) { doc.addPage(); y = 20; }
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { ...base, fontSize: 9.5 },
      headStyles: { fillColor: PINO, textColor: 255, fontStyle: "bold", halign: "center" },
      head: [[d.items.length > 1 ? `${i + 1}. TIPO DE CANASTA / BOX` : "TIPO DE CANASTA / BOX", "TIPO DE ENVASE", "CANTIDAD", "PRECIO UNIT.", "TOTAL"]],
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

  // Totales.
  if (y > H - 55) { doc.addPage(); y = 20; }
  const filasTotal = [...d.totales.map(([k, v]) => [k, soles(v)]), [d.etiquetaTotal, soles(d.total)]];
  autoTable(doc, {
    startY: y,
    margin: { left: M + ancho / 2, right: M },
    theme: "grid",
    styles: { ...base, fontSize: 10 },
    body: filasTotal,
    columnStyles: { 0: { fontStyle: "bold", fillColor: CREMA }, 1: { halign: "right" } },
    didParseCell: (c) => {
      if (c.row.index === filasTotal.length - 1) {
        c.cell.styles.fillColor = VINO;
        c.cell.styles.textColor = 255;
        c.cell.styles.fontStyle = "bold";
        c.cell.styles.fontSize = 11;
      }
    },
  });
  y = finY() + 6;
  doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(...GRIS);
  doc.text(`Son: ${montoEnLetras(d.total)}.`, W - M, y, { align: "right" });
  y += 8;

  // Notas, sin recuadro.
  if (d.notas.length) {
    doc.setFont("helvetica", "normal").setFontSize(8.8).setTextColor(...TINTA);
    for (const n of d.notas) {
      const lineas = doc.splitTextToSize(n, ancho);
      if (y + lineas.length * 4.5 > H - 25) { doc.addPage(); y = 20; }
      doc.text(lineas, M, y);
      y += lineas.length * 4.5 + 1.5;
    }
    y += 5;
  }

  if (d.condiciones.length) {
    barra("CONDICIONES Y OBSERVACIONES");
    autoTable(doc, {
      startY: y - 3,
      margin: { left: M, right: M },
      theme: "plain",
      styles: { ...base, fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 5, right: 5 } },
      body: d.condiciones.map((t) => [`•  ${t}`]),
      tableLineColor: LINEA,
      tableLineWidth: 0.2,
    });
    y = finY() + 10;
  }

  // Firmas.
  if (y > H - 45) { doc.addPage(); y = 25; }
  if (d.autorizado) doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...TINTA).text(`Autorizado por: ${d.autorizado}`, M, y);
  const yFirma = y + 24;
  doc.setDrawColor(...TINTA).setLineWidth(0.3);
  doc.line(M + 10, yFirma, M + 75, yFirma);
  doc.line(W - M - 75, yFirma, W - M - 10, yFirma);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS);
  doc.text(d.firmas[0], M + 42.5, yFirma + 5, { align: "center" });
  doc.text(d.firmas[1], W - M - 42.5, yFirma + 5, { align: "center" });

  // Pie de página en todas las hojas.
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINEA).setLineWidth(0.3).line(M, H - 14, W - M, H - 14);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...GRIS);
    doc.text([d.marca.nombre, d.contacto.telefono, d.contacto.correo, d.contacto.ciudad].filter(Boolean).join("  ·  "), M, H - 9);
    doc.text(`${d.numero} · Página ${p} de ${paginas}`, W - M, H - 9, { align: "right" });
  }

  return { doc, nombre: d.archivo };
}

/** Desglose de un total con IGV incluido. */
const conIgv = (total: number) => {
  const valor = Math.round((total / 1.18) * 100) / 100;
  return { valor, igv: Math.round((total - valor) * 100) / 100 };
};

export async function pdfCotizacion({ cotizacion: c, items, marca, contacto, textos }: DatosPdfCotizacion) {
  const total = items.reduce((s, it) => s + Number(it.subtotal), 0);
  const unidades = items.reduce((s, it) => s + it.cantidad, 0);
  const { valor, igv } = conIgv(total);
  return documentoComercial({
    titulo: "COTIZACIÓN COMERCIAL",
    numero: c.numero,
    subtitulo: textos.subtitulo,
    marca,
    contacto,
    cliente: [
      ["Empresa / Razón social", c.empresa], ["RUC", c.ruc],
      ["Contacto", c.contacto], ["Cargo", c.cargo],
      ["Teléfono / WhatsApp", c.telefono], ["Correo", c.email],
      ["Dirección de entrega", c.lugar_entrega], ["Ciudad / Distrito", c.distrito],
    ],
    tituloDetalles: "DETALLES DE LA COTIZACIÓN",
    detalles: [
      ["Fecha", fechaCorta(new Date().toISOString())], ["Vigencia", c.valida_hasta ? `Hasta el ${fechaCorta(c.valida_hasta)}` : null],
      ["Asesor comercial", c.asesor], ["Forma de pago", c.forma_pago || textos.formaPago],
      ["Fecha de entrega", c.fecha_requerida ? fechaCorta(c.fecha_requerida) : "Por coordinar"], ["Horario de entrega", c.horario_entrega || textos.horarioEntrega],
    ],
    items,
    totales: [["SUBTOTAL", valor], ["IGV (18 %)", igv]],
    total,
    etiquetaTotal: `TOTAL${unidades ? ` · ${unidades} canastas` : ""}`,
    notas: [],
    condiciones: textos.condiciones,
    autorizado: c.asesor || marca.nombre,
    firmas: ["Firma del cliente", `Firma del proveedor · ${marca.nombre}`],
    archivo: nombreArchivo("Cotizacion", c.numero, c.empresa),
  });
}

export async function pdfOrden({ orden: o, items, marca, contacto, cotizacion, textos }: DatosPdfOrden) {
  const factura = o.comprobante_tipo === "factura";
  const unidades = items.reduce((s, it) => s + it.cantidad, 0);
  const total = Number(o.total);
  const { valor, igv } = conIgv(total);
  const recibe = o.recibe_nombre ? `${o.recibe_nombre}${o.recibe_telefono ? ` · ${o.recibe_telefono}` : ""}` : null;
  const direccion = [o.direccion, o.referencia ? `Ref.: ${o.referencia}` : null].filter(Boolean).join(" · ");

  return documentoComercial({
    titulo: "ORDEN DE PEDIDO",
    numero: o.numero,
    subtitulo: textos.subtitulo,
    marca,
    contacto,
    cliente: [
      [factura ? "Razón social" : "Nombre", o.comprobante_nombre || o.cliente_nombre], [factura ? "RUC" : "DNI", o.comprobante_documento],
      // Las órdenes que vienen de una cotización guardan "Contacto · Empresa".
      ["Contacto", cotizacion ? o.cliente_nombre.split(" · ")[0] : o.cliente_nombre], ["Cargo", cotizacion?.cargo],
      ["Teléfono / WhatsApp", o.cliente_telefono], ["Correo", o.cliente_email],
      ["Dirección de entrega", direccion], ["Ciudad / Distrito", o.distrito || cotizacion?.distrito],
      ...(factura && o.direccion_fiscal ? ([["Dirección fiscal", o.direccion_fiscal]] as Dato[]) : []),
    ],
    tituloDetalles: "DETALLES DE LA ORDEN DE PEDIDO",
    detalles: [
      ["Fecha", fechaCorta(o.created_at)], ["Fecha de entrega", o.fecha_entrega ? fechaCorta(o.fecha_entrega) : "Por coordinar"],
      ["Asesor comercial", cotizacion?.asesor], ["Horario de entrega", o.horario],
      ["Forma de pago", o.metodo_pago || cotizacion?.forma_pago], ["Estado de pago", o.estado_pago === "pagado" ? "Pagado" : "Pendiente"],
      ["Comprobante", factura ? "Factura" : "Boleta"], ["Recibe", recibe],
      ...(cotizacion ? ([["Cotización", cotizacion.numero]] as Dato[]) : []),
    ],
    items,
    totales: [
      ["Canastas", Number(o.subtotal)],
      ...(Number(o.delivery) > 0 ? ([["Delivery", Number(o.delivery)]] as [string, number][]) : []),
      ["Valor de venta (sin IGV)", valor],
      ["IGV (18 %)", igv],
    ],
    total,
    etiquetaTotal: `TOTAL${unidades ? ` · ${unidades} canastas` : ""}`,
    notas: [
      `* Se emitirá ${factura ? "factura" : "boleta"} con los datos colocados en esta orden de pedido.`,
      ...(o.dedicatoria ? [`Dedicatoria para la tarjeta: “${o.dedicatoria}”`] : []),
    ],
    condiciones: textos.condiciones,
    autorizado: cotizacion?.asesor || marca.nombre,
    firmas: ["Recibí conforme · cliente", `Entregado por · ${marca.nombre}`],
    estado: {
      pagado: o.estado_pago === "pagado",
      pedido: labelEstado(o.estado),
      entrega: [o.fecha_entrega ? fechaCorta(o.fecha_entrega) : "Por coordinar", o.horario?.split(" · ").pop()].filter(Boolean).join(" · "),
    },
    archivo: nombreArchivo("Orden", o.numero, o.comprobante_nombre || o.cliente_nombre),
  });
}
