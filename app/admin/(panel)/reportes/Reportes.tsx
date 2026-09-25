"use client";

import { useState, useTransition } from "react";
import { numero, soles } from "@/lib/admin/format";
import { obtenerDatosReporte, type DatosReporte } from "./actions";
import { descargarExcel, type TipoReporte } from "./excel";

const REPORTES: { id: TipoReporte; titulo: string; texto: string }[] = [
  { id: "canastas", titulo: "Pedidos por canasta", texto: "Cantidad vendida, número de pedidos, precio e importe total de cada canasta." },
  { id: "ordenes", titulo: "Listado de órdenes", texto: "Todas las órdenes con cliente, canastas, entrega, estado, pago y totales." },
  { id: "compras", titulo: "Compras y costos", texto: "Compras de producción y marketing con proveedor, comprobante y totales." },
  { id: "resumen", titulo: "Resumen del período", texto: "Ventas, costos, ganancia estimada y ticket promedio." },
  { id: "completo", titulo: "Todo en un archivo", texto: "Los cuatro reportes, cada uno en su hoja." },
];

export default function Reportes({ desdeInicial, hastaInicial }: { desdeInicial: string; hastaInicial: string }) {
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);
  const [vista, setVista] = useState<DatosReporte | null>(null);
  const [error, setError] = useState("");
  const [enCurso, setEnCurso] = useState<TipoReporte | "vista" | null>(null);
  const [, startTransition] = useTransition();

  const cargar = async () => {
    const datos = await obtenerDatosReporte(desde, hasta);
    setVista(datos);
    return datos;
  };

  const run = (id: TipoReporte | "vista") =>
    startTransition(async () => {
      setError("");
      setEnCurso(id);
      try {
        const datos = await cargar();
        if (id !== "vista") await descargarExcel(id, datos);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo generar el reporte.");
      } finally {
        setEnCurso(null);
      }
    });

  const totalCantidad = vista?.porCanasta.reduce((s, r) => s + r.cantidad, 0) ?? 0;
  const totalVendido = vista?.porCanasta.reduce((s, r) => s + r.total, 0) ?? 0;

  return (
    <>
      <div className="admFilters">
        <label className="admInlineLabel">Desde<input className="admInput" type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="admInlineLabel">Hasta<input className="admInput" type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} /></label>
        <button className="admBtn" type="button" onClick={() => run("vista")} disabled={!!enCurso}>{enCurso === "vista" ? "Cargando…" : "Ver pedidos por canasta"}</button>
      </div>
      {error && <p className="admError" role="alert">{error}</p>}

      <div className="admReportGrid">
        {REPORTES.map((r) => (
          <article className="admReport" key={r.id}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5zM14 3v5h5M9 17l2-3-2-3M15 17h-3" /></svg>
            <h2>{r.titulo}</h2>
            <p>{r.texto}</p>
            <button className="admBtn admBtnPrimary" type="button" onClick={() => run(r.id)} disabled={!!enCurso}>
              {enCurso === r.id ? "Generando…" : "Descargar .xlsx"}
            </button>
          </article>
        ))}
      </div>

      {vista && (
        <section className="admCard">
          <div className="admCardHead"><h2>Pedidos por canasta</h2><span className="admMuted">Del {vista.desde} al {vista.hasta} · sin anuladas</span></div>
          {vista.porCanasta.length === 0 ? (
            <p className="admEmpty">No hay ventas en este período.</p>
          ) : (
            <table className="admTable">
              <thead><tr><th>Canasta</th><th className="num">Pedidos</th><th className="num">Canastas</th><th className="num">Precio catálogo</th><th className="num">Precio promedio</th><th className="num">Total</th></tr></thead>
              <tbody>
                {vista.porCanasta.map((r) => (
                  <tr key={r.canasta}>
                    <td>{r.canasta}</td>
                    <td className="num">{numero(r.pedidos)}</td>
                    <td className="num">{numero(r.cantidad)}</td>
                    <td className="num">{r.precioCatalogo == null ? "—" : soles(r.precioCatalogo)}</td>
                    <td className="num">{soles(r.precioPromedio)}</td>
                    <td className="num">{soles(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="admTotalRow"><td>Total</td><td /><td className="num">{numero(totalCantidad)}</td><td /><td /><td className="num">{soles(totalVendido)}</td></tr></tfoot>
            </table>
          )}
        </section>
      )}
    </>
  );
}
