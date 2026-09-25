"use client";

import { useActionState, useEffect, useState } from "react";
import { soles } from "@/lib/admin/format";
import { agregarItemCotizacion, type EstadoForm } from "../actions";

type ProductoOpcion = { id: string; nombre: string; precio: number; productos: string[] };
type Opcion = { id: string; nombre: string };
type Fila = { insumo_id: string; cantidad: number };

type Props = {
  cotizacionId: string;
  productos: ProductoOpcion[];
  envases: Opcion[];
  insumos: Opcion[];
  cantidadInicial: number;
};

/**
 * Agrega una línea a la propuesta. Las canastas del catálogo muestran lo que
 * traen; la canasta personalizada deja armar su lista de productos.
 */
export default function AgregarLinea({ cotizacionId, productos, envases, insumos, cantidadInicial }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(agregarItemCotizacion, {});
  const [canasta, setCanasta] = useState("");
  const [filas, setFilas] = useState<Fila[]>([]);

  // Tras agregar, el formulario vuelve a "Seleccionar".
  useEffect(() => {
    if (estado.ok) {
      setCanasta("");
      setFilas([]);
    }
  }, [estado.en, estado.ok]);

  const personalizada = canasta === "personalizada";
  const elegida = productos.find((p) => p.id === canasta);
  const disponibles = (actual: string) => insumos.filter((i) => i.id === actual || !filas.some((f) => f.insumo_id === i.id));

  return (
    <form action={accion} className="admLineaForm">
      <input type="hidden" name="cotizacion_id" value={cotizacionId} />
      {personalizada && <input type="hidden" name="contenido" value={JSON.stringify(filas.filter((f) => f.insumo_id))} />}

      <div className="admLineaCampos">
        <label>Canasta
          <select className="admInput" name="producto_id" required value={canasta} onChange={(e) => { setCanasta(e.target.value); setFilas(e.target.value === "personalizada" ? [{ insumo_id: "", cantidad: 1 }] : []); }}>
            <option value="" disabled>Seleccionar</option>
            {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {soles(p.precio)}</option>)}
            <option value="personalizada">Canasta personalizada</option>
          </select>
        </label>
        <label>Envase
          <select className="admInput" name="tipo_canasta" defaultValue="" key={personalizada ? "p" : "c"} required={personalizada}>
            <option value="" disabled={personalizada}>{personalizada ? "Seleccionar" : "El de la canasta"}</option>
            {envases.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label>Cantidad
          <input className="admInput" name="cantidad" type="number" min={1} defaultValue={cantidadInicial} required />
        </label>
        <label>Precio unitario
          <input className="admInput" name="precio_unitario" type="number" min={0} step="0.01" required={personalizada}
            placeholder={personalizada ? "Obligatorio" : elegida ? `Catálogo: ${soles(elegida.precio)}` : "Precio de catálogo"} />
        </label>
      </div>

      {elegida && (
        <div className="admTrae">
          <span>Trae:</span>
          {elegida.productos.length ? elegida.productos.map((p) => <span key={p} className="admChip">{p}</span>) : <em className="admMuted">sin receta registrada (Costeo por canasta)</em>}
        </div>
      )}

      {personalizada && (
        <fieldset className="admFilas admPersonalizada">
          <legend>Productos de la canasta personalizada</legend>
          <label className="admPersonalizadaNombre">Nombre (opcional)
            <input className="admInput" name="nombre" maxLength={120} placeholder="Canasta personalizada" />
          </label>
          {filas.map((f, i) => (
            <div key={i} className="admFila" style={{ gridTemplateColumns: "1fr 110px auto" }}>
              <label><span className="admSmall admMuted">Producto</span>
                <select className="admInput" value={f.insumo_id} required onChange={(e) => setFilas(filas.map((x, j) => (j === i ? { ...x, insumo_id: e.target.value } : x)))}>
                  <option value="" disabled>Seleccionar</option>
                  {disponibles(f.insumo_id).map((ins) => <option key={ins.id} value={ins.id}>{ins.nombre}</option>)}
                </select>
              </label>
              <label><span className="admSmall admMuted">Cantidad</span>
                <input className="admInput" type="number" min={0.01} step="any" value={f.cantidad} required
                  onChange={(e) => setFilas(filas.map((x, j) => (j === i ? { ...x, cantidad: Number(e.target.value) } : x)))} />
              </label>
              <div className="admFilaAcc">
                <button type="button" className="admLinkDanger" onClick={() => setFilas(filas.filter((_, j) => j !== i))} aria-label="Quitar producto">✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="admLinkMuted" disabled={filas.length >= insumos.length} onClick={() => setFilas([...filas, { insumo_id: "", cantidad: 1 }])}>+ Agregar producto</button>
        </fieldset>
      )}

      <div className="admFormFootRow">
        <button className="admBtn" type="submit" disabled={enviando || !canasta}>{enviando ? "Agregando…" : "Agregar a la propuesta"}</button>
        {estado.error && <span className="admError" role="alert">{estado.error}</span>}
      </div>
    </form>
  );
}
