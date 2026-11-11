import type { Worksheet } from "exceljs";

export type FilaInventario = {
  nombre: string;
  tipo: string;
  unidad: string;
  stockInicial: number;
  stock: number;
  requerido: number;
  queda: number;
  minimo: number;
  estado: "ok" | "bajo" | "falta";
};

export type DatosInventario = {
  fecha: string;
  porArmar: { canasta: string; cantidad: number }[];
  aComprar: { nombre: string; unidad: string; falta: number }[];
  inventario: FilaInventario[];
};

const VINO = "FF7B1E2C";
const CREMA = "FFF3E8D6";
const ESTADOS = {
  ok: { texto: "OK", fondo: "FFE3F1E6", tinta: "FF1F6B3A" },
  bajo: { texto: "Bajo mínimo", fondo: "FFFBF0D5", tinta: "FF8A5A00" },
  falta: { texto: "Falta", fondo: "FFF8DEDE", tinta: "FF9B1C1C" },
};
/** Enteros sin decimales y fracciones con dos; nunca NaN (Excel lo rechaza). */
const num = (n: number) => (Number.isFinite(n) ? n : 0);
const formato = (n: number) => (Number.isInteger(n) ? "#,##0" : "#,##0.00");

/** Título, subtítulo y encabezado con los colores de la marca. Devuelve la fila del encabezado. */
function encabezado(ws: Worksheet, titulo: string, subtitulo: string, columnas: { header: string; width: number; num?: boolean }[]) {
  ws.addRow([titulo]).font = { bold: true, size: 14, color: { argb: VINO } };
  ws.addRow([subtitulo]).font = { italic: true, color: { argb: "FF75655A" } };
  ws.addRow([]);
  const header = ws.addRow(columnas.map((c) => c.header));
  header.eachCell((cell, n) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VINO } };
    cell.alignment = { vertical: "middle", horizontal: columnas[n - 1].num ? "right" : "left" };
  });
  columnas.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    col.width = c.width;
  });
  ws.views = [{ state: "frozen", ySplit: 4 }];
  return header.number;
}

function filaTotal(ws: Worksheet, valores: (string | number | { formula: string })[]) {
  const row = ws.addRow(valores);
  row.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREMA } };
    cell.border = { top: { style: "thin", color: { argb: VINO } } };
  });
}

/** Excel con lo mismo que muestra Producción e inventario, en tres hojas. */
export async function descargarInventario(d: DatosInventario) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "MKA · Panel";
  wb.created = new Date();
  const al = `Al ${d.fecha}`;

  // 1. Inventario de artículos.
  const inv = wb.addWorksheet("Inventario");
  const h = encabezado(inv, "Inventario de artículos", `${al} · stock = compras + stock inicial − canastas en preparación o entregadas; requerido = pedidos nuevos y pendientes`, [
    { header: "Artículo", width: 38 },
    { header: "Tipo", width: 12 },
    { header: "Unidad", width: 12 },
    { header: "Stock inicial", width: 14, num: true },
    { header: "Stock", width: 12, num: true },
    { header: "Requerido", width: 13, num: true },
    { header: "Queda", width: 12, num: true },
    { header: "Stock mínimo", width: 15, num: true },
    { header: "Estado", width: 15 },
  ]);
  d.inventario.forEach((f) => {
    const e = ESTADOS[f.estado];
    const valores = [f.stockInicial, f.stock, f.requerido, f.queda, f.minimo].map(num);
    const row = inv.addRow([f.nombre, f.tipo, f.unidad, ...valores, e.texto]);
    valores.forEach((v, k) => (row.getCell(4 + k).numFmt = formato(v)));
    if (num(f.queda) < 0) row.getCell(7).font = { bold: true, color: { argb: ESTADOS.falta.tinta } };
    const estado = row.getCell(9);
    estado.font = { bold: true, color: { argb: e.tinta } };
    estado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: e.fondo } };
    estado.alignment = { horizontal: "center" };
  });
  inv.autoFilter = { from: { row: h, column: 1 }, to: { row: h, column: 9 } };

  // 2. Canastas por armar.
  const armar = wb.addWorksheet("Canastas por armar");
  const ha = encabezado(armar, "Canastas por armar", `${al} · órdenes nuevas, pendientes y en preparación`, [
    { header: "Canasta / box", width: 40 },
    { header: "Cantidad", width: 12, num: true },
  ]);
  if (d.porArmar.length === 0) armar.addRow(["No hay pedidos pendientes de armar."]).font = { italic: true };
  else {
    d.porArmar.forEach((c) => (armar.addRow([c.canasta, num(c.cantidad)]).getCell(2).numFmt = "#,##0"));
    filaTotal(armar, ["Total", { formula: `SUM(B${ha + 1}:B${ha + d.porArmar.length})` }]);
  }

  // 3. Lista de compras.
  const compras = wb.addWorksheet("Lista de compras");
  encabezado(compras, "Lista de compras", `${al} · lo que falta comprar para cubrir los pedidos pendientes`, [
    { header: "Artículo", width: 40 },
    { header: "Falta comprar", width: 15, num: true },
    { header: "Unidad", width: 12 },
  ]);
  if (d.aComprar.length === 0) compras.addRow(["El stock cubre todos los pedidos pendientes."]).font = { italic: true };
  else d.aComprar.forEach((c) => (compras.addRow([c.nombre, num(c.falta), c.unidad]).getCell(2).numFmt = formato(num(c.falta))));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MKA_inventario_${d.fecha}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
