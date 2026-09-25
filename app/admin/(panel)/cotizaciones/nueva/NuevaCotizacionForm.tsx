"use client";

import { useActionState } from "react";
import { CANALES } from "@/lib/admin/types";
import { crearCotizacion, type EstadoForm } from "../actions";

/** Cotización registrada desde el panel; después se arma la propuesta en su detalle. */
export default function NuevaCotizacionForm() {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(crearCotizacion, {});
  return (
    <form action={accion} className="admForm admFormGrid">
      <label>Origen del pedido
        <select className="admInput" name="canal" defaultValue="whatsapp" required>
          {CANALES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      <label>Fecha requerida
        <input className="admInput" name="fecha_requerida" type="date" />
      </label>

      <label>Cliente / Empresa
        <input className="admInput" name="empresa" required maxLength={200} placeholder="Nombre de la empresa o persona" />
      </label>
      <label>RUC (opcional)
        <input className="admInput" name="ruc" inputMode="numeric" maxLength={11} placeholder="20XXXXXXXXX" />
      </label>
      <label>Nombre de contacto
        <input className="admInput" name="contacto" required maxLength={160} />
      </label>
      <label>Cargo (opcional)
        <input className="admInput" name="cargo" maxLength={120} />
      </label>
      <label>Celular
        <input className="admInput" name="telefono" type="tel" maxLength={40} placeholder="999 999 999" />
      </label>
      <label>Correo
        <input className="admInput" name="email" type="email" maxLength={160} />
      </label>

      <label>Cantidad estimada
        <input className="admInput" name="cantidad_estimada" type="number" min={1} step={1} />
      </label>
      <label>Presupuesto por unidad (opcional)
        <input className="admInput" name="presupuesto" maxLength={60} placeholder="Ej. S/ 100 – 180" />
      </label>
      <label className="admSpan2">Dirección de entrega
        <input className="admInput" name="lugar_entrega" maxLength={300} placeholder="Av., calle, número y distrito" />
      </label>
      <label className="admSpan2">Requerimientos
        <textarea className="admInput" name="requerimientos" rows={3} maxLength={2000} placeholder="Productos, marcas, restricciones, tarjeta con logo…" />
      </label>

      <div className="admSpan2 admFormFootRow">
        <button className="admBtn admBtnPrimary" type="submit" disabled={enviando}>{enviando ? "Creando…" : "Crear y armar la propuesta"}</button>
        {estado.error && <span className="admError" role="alert">{estado.error}</span>}
      </div>
    </form>
  );
}
