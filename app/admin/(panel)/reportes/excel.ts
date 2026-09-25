import type { Workbook, Worksheet } from "exceljs";
import { labelCanal, labelEstado } from "@/lib/admin/types";
import type { DatosReporte } from "./actions";

export type TipoReporte = "canastas" | "ordenes" | "compras" | "resumen" | "completo";

const SOLES = '"S/" #,##0.00';
const VINO = "FF7B1E2C";
const CREMA = "FFF3E8D6";

/** Encabezado con estilo de marca, filtros y primera fila fija. */
function prepararHoja(ws: Worksheet, titulo: string, subtitulo: string, columnas: { header: string; key: string; width: number; money?: boolean }[]) {
  ws.addRow([titulo]).font = { bold: true, size: 14, color: { argb: VINO } };
  ws.addRow([subtitulo]).font = { italic: true, color: { argb: "FF75655A" } };
  ws.addRow([]);
  const header = ws.addRow(columnas.map((c) => c.header));
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VINO } };
    cell.alignment = { vertical: "middle" };
  });
  columnas.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    col.width = c.width;
    if (c.money) col.numFmt = SOLES;
  });
  ws.views = [{ state: "frozen", ySplit: 4 }];
  return header.number;
}

/** Fila de totales con fórmulas SUM, para que el Excel siga cuadrando si se edita. */
function filaTotales(ws: Worksheet, desdeFila: number, hastaFila: number, etiquetas: Record<number, string>, sumar: number[]) {
  const valores: (string | { formula: string })[] = [];
  const maxCol = Math.max(...sumar, ...Object.keys(etiquetas).map(Number));
  for (let c = 1; c <= maxCol; c++) {
    if (etiquetas[c]) valores[c - 1] = etiquetas[c];
    else if (sumar.includes(c)) {
      const letra = ws.getColumn(c).letter;
      valores[c - 1] = { formula: `SUM(${letra}${desdeFila}:${letra}${hastaFila})` };
    } else valores[c - 1] = "";
  }
  const row = ws.addRow(valores);
  row.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREMA } };
    cell.border = { top: { style: "thin", color: { argb: VINO } } };
  });
}

function hojaCanastas(wb: Workbook, d: DatosReporte, periodo: string) {
  const ws = wb.addWorksheet("Pedidos por canasta");
  const h = prepararHoja(ws, "Pedidos por canasta", periodo + " · sin órdenes anuladas", [
    { header: "Canasta", key: "canasta", width: 26 },
    { header: "N.º de pedidos", key: "pedidos", width: 15 },
    { header: "Canastas vendidas", key: "cantidad", width: 18 },
    { header: "Precio de catálogo", key: "precio", width: 19, money: true },
    { header: "Precio promedio vendido", key: "promedio", width: 24, money: true },
    { header: "Total vendido", key: "total", width: 18, money: true },
  ]);
  d.porCanasta.forEach((r) => ws.addRow([r.canasta, r.pedidos, r.cantidad, r.precioCatalogo, r.precioPromedio, r.total]));
  if (d.porCanasta.length) {
    ws.autoFilter = { from: { row: h, column: 1 }, to: { row: h + d.porCanasta.length, column: 6 } };
    filaTotales(ws, h + 1, h + d.porCanasta.length, { 1: "Total" }, [3, 6]);
  } else ws.addRow(["Sin ventas en el período"]);
}

