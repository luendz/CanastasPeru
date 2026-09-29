"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { numero, soles } from "@/lib/admin/format";
import { PRESENTACIONES, TIPOS_COSTO, TIPOS_DOCUMENTO } from "@/lib/admin/types";
import { editarCompra, registrarCompras, type CabeceraCompra, type CompraState, type ItemCompra } from "./actions";

export type ProductoCompra = {
  id: string;
  nombre: string;
  tipo: string;
  presentacion_compra: string;
  unidades_por_presentacion: number;
  imagen: string | null;
  emoji: string;
};

type Fila = Omit<ItemCompra, "cantidad_presentaciones" | "unidades_por_presentacion" | "precio_presentacion"> & {
  cantidad_presentaciones: string;
  unidades_por_presentacion: string;
  precio_presentacion: string;
};

type Props = {
  productos: ProductoCompra[];
  proveedores: string[];
  inicial: { cab: CabeceraCompra; items: ItemCompra[] };
  /** Con id se edita ese registro (un solo ítem). */
  editarId?: string;
};

const nueva = (): Fila => ({
  categoria: "mercaderia",
  insumo_id: null,
  descripcion: "",
  presentacion: "Unidad",
  cantidad_presentaciones: "1",
  unidades_por_presentacion: "1",
  precio_presentacion: "",
  afecto_igv: true,
});

const n = (s: string) => Number(String(s).replace(",", ".")) || 0;

