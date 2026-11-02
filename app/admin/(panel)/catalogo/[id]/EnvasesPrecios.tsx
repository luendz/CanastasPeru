"use client";

import { useState, useTransition } from "react";
import { numero, soles } from "@/lib/admin/format";
import CampoOrden from "../../CampoOrden";
import SelectorImagen from "../../medios/SelectorImagen";
import { agregarEnvase, alternarEnvase, guardarEnvase, guardarImagenEnvase, moverEnvase, quitarEnvase, type FormState } from "../actions";

export type FilaEnvase = {
  tipo_canasta: string;
  tipo_nombre: string;
  descripcion: string | null;
  insumo_id: string | null;
  insumo_nombre: string | null;
  imagen: string | null;
  precio: number;
  costo_manual: number | null;
  visible: boolean;
  principal: boolean;
  costo_presentacion: number | null;
  fuente_costo: "producto" | "manual" | null;
  costo_receta: number;
  costo_total: number | null;
  utilidad: number | null;
  margen_pct: number | null;
};
export type OpcionEnvase = { valor: string; etiqueta: string };

type Props = { productoId: string; filas: FilaEnvase[]; opciones: OpcionEnvase[]; productos: { id: string; nombre: string }[] };

/** Tabla de envases de la canasta: costo, precio, margen y utilidad de cada uno. */
export default function EnvasesPrecios({ productoId, filas, opciones, productos }: Props) {
  const [editando, setEditando] = useState<string | null>(null);
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [insumo, setInsumo] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [opcion, setOpcion] = useState("");
  const [precioNuevo, setPrecioNuevo] = useState("");
  const [error, setError] = useState("");
  const [guardando, iniciar] = useTransition();

  /** Ejecuta una acción y muestra su error; devuelve si salió bien. */
  function ejecutar(accion: () => Promise<FormState>, alTerminar?: () => void) {
    setError("");
    iniciar(async () => {
      try {
        const r = await accion();
        if (r.error) setError(r.error);
        else alTerminar?.();
      } catch {
        setError("No se pudo guardar. Inténtalo de nuevo.");
      }
    });
  }

  function editar(f: FilaEnvase) {
    setEditando(f.tipo_canasta);
    setPrecio(String(f.precio));
    setCosto(f.costo_manual == null ? "" : String(f.costo_manual));
    setNombre(f.tipo_nombre);
    setDescripcion(f.descripcion ?? "");
    setInsumo(f.insumo_id ?? "");
  }

  return (
    <section className="admCard admCardFlush" id="envases">
      <div className="admCardHead admPad">
        <div>
          <h2>Envases y precios</h2>
          <p className="admMuted admSmall">Cada envase tiene un costo de presentación, por lo que el precio, el margen y la utilidad pueden variar. La foto, el nombre, la descripción y el producto se cambian en todas las canastas con ese envase; el precio y el orden, solo en esta.</p>
        </div>
        <button type="button" className="admBtn admBtnPrimary" onClick={() => setAgregando((a) => !a)}>+ Agregar envase</button>
      </div>

      {agregando && (
        <form
          className="admInlineForm admPad"
          onSubmit={(e) => {
            e.preventDefault();
            ejecutar(() => agregarEnvase(productoId, opcion, Number(precioNuevo)), () => {
              setAgregando(false);
              setOpcion("");
              setPrecioNuevo("");
            });
          }}
        >
          <label>Envase
            <select className="admInput" value={opcion} required onChange={(e) => setOpcion(e.target.value)}>
              <option value="" disabled>Seleccionar</option>
              {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
          </label>
          <label>Precio de venta (S/)
            <input className="admInput" type="number" min="0.01" step="0.01" required value={precioNuevo} onChange={(e) => setPrecioNuevo(e.target.value)} />
          </label>
          <button className="admBtn" type="submit" disabled={guardando}>Agregar</button>
          {opciones.length === 0 && <small className="admMuted">No hay más envases. Súbelos en Productos, con tipo Empaque y con foto.</small>}
        </form>
      )}

      {error && <p className="admError admPad" role="alert">{error}</p>}

      <table className="admTable admTablaEnvases">
        <thead>
          <tr><th>N.°</th><th>Envase</th><th>Imagen</th><th className="num">Costo presentación</th><th className="num">Costo total</th><th className="num">Precio venta</th><th className="num">Margen</th><th className="num">Utilidad</th><th>Estado</th><th>Mostrar en web</th><th className="num">Acciones</th></tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const enEdicion = editando === f.tipo_canasta;
            const costoFijo = f.fuente_costo === "producto";
            return (
              <tr key={f.tipo_canasta} data-inactivo={!f.visible || undefined}>
                <td><CampoOrden key={i} posicion={i + 1} total={filas.length} etiqueta={`Orden de ${f.tipo_nombre}`} onCambiar={(n) => ejecutar(() => moverEnvase(productoId, f.tipo_canasta, n))} /></td>
                <td className="admEnvaseNombre">
                  {enEdicion ? (
                    <div className="admEnvaseDatos">
                      <label>Nombre<input className="admInput" value={nombre} maxLength={80} required onChange={(e) => setNombre(e.target.value)} /></label>
                      <label>Descripción<input className="admInput" value={descripcion} maxLength={120} onChange={(e) => setDescripcion(e.target.value)} /></label>
                      <label>Producto (costo)
                        <select className="admInput" value={insumo} onChange={(e) => setInsumo(e.target.value)}>
                          <option value="">Sin relacionar</option>
                          {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <>
                      <strong>{f.tipo_nombre}</strong>
                      {f.principal && <> <span className="admBadge">Principal</span></>}
                      {f.descripcion && <small className="admMuted admBlock">{f.descripcion}</small>}
                      <small className={`admBlock ${f.insumo_nombre ? "admMuted" : "admWarn"}`}>{f.insumo_nombre ? `Producto: ${f.insumo_nombre}` : "Sin producto relacionado"}</small>
                    </>
                  )}
                </td>
                <td>
                  <SelectorImagen name="imagen" compacto defaultValue={f.imagen} label={`Foto de ${f.tipo_nombre}`} onChange={(url) => ejecutar(() => guardarImagenEnvase(productoId, f.tipo_canasta, url))} />
                </td>
                <td className="num">
                  {enEdicion && !costoFijo ? (
                    <input className="admInput admInputSm" type="number" min="0" step="0.01" value={costo} placeholder="Manual" aria-label={`Costo de presentación de ${f.tipo_nombre}`} onChange={(e) => setCosto(e.target.value)} />
                  ) : f.costo_presentacion == null ? (
                    <span className="admWarn">Sin costo</span>
                  ) : (
                    <>{soles(f.costo_presentacion)}{f.fuente_costo === "manual" && <small className="admMuted admBlock">manual</small>}</>
                  )}
                </td>
                <td className="num">
                  {f.costo_total == null ? "—" : (
                    <>
                      <small className="admMuted admBlock">{soles(f.costo_receta)} + {numero(f.costo_presentacion ?? 0, 2)}</small>
                      <strong>{soles(f.costo_total)}</strong>
                    </>
                  )}
                </td>
                <td className="num">
                  {enEdicion ? (
                    <input className="admInput admInputSm" type="number" min="0.01" step="0.01" value={precio} aria-label={`Precio de venta de ${f.tipo_nombre}`} onChange={(e) => setPrecio(e.target.value)} />
                  ) : <strong>{soles(f.precio)}</strong>}
                </td>
                <td className="num">{f.margen_pct == null ? "—" : `${numero(f.margen_pct, 1)} %`}</td>
                <td className="num" data-tone={f.utilidad != null && f.utilidad < 0 ? "bad" : undefined}>{f.utilidad == null ? "—" : soles(f.utilidad)}</td>
                <td><span className="admBadge" data-stock={f.visible ? "ok" : "bajo"}>{f.visible ? "Activa" : "Oculta"}</span></td>
                <td>
                  <button
                    type="button"
                    className="admToggle"
                    aria-pressed={f.visible}
                    disabled={guardando || f.principal}
                    title={f.principal ? "El envase principal siempre se muestra" : f.visible ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                    onClick={() => ejecutar(() => alternarEnvase(productoId, f.tipo_canasta, !f.visible))}
                  >
                    <span />{f.visible ? "Visible" : "Oculto"}
                  </button>
                </td>
                <td className="num admEnvaseAcciones">
                  {enEdicion ? (
                    <>
                      <button type="button" className="admLinkMuted" disabled={guardando} onClick={() => ejecutar(() => guardarEnvase(productoId, f.tipo_canasta, Number(precio), costo.trim() === "" ? null : Number(costo), { nombre, descripcion, insumoId: insumo || null }), () => setEditando(null))}>Guardar</button>
                      <button type="button" className="admLinkMuted" onClick={() => setEditando(null)}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="admLinkMuted" aria-label={`Editar ${f.tipo_nombre}`} onClick={() => editar(f)}>✎</button>
                      <button
                        type="button"
                        className="admLinkDanger"
                        aria-label={`Quitar ${f.tipo_nombre}`}
                        disabled={guardando || f.principal}
                        title={f.principal ? "Para quitarlo, elige otro envase principal en Datos generales" : undefined}
                        onClick={() => { if (window.confirm(`¿Quitar ${f.tipo_nombre} de esta canasta?`)) ejecutar(() => quitarEnvase(productoId, f.tipo_canasta)); }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
