"use client";

import { useState, useTransition } from "react";
import { CANALES, ESTADOS_ORDEN, type Orden } from "@/lib/admin/types";
import { actualizarOrden } from "../actions";

/** Campos controlados: después de guardar se quedan con lo elegido. */
export default function GestionarOrden({ orden: o }: { orden: Pick<Orden, "id" | "estado" | "estado_pago" | "canal" | "origen" | "notas"> }) {
  const [v, setV] = useState({ estado: o.estado as string, estado_pago: o.estado_pago as string, canal: o.canal as string, notas: o.notas ?? "" });
  const [guardando, start] = useTransition();
  const [aviso, setAviso] = useState<"" | "ok" | "error">("");
  const cambiar = (k: keyof typeof v, valor: string) => { setV({ ...v, [k]: valor }); setAviso(""); };

  return (
    <form
      className="admForm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          try {
            await actualizarOrden(fd);
            setAviso("ok");
          } catch {
            setAviso("error");
          }
        });
      }}
    >
      <input type="hidden" name="id" value={o.id} />
      <label>Estado del pedido
        <select className="admInput" name="estado" value={v.estado} onChange={(e) => cambiar("estado", e.target.value)}>
          {ESTADOS_ORDEN.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
      </label>
      <label>Pago
        <select className="admInput" name="estado_pago" value={v.estado_pago} onChange={(e) => cambiar("estado_pago", e.target.value)}>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
        </select>
      </label>
      <label>Origen
        {o.origen === "web" ? (
          <><input className="admInput" value="Web" disabled /><input type="hidden" name="canal" value="web" /></>
        ) : (
          <select className="admInput" name="canal" value={v.canal} onChange={(e) => cambiar("canal", e.target.value)}>
            {CANALES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
      </label>
      <label>Notas internas
        <textarea className="admInput" name="notas" rows={4} value={v.notas} onChange={(e) => cambiar("notas", e.target.value)} />
      </label>
      <button className="admBtn admBtnPrimary" type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
      {aviso === "ok" && <p className="admSuccess" role="status">Cambios guardados.</p>}
      {aviso === "error" && <p className="admError" role="alert">No se pudo guardar. Intenta de nuevo.</p>}
    </form>
  );
}
