"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { soles } from "@/lib/admin/format";
import { agregarItemCotizacion, type EstadoForm } from "../actions";

export type CanastaOpcion = {
  id: string;
  nombre: string;
  precio: number;
  tipoBase: string;
  /** Costo de presentación (empaque, cinta, tarjeta…) de la tabla de costos. */
  costoPresentacion: number | null;
  receta: Fila[];
};
export type EnvaseOpcion = { id: string; nombre: string; recargo: number };
export type ProductoOpcion = { id: string; nombre: string; costo: number | null };
type Fila = { insumo_id: string; cantidad: number };

type Props = {
  cotizacionId: string;
  canastas: CanastaOpcion[];
  envases: EnvaseOpcion[];
  productos: ProductoOpcion[];
  cantidadInicial: number;
};

const redondear = (n: number) => Math.round(n * 100) / 100;
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const MARGEN_PERSONALIZADA = 30;

/**
 * Agrega una línea a la propuesta. Al elegir una canasta del catálogo se cargan
 * sus productos con cantidades y costos, y se pueden cambiar, quitar o agregar
 * otros sin crear una canasta nueva. El costeo calcula el costo total, el
 * precio sugerido según el margen y la utilidad antes de agregarla.
 */
export default function AgregarLinea({ cotizacionId, canastas, envases, productos, cantidadInicial }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(agregarItemCotizacion, {});
  const [canasta, setCanasta] = useState("");
  const [envase, setEnvase] = useState("");
  const [cantidad, setCantidad] = useState(cantidadInicial);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [nombre, setNombre] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [margen, setMargen] = useState("");
  const [precio, setPrecio] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const personalizada = canasta === "personalizada";
  const elegida = canastas.find((c) => c.id === canasta);
  const productoDe = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const recargo = (id: string) => envases.find((e) => e.id === id)?.recargo ?? 0;

  // Tras agregar, el formulario vuelve a "Seleccionar".
  useEffect(() => {
    if (estado.ok) elegir("");
  }, [estado.en, estado.ok]);

  const costoProductos = redondear(filas.reduce((s, f) => s + f.cantidad * (productoDe.get(f.insumo_id)?.costo ?? 0), 0));
  const sinCosto = filas.filter((f) => productoDe.get(f.insumo_id)?.costo == null).length;
  const costoTotal = redondear(costoProductos + (Number(presentacion) || 0));
  const m = Math.min(95, Math.max(0, Number(margen) || 0));
  const sugerido = costoTotal > 0 ? redondear(costoTotal / (1 - m / 100)) : 0;
  const precioVenta = Number(precio) || 0;
  const utilidad = redondear(precioVenta - costoTotal);
  const margenReal = precioVenta > 0 ? Math.round((utilidad / precioVenta) * 1000) / 10 : 0;

  // ¿Se cambió la receta de la canasta del catálogo?
  const modificada = useMemo(() => {
    if (!elegida) return false;
    if (elegida.receta.length !== filas.length) return true;
    return elegida.receta.some((r) => filas.find((f) => f.insumo_id === r.insumo_id)?.cantidad !== r.cantidad);
  }, [elegida, filas]);
  const enviarContenido = personalizada || modificada;

  function elegir(id: string) {
    const c = canastas.find((x) => x.id === id);
    setCanasta(id);
    setBusqueda("");
    if (c) {
      const filasBase = c.receta.map((r) => ({ ...r }));
      const costo = filasBase.reduce((s, f) => s + f.cantidad * (productoDe.get(f.insumo_id)?.costo ?? 0), 0) + (c.costoPresentacion ?? 0);
      setFilas(filasBase);
      setEnvase(c.tipoBase);
      setNombre(c.nombre);
      setPresentacion(c.costoPresentacion != null ? String(c.costoPresentacion) : "");
      setPrecio(String(c.precio));
      setMargen(c.precio > 0 && costo > 0 ? String(Math.round(((c.precio - costo) / c.precio) * 1000) / 10) : String(MARGEN_PERSONALIZADA));
    } else {
      setFilas([]);
      setEnvase("");
      setNombre(id === "personalizada" ? "Canasta personalizada" : "");
      setPresentacion("");
      setPrecio("");
      setMargen(String(MARGEN_PERSONALIZADA));
    }
  }

  function cambiarEnvase(id: string) {
    // En canastas del catálogo, el precio sigue la diferencia de recargo del envase.
    if (elegida) setPrecio(String(redondear(elegida.precio + recargo(id) - recargo(elegida.tipoBase))));
    setEnvase(id);
  }

  // Búsqueda por cualquier parte del nombre (sin tildes ni mayúsculas, varias palabras).
  const resultados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    if (!palabras.length) return [];
    return productos
      .filter((p) => !filas.some((f) => f.insumo_id === p.id))
      .filter((p) => palabras.every((w) => normalizar(p.nombre).includes(w)))
      .slice(0, 8);
  }, [busqueda, productos, filas]);

  function agregarProducto(id: string) {
    setFilas((fs) => [...fs, { insumo_id: id, cantidad: 1 }]);
    setBusqueda("");
  }

  return (
    <form action={accion} className="admLineaForm">
      <input type="hidden" name="cotizacion_id" value={cotizacionId} />
      {enviarContenido && <input type="hidden" name="contenido" value={JSON.stringify(filas)} />}
      {enviarContenido && <input type="hidden" name="nombre" value={nombre} />}

      <div className="admLineaCampos">
        <label>Canasta
          <select className="admInput" name="producto_id" required value={canasta} onChange={(e) => elegir(e.target.value)}>
            <option value="" disabled>Seleccionar</option>
            {canastas.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {soles(p.precio)}</option>)}
            <option value="personalizada">Canasta personalizada (desde cero)</option>
          </select>
        </label>
        <label>Envase
          <select className="admInput" name="tipo_canasta" value={envase} onChange={(e) => cambiarEnvase(e.target.value)} required={personalizada}>
            <option value="" disabled>Seleccionar</option>
            {envases.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label>Cantidad
          <input className="admInput" name="cantidad" type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Math.max(1, Math.round(Number(e.target.value)) || 1))} required />
        </label>
      </div>

      {canasta && (
        <>
          <fieldset className="admFilas admComposicion">
            <legend>Productos de la canasta {modificada && <span className="admChip admChipAviso">Modificada</span>}</legend>
            {(personalizada || modificada) && (
              <label className="admPersonalizadaNombre">Nombre en la propuesta
                <input className="admInput" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} />
              </label>
            )}

            {filas.length > 0 ? (
              <table className="admTable admTablaComposicion">
                <thead><tr><th>Producto</th><th className="num">Costo unit.</th><th className="num">Cant.</th><th className="num">Costo</th><th /></tr></thead>
                <tbody>
                  {filas.map((f, i) => {
                    const p = productoDe.get(f.insumo_id);
                    return (
                      <tr key={f.insumo_id}>
                        <td>{p?.nombre ?? "—"}</td>
                        <td className="num">{p?.costo != null ? soles(p.costo) : <span className="admMuted">Sin costo</span>}</td>
                        <td className="num">
                          <input className="admInput admInputCorto" type="number" min={0.01} step="any" value={f.cantidad} aria-label={`Cantidad de ${p?.nombre ?? "producto"}`}
                            onChange={(e) => setFilas(filas.map((x, j) => (j === i ? { ...x, cantidad: Math.max(0.01, Number(e.target.value) || 0) } : x)))} />
                        </td>
                        <td className="num">{p?.costo != null ? soles(redondear(p.costo * f.cantidad)) : "—"}</td>
                        <td className="num"><button type="button" className="admLinkDanger" onClick={() => setFilas(filas.filter((_, j) => j !== i))} aria-label={`Quitar ${p?.nombre ?? "producto"}`}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="admMuted admSmall">{elegida ? "Esta canasta no tiene productos registrados. Agrégalos con el buscador." : "Busca y agrega los productos de la canasta."}</p>
            )}

            <div className="admBuscador">
              <input
                className="admInput"
                type="search"
                placeholder="Buscar producto para agregar (ej. panetón donofrio, leche, vino…)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (resultados[0]) agregarProducto(resultados[0].id);
                  }
                }}
                aria-label="Buscar producto"
              />
              {busqueda.trim() && (
                <ul className="admBuscadorLista" role="listbox">
                  {resultados.length ? resultados.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => agregarProducto(p.id)}>
                        <span>{p.nombre}</span>
                        <small>{p.costo != null ? soles(p.costo) : "sin costo"}</small>
                      </button>
                    </li>
                  )) : <li className="admMuted admSmall">Sin resultados.</li>}
                </ul>
              )}
            </div>
          </fieldset>

          <div className="admCosteoLinea">
            <div className="admCosteoFila"><span>Costo de productos{sinCosto > 0 && <small className="admMuted"> · {sinCosto} sin costo</small>}</span><strong>{soles(costoProductos)}</strong></div>
            <label className="admCosteoFila"><span>Empaque / presentación / otros</span>
              <input className="admInput admInputCorto" type="number" min={0} step="0.01" value={presentacion} placeholder="0.00" onChange={(e) => setPresentacion(e.target.value)} />
            </label>
            <div className="admCosteoFila admFilaFuerte"><span>Costo total por canasta</span><strong>{soles(costoTotal)}</strong></div>
            <label className="admCosteoFila"><span>Margen deseado (%)</span>
              <input className="admInput admInputCorto" type="number" min={0} max={95} step="0.1" value={margen} onChange={(e) => setMargen(e.target.value)} />
            </label>
            <div className="admCosteoFila"><span>Precio sugerido</span>
              <span className="admCosteoSugerido"><strong>{soles(sugerido)}</strong>
                <button type="button" className="admLinkMuted" disabled={!sugerido} onClick={() => setPrecio(String(sugerido))}>Usar</button>
              </span>
            </div>
            <label className="admCosteoFila admFilaFuerte"><span>Precio de venta por canasta</span>
              <input className="admInput admInputCorto" name="precio_unitario" type="number" min={0} step="0.01" required value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </label>
            <div className="admCosteoFila"><span>Utilidad por canasta</span><strong className={utilidad < 0 ? "admNegativo" : undefined}>{soles(utilidad)} · {margenReal} %</strong></div>
            <div className="admCosteoFila admFilaFuerte"><span>Venta total ({cantidad} canastas)</span><strong>{soles(redondear(precioVenta * cantidad))}</strong></div>
            <div className="admCosteoFila"><span>Utilidad total estimada</span><strong className={utilidad < 0 ? "admNegativo" : undefined}>{soles(redondear(utilidad * cantidad))}</strong></div>
          </div>
        </>
      )}

      <div className="admFormFootRow">
        <button className="admBtn" type="submit" disabled={enviando || !canasta || (enviarContenido && filas.length === 0)}>{enviando ? "Agregando…" : "Agregar a la propuesta"}</button>
        {estado.error && <span className="admError" role="alert">{estado.error}</span>}
      </div>
    </form>
  );
}