export default function RegistroCompra({ productos, proveedores, inicial, editarId }: Props) {
  const editando = Boolean(editarId);
  const [estado, accion, guardando] = useActionState<CompraState, FormData>(editando ? editarCompra : registrarCompras, {});
  const [cab, setCab] = useState<CabeceraCompra>(inicial.cab);
  const [filas, setFilas] = useState<Fila[]>(
    inicial.items.length
      ? inicial.items.map((it) => ({ ...it, cantidad_presentaciones: String(it.cantidad_presentaciones), unidades_por_presentacion: String(it.unidades_por_presentacion), precio_presentacion: String(it.precio_presentacion) }))
      : [nueva()],
  );
  const [activa, setActiva] = useState(0);

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const cambiar = (i: number, cambios: Partial<Fila>) => setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, ...cambios } : f)));

  function elegirProducto(i: number, id: string) {
    if (!id) return cambiar(i, { insumo_id: null });
    const p = porId.get(id);
    if (!p) return;
    cambiar(i, {
      insumo_id: p.id,
      descripcion: p.nombre,
      categoria: p.tipo === "empaque" ? "empaque" : "mercaderia",
      presentacion: p.presentacion_compra || "Unidad",
      unidades_por_presentacion: String(p.unidades_por_presentacion || 1),
    });
  }

  // Mismos cálculos que el servidor.
  const calculo = filas.map((f) => {
    const bruto = n(f.cantidad_presentaciones) * n(f.precio_presentacion);
    const importe = !cab.incluye_igv && f.afecto_igv ? bruto * 1.18 : bruto;
    const unidades = n(f.cantidad_presentaciones) * n(f.unidades_por_presentacion);
    return { importe, unidades, unitario: unidades > 0 ? importe / unidades : 0, base: f.afecto_igv ? importe / 1.18 : importe };
  });
  const total = calculo.reduce((s, c) => s + c.importe, 0);
  const base = calculo.reduce((s, c) => s + c.base, 0);
  const unidades = calculo.reduce((s, c) => s + c.unidades, 0);

  const datos = JSON.stringify({
    cab,
    items: filas.map((f) => ({ ...f, cantidad_presentaciones: n(f.cantidad_presentaciones), unidades_por_presentacion: n(f.unidades_por_presentacion), precio_presentacion: n(f.precio_presentacion) })),
  });
  const actual = filas[activa] ?? filas[0];
  const cActual = calculo[activa] ?? calculo[0];

  return (
    <form action={accion} className="admRegistro">
      <input type="hidden" name="datos" value={datos} />
      {editarId && <input type="hidden" name="id" value={editarId} />}

      <div className="admRegistroMain">
        <section className="admCard">
          <h2 className="admPaso"><span>1</span>Datos del comprobante</h2>
          <div className="admForm admFormGrid admGrid3">
            <label>Tipo de documento
              <select className="admInput" value={cab.tipo_documento} onChange={(e) => setCab({ ...cab, tipo_documento: e.target.value })}>
                {TIPOS_DOCUMENTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label>Serie y número
              <input className="admInput" value={cab.comprobante} maxLength={60} placeholder="F001-2515" onChange={(e) => setCab({ ...cab, comprobante: e.target.value })} disabled={cab.tipo_documento === "sin_comprobante"} />
            </label>
            <label>Fecha de compra
              <input className="admInput" type="date" required value={cab.fecha} onChange={(e) => setCab({ ...cab, fecha: e.target.value })} />
            </label>
            <label className="admSpan2">Proveedor
              <input className="admInput" value={cab.proveedor} maxLength={160} list="proveedores" placeholder="Ej. Corporación Lon" onChange={(e) => setCab({ ...cab, proveedor: e.target.value })} />
              <datalist id="proveedores">{proveedores.map((p) => <option key={p} value={p} />)}</datalist>
            </label>
            <label>RUC (opcional)
              <input className="admInput" value={cab.ruc_proveedor} inputMode="numeric" maxLength={11} placeholder="20XXXXXXXXX" onChange={(e) => setCab({ ...cab, ruc_proveedor: e.target.value.replace(/\D/g, "") })} />
            </label>
          </div>
        </section>

        <section className="admCard">
          <div className="admCardHead">
            <h2 className="admPaso"><span>2</span>{editando ? "Detalle del ítem" : "Detalle de productos / ítems"}</h2>
            {!editando && <button type="button" className="admBtn" onClick={() => { setFilas([...filas, nueva()]); setActiva(filas.length); }}>+ Agregar otro ítem</button>}
          </div>

          <div className="admItems">
            <div className="admItemsHead" aria-hidden="true">
              <span>Producto / descripción</span><span>Tipo de costo</span><span>Presentación</span><span>Cantidad comprada</span><span>Unid. por presentación</span><span>Precio por presentación (S/)</span><span>Total unid.</span><span>Costo unit. (S/)</span><span />
            </div>
            {filas.map((f, i) => {
              const p = f.insumo_id ? porId.get(f.insumo_id) : undefined;
              const c = calculo[i];
              return (
                <div key={i} className="admItem" data-activa={i === activa || undefined} onFocus={() => setActiva(i)}>
                  <div className="admItemProducto">
                    <span className="admItemThumb">{p?.imagen ? <img src={p.imagen} alt="" /> : <span>{p?.emoji ?? "🧾"}</span>}</span>
                    <div>
                      <select className="admInput" value={f.insumo_id ?? ""} onChange={(e) => elegirProducto(i, e.target.value)} aria-label={`Producto del ítem ${i + 1}`}>
                        <option value="">Otro gasto (escribir)</option>
                        {productos.map((pr) => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
                      </select>
                      {!f.insumo_id && (
                        <input className="admInput" value={f.descripcion} maxLength={300} placeholder="Ej. Movilidad a Gamarra" aria-label={`Descripción del ítem ${i + 1}`} onChange={(e) => cambiar(i, { descripcion: e.target.value })} />
                      )}
                    </div>
                  </div>
                  <select className="admInput" value={f.categoria} onChange={(e) => cambiar(i, { categoria: e.target.value })} aria-label={`Tipo de costo del ítem ${i + 1}`}>
                    {TIPOS_COSTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <select className="admInput" value={f.presentacion} onChange={(e) => cambiar(i, { presentacion: e.target.value, ...(e.target.value === "Unidad" ? { unidades_por_presentacion: "1" } : {}) })} aria-label={`Presentación del ítem ${i + 1}`}>
                    {PRESENTACIONES.map((pr) => <option key={pr} value={pr}>{pr}</option>)}
                  </select>
                  <input className="admInput num" inputMode="decimal" value={f.cantidad_presentaciones} onChange={(e) => cambiar(i, { cantidad_presentaciones: e.target.value })} aria-label={`Cantidad comprada del ítem ${i + 1}`} />
                  <input className="admInput num" inputMode="decimal" value={f.unidades_por_presentacion} disabled={f.presentacion === "Unidad"} onChange={(e) => cambiar(i, { unidades_por_presentacion: e.target.value })} aria-label={`Unidades por presentación del ítem ${i + 1}`} />
                  <input className="admInput num" inputMode="decimal" value={f.precio_presentacion} placeholder="0.00" onChange={(e) => cambiar(i, { precio_presentacion: e.target.value })} aria-label={`Precio por presentación del ítem ${i + 1}`} />
                  <span className="admItemCalc">{numero(c.unidades, 2).replace(/[.,]00$/, "")}</span>
                  <span className="admItemCalc admItemUnit">{c.unidades > 0 ? numero(c.unitario, 2) : "—"}</span>
                  <div className="admItemAcc">
                    <label className="admCheck admCheckSm" title="El producto está afecto al IGV">
                      <input type="checkbox" checked={f.afecto_igv} onChange={(e) => cambiar(i, { afecto_igv: e.target.checked })} /><span>IGV</span>
                    </label>
                    {filas.length > 1 && <button type="button" className="admLinkDanger" aria-label={`Quitar ítem ${i + 1}`} onClick={() => { setFilas(filas.filter((_, j) => j !== i)); setActiva(0); }}>✕</button>}
                  </div>
                </div>
              );
            })}
          </div>

          {actual && cActual.unidades > 0 && (
            <p className="admCalculo">
              <strong>Cálculo automático:</strong> {numero(n(actual.cantidad_presentaciones), 2).replace(/[.,]00$/, "")} {actual.presentacion.toLowerCase()}
              {actual.presentacion !== "Unidad" && <> × {numero(n(actual.unidades_por_presentacion), 2).replace(/[.,]00$/, "")} unidades</>} = <strong>{numero(cActual.unidades, 2).replace(/[.,]00$/, "")} unidades</strong>
              {n(actual.precio_presentacion) > 0 && (
                <> · {soles(n(actual.precio_presentacion))}{actual.presentacion !== "Unidad" && <> ÷ {numero(n(actual.unidades_por_presentacion), 2).replace(/[.,]00$/, "")}</>}
                  {!cab.incluye_igv && actual.afecto_igv && " + IGV"} = <strong>{soles(cActual.unitario)} por unidad</strong></>
              )}
            </p>
          )}
        </section>

        <div className="admGrid2 admRegistroPie">
          <section className="admCard">
            <h2 className="admPaso"><span>3</span>Información adicional</h2>
            <label className="admForm">Observaciones (opcional)
              <textarea className="admInput" rows={3} maxLength={1000} value={cab.notas} placeholder="Ej. Compra de insumos para la campaña corporativa." onChange={(e) => setCab({ ...cab, notas: e.target.value })} />
            </label>
          </section>
          <section className="admCard">
            <h2 className="admPaso"><span>4</span>IGV y totales</h2>
            <label className="admCheck">
              <input type="checkbox" checked={cab.incluye_igv} onChange={(e) => setCab({ ...cab, incluye_igv: e.target.checked })} />
              <span>Los precios incluyen IGV</span>
            </label>
            <div className="admTotales3">
              <div><span>Subtotal</span><strong>{soles(base)}</strong></div>
              <div><span>IGV (18 %)</span><strong>{soles(total - base)}</strong></div>
              <div data-total><span>Total pagado</span><strong>{soles(total)}</strong></div>
            </div>
            <p className="admMuted admSmall">Desmarca “IGV” en un ítem si no está afecto (por ejemplo, productos exonerados o recibos sin IGV).</p>
          </section>
        </div>

        <div className="admRegistroAcciones">
          <Link className="admBtn" href="/admin/compras">Cancelar</Link>
          {estado.error && <p className="admError" role="alert">{estado.error}</p>}
          <button className="admBtn admBtnPrimary" type="submit" disabled={guardando}>{guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar registro"}</button>
        </div>
      </div>

      <aside className="admRegistroLado">
        <section className="admCard">
          <h2>Resumen de la compra</h2>
          <p><strong>{cab.proveedor || "Proveedor sin indicar"}</strong>{cab.ruc_proveedor && <small className="admMuted admBlock">RUC: {cab.ruc_proveedor}</small>}</p>
          <p className="admMuted admSmall">{TIPOS_DOCUMENTO.find((t) => t.id === cab.tipo_documento)?.label}{cab.comprobante && ` ${cab.comprobante}`} · {cab.fecha}</p>
          <div className="admResumenDato"><span>Ítems registrados</span><strong>{filas.length}</strong></div>
          <div className="admResumenDato"><span>Total de unidades</span><strong>{numero(unidades, 2).replace(/[.,]00$/, "")}</strong></div>
          <div className="admResumenDato" data-total><span>Total pagado</span><strong>{soles(total)}</strong></div>
        </section>
        <section className="admCard">
          <h2>Costo unitario</h2>
          <ul className="admPrevia">
            {filas.map((f, i) => {
              const p = f.insumo_id ? porId.get(f.insumo_id) : undefined;
              return (
                <li key={i}>
                  <span className="admItemThumb">{p?.imagen ? <img src={p.imagen} alt="" /> : <span>{p?.emoji ?? "🧾"}</span>}</span>
                  <div><strong>{f.descripcion || "Sin descripción"}</strong><small className="admMuted admBlock">{numero(calculo[i].unidades, 2).replace(/[.,]00$/, "")} unidades</small></div>
                  <span className="admPreviaCosto">{calculo[i].unidades > 0 ? soles(calculo[i].unitario) : "—"}<small>por unidad</small></span>
                </li>
              );
            })}
          </ul>
          <p className="admMuted admSmall">El costo unitario de los productos del catálogo se actualiza con esta compra y se usa en el costeo de las canastas.</p>
        </section>
      </aside>
    </form>
  );
}
