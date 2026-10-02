"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { numero, soles } from "@/lib/admin/format";
import { PRESENTACIONES, type Insumo } from "@/lib/admin/types";
import SelectorImagen from "../medios/SelectorImagen";
import { guardarProducto, type ProductoState } from "./actions";

type Props = {
  producto: Insumo | null;
  skuSugerido: string;
  categorias: string[];
  inventario: { stock: number; requerido: number } | null;
  costo: { actual: number | null; fecha: string | null; proveedor: string | null } | null;
};

export default function FichaProducto({ producto: p, skuSugerido, categorias, inventario, costo }: Props) {
  const [estado, accion, guardando] = useActionState<ProductoState, FormData>(guardarProducto, {});
  const [presentacion, setPresentacion] = useState(p?.presentacion_compra ?? "Unidad");

  return (
    <form action={accion} className="admFicha">
      {p && <input type="hidden" name="id" value={p.id} />}

      <section className="admCard admForm admFormGrid">
        <label>SKU
          <input className="admInput" name="sku" required maxLength={30} defaultValue={p?.sku ?? skuSugerido} />
        </label>
        <label>Categoría
          <input className="admInput" name="categoria" maxLength={60} list="categorias" defaultValue={p?.categoria ?? ""} placeholder="Ej. Menestras, Panetones, Chocolates" />
          <datalist id="categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="admSpan2">Nombre del producto
          <input className="admInput" name="nombre" required maxLength={160} defaultValue={p?.nombre ?? ""} placeholder="Nombre, marca y presentación: Lentejita Bebé Komilón 400 g" />
          <small className="admMuted">Es la descripción completa que sale en las cotizaciones, las órdenes y la página de cada canasta.</small>
        </label>

        <label>Tipo
          <select className="admInput" name="tipo" defaultValue={p?.tipo ?? "producto"}>
            <option value="producto">Producto (va dentro de las canastas)</option>
            <option value="empaque">Empaque (cestas, cajas, cintas, tarjetas)</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        <div className="admField">
          <span className="admFieldLabel">Presentación de compra</span>
          <div className="admPresentacionCompra">
            <input className="admInput num" name="unidades_por_presentacion" type="number" min={1} step="any" defaultValue={p?.unidades_por_presentacion ?? 1} disabled={presentacion === "Unidad"} aria-label="Unidades por presentación" />
            <span>unid. por</span>
            <select className="admInput" name="presentacion_compra" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} aria-label="Presentación">
              {PRESENTACIONES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <small className="admMuted">Ej.: 6 unid. por paquete. Se usa para calcular el costo unitario al registrar una compra.</small>
        </div>

        <div className="admField">
          <span className="admFieldLabel">Inventario (existencias)</span>
          <div className="admDatoAuto">{inventario ? numero(inventario.stock) : "—"} <small>unidades</small></div>
          <small className="admMuted">Se actualiza solo: suma las compras y descuenta los pedidos en preparación o entregados.{inventario && inventario.requerido > 0 ? ` Pedidos pendientes: ${numero(inventario.requerido)}.` : ""}</small>
        </div>
        <div className="admField">
          <span className="admFieldLabel">Costo unitario</span>
          <div className="admDatoAuto">{costo?.actual != null ? soles(costo.actual) : "Sin compras"}</div>
          <small className="admMuted">
            {costo?.actual != null ? `De la compra más reciente${costo.fecha ? ` (${costo.fecha}${costo.proveedor ? ` · ${costo.proveedor}` : ""})` : ""}. ` : ""}
            No se edita a mano: se toma de <Link href="/admin/compras">Costos totales</Link>.
          </small>
        </div>

        <div className="admField admSpan2">
          <span className="admFieldLabel">Imagen</span>
          <div className="admFichaImagen">
            <SelectorImagen name="imagen" defaultValue={p?.imagen} label="Foto del producto" />
            <label className="admEmojiLabel">Emoji si no hay foto
              <input className="admInput admInputEmoji" name="emoji" maxLength={8} defaultValue={p?.emoji ?? "📦"} />
            </label>
          </div>
          <small className="admMuted">PNG o WebP con fondo transparente. Se usa en la composición de todas las canastas que lo llevan.</small>
        </div>

        <label>Costo de referencia (S/, con IGV)
          <input className="admInput" name="costo_referencia" type="number" min={0} step="0.0001" defaultValue={p?.costo_referencia ?? ""} placeholder="Ej. 12.50" />
          <small className="admMuted">Costo unitario para cotizar mientras no haya compras registradas; con una compra, manda la compra.</small>
        </label>

        <details className="admSpan2 admAjustes">
          <summary>Ajustes de inventario</summary>
          <div className="admFormGrid">
            <label>Stock inicial
              <input className="admInput" name="stock_inicial" type="number" step="any" defaultValue={p?.stock_inicial ?? 0} />
              <small className="admMuted">Lo que ya tenías antes de registrar compras.</small>
            </label>
            <label>Stock mínimo
              <input className="admInput" name="stock_minimo" type="number" min={0} step="any" defaultValue={p?.stock_minimo ?? 0} />
              <small className="admMuted">Avisa en el inicio cuando queda por debajo.</small>
            </label>
            <label>Unidad de medida
              <input className="admInput" name="unidad" maxLength={30} defaultValue={p?.unidad ?? "unidad"} />
            </label>
          </div>
        </details>

        <div className="admSpan2 admFormFootRow">
          <button className="admBtn admBtnPrimary" type="submit" disabled={guardando}>{guardando ? "Guardando…" : p ? "Guardar cambios" : "Crear producto"}</button>
          <Link className="admBtn" href="/admin/productos">Cancelar</Link>
          {estado.error && <span className="admError" role="alert">{estado.error}</span>}
        </div>
      </section>
    </form>
  );
}
