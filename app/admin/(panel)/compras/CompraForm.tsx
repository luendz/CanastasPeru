"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Insumo } from "@/lib/admin/types";
import { soles } from "@/lib/admin/format";
import { registrarCompra, type CompraState } from "./actions";

const SUBCATEGORIAS = {
  produccion: ["Mercadería", "Empaques", "Tarjetas e impresión", "Mano de obra", "Transporte", "Otros"],
  marketing: ["Publicidad en redes", "Diseño", "Fotografía", "Impresos", "Influencers", "Otros"],
};

export default function CompraForm({ insumos, hoy }: { insumos: Insumo[]; hoy: string }) {
  const [state, action, pending] = useActionState<CompraState, FormData>(registrarCompra, {});
  const [categoria, setCategoria] = useState<"produccion" | "marketing">("produccion");
  const [cantidad, setCantidad] = useState("1");
  const [costo, setCosto] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Tras guardar, limpia el formulario para la siguiente compra.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setCantidad("1");
      setCosto("");
    }
  }, [state]);

  const total = (Number(cantidad) || 0) * (Number(costo) || 0);

  return (
    <form ref={formRef} action={action} className="admForm admFormGrid">
      <fieldset className="admSegment admSpan2">
        <legend className="srOnly">Tipo de costo</legend>
        {(["produccion", "marketing"] as const).map((c) => (
          <label key={c}>
            <input type="radio" name="categoria" value={c} checked={categoria === c} onChange={() => setCategoria(c)} />
            <span>{c === "produccion" ? "Producción" : "Marketing"}</span>
          </label>
        ))}
      </fieldset>

      <label>Fecha<input className="admInput" type="date" name="fecha" defaultValue={hoy} required /></label>
      <label>Subcategoría
        <select className="admInput" name="subcategoria" key={categoria}>
          {SUBCATEGORIAS[categoria].map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>

      <label className="admSpan2">Descripción<input className="admInput" name="descripcion" placeholder={categoria === "produccion" ? "Ej. Panetón D'Onofrio 900 g" : "Ej. Campaña Instagram diciembre"} required maxLength={300} /></label>

      {categoria === "produccion" && (
        <label className="admSpan2">Suma stock a un insumo (opcional)
          <select className="admInput" name="insumo_id" defaultValue="">
            <option value="">No, es un gasto general</option>
            {insumos.map((i) => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
          </select>
        </label>
      )}

      <label>Cantidad<input className="admInput" type="number" name="cantidad" min="0.01" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required /></label>
      <label>Costo unitario (S/)<input className="admInput" type="number" name="costo_unitario" min="0" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} required /></label>
      <label>Proveedor<input className="admInput" name="proveedor" maxLength={160} /></label>
      <label>N.º de comprobante<input className="admInput" name="comprobante" maxLength={60} placeholder="F001-000123" /></label>

      <div className="admSpan2 admFormFoot">
        <p className="admFormTotal">Total <strong>{soles(total)}</strong></p>
        {state.error && <p className="admError" role="alert">{state.error}</p>}
        {state.ok && <p className="admSuccess" role="status">Compra registrada.</p>}
        <button className="admBtn admBtnPrimary" type="submit" disabled={pending}>{pending ? "Guardando…" : "Registrar compra"}</button>
      </div>
    </form>
  );
}