function hojaOrdenes(wb: Workbook, d: DatosReporte, periodo: string) {
  const ws = wb.addWorksheet("Órdenes");
  const h = prepararHoja(ws, "Órdenes de pedido", periodo, [
    { header: "N.º", key: "numero", width: 10 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Origen", key: "origen", width: 20 },
    { header: "Cliente", key: "cliente", width: 30 },
    { header: "Canastas", key: "canastas", width: 42 },
    { header: "Distrito", key: "distrito", width: 18 },
    { header: "Entrega", key: "entrega", width: 12 },
    { header: "Estado", key: "estado", width: 15 },
    { header: "Pago", key: "pago", width: 11 },
    { header: "Comprobante", key: "comprobante", width: 13 },
    { header: "Subtotal", key: "subtotal", width: 13, money: true },
    { header: "Delivery", key: "delivery", width: 11, money: true },
    { header: "Total", key: "total", width: 13, money: true },
  ]);
  d.ordenes.forEach((o) =>
    ws.addRow([
      o.numero,
      new Date(o.created_at).toLocaleDateString("es-PE", { timeZone: "America/Lima" }),
      labelCanal(o.canal) + (o.origen === "cotizacion" ? " (cotización)" : ""),
      o.cliente_nombre,
      o.items.map((it) => `${it.cantidad} × ${it.producto_nombre}`).join(", "),
      o.distrito ?? "",
      o.fecha_entrega ?? "",
      labelEstado(o.estado),
      o.estado_pago === "pagado" ? "Pagado" : "Pendiente",
      o.comprobante_tipo === "factura" ? "Factura" : "Boleta",
      Number(o.subtotal),
      Number(o.delivery),
      Number(o.total),
    ]),
  );
  if (d.ordenes.length) {
    ws.autoFilter = { from: { row: h, column: 1 }, to: { row: h + d.ordenes.length, column: 13 } };
    filaTotales(ws, h + 1, h + d.ordenes.length, { 1: "Total" }, [11, 12, 13]);
  } else ws.addRow(["Sin órdenes en el período"]);
}

function hojaCompras(wb: Workbook, d: DatosReporte, periodo: string) {
  const ws = wb.addWorksheet("Compras");
  const h = prepararHoja(ws, "Compras y costos", periodo, [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Tipo", key: "tipo", width: 13 },
    { header: "Subcategoría", key: "sub", width: 20 },
    { header: "Descripción", key: "desc", width: 36 },
    { header: "Proveedor", key: "prov", width: 22 },
    { header: "Comprobante", key: "comp", width: 15 },
    { header: "Cantidad", key: "cant", width: 11 },
    { header: "Costo unitario", key: "cu", width: 15, money: true },
    { header: "Total", key: "total", width: 14, money: true },
  ]);
  d.compras.forEach((c) =>
    ws.addRow([c.fecha, c.categoria === "produccion" ? "Producción" : "Marketing", c.subcategoria ?? "", c.descripcion, c.proveedor ?? "", c.comprobante ?? "", Number(c.cantidad), Number(c.costo_unitario), Number(c.total)]),
  );
  if (d.compras.length) {
    ws.autoFilter = { from: { row: h, column: 1 }, to: { row: h + d.compras.length, column: 9 } };
    filaTotales(ws, h + 1, h + d.compras.length, { 1: "Total" }, [9]);
  } else ws.addRow(["Sin compras en el período"]);
}

function hojaResumen(wb: Workbook, d: DatosReporte, periodo: string) {
  const ws = wb.addWorksheet("Resumen");
  prepararHoja(ws, "Resumen del período", periodo, [
    { header: "Concepto", key: "c", width: 34 },
    { header: "Monto", key: "m", width: 18, money: true },
  ]);
  const validas = d.ordenes.filter((o) => o.estado !== "anulada");
  const ventas = validas.reduce((s, o) => s + Number(o.total), 0);
  const prod = d.compras.filter((c) => c.categoria === "produccion").reduce((s, c) => s + Number(c.total), 0);
  const mkt = d.compras.filter((c) => c.categoria === "marketing").reduce((s, c) => s + Number(c.total), 0);
  ws.addRow(["Ventas (órdenes no anuladas)", ventas]);
  ws.addRow(["Costos de producción", prod]);
  ws.addRow(["Costos de marketing", mkt]);
  const r = ws.addRow(["Ganancia estimada", { formula: "B5-B6-B7" }]);
  r.font = { bold: true };
  ws.addRow([]);
  ws.addRow(["Órdenes", validas.length]).getCell(2).numFmt = "0";
  ws.addRow(["Canastas vendidas", validas.reduce((s, o) => s + o.items.reduce((n, it) => n + it.cantidad, 0), 0)]).getCell(2).numFmt = "0";
  ws.addRow(["Ticket promedio", validas.length ? ventas / validas.length : 0]);
}

/** Genera y descarga el Excel en el navegador (exceljs se carga solo al usarlo). */
export async function descargarExcel(tipo: TipoReporte, d: DatosReporte) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "MKA · Panel";
  wb.created = new Date();
  const periodo = `Del ${d.desde} al ${d.hasta}`;

  if (tipo === "canastas" || tipo === "completo") hojaCanastas(wb, d, periodo);
  if (tipo === "ordenes" || tipo === "completo") hojaOrdenes(wb, d, periodo);
  if (tipo === "compras" || tipo === "completo") hojaCompras(wb, d, periodo);
  if (tipo === "resumen" || tipo === "completo") hojaResumen(wb, d, periodo);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MKA_${tipo}_${d.desde}_a_${d.hasta}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
