import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, fechaHora, soles } from "@/lib/admin/format";
import { ESTADOS_ORDEN, labelEstado, type Orden, type OrdenItem } from "@/lib/admin/types";
import { actualizarOrden } from "../actions";

export const metadata = { title: "Orden" };

export default async function OrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: orden }, { data: items }] = await Promise.all([
    supabase.from("ordenes").select("*").eq("id", id).maybeSingle(),
    supabase.from("orden_items").select("*").eq("orden_id", id),
  ]);
  if (!orden) notFound();
  const o = orden as Orden;
  const lineas = (items ?? []) as OrdenItem[];

  const dato = (label: string, value: React.ReactNode) => (
    <div><dt>{label}</dt><dd>{value || "—"}</dd></div>
  );

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/ordenes" className="admLinkMuted">← Órdenes</Link>
          <h1>{o.numero} <span className="admBadge" data-estado={o.estado}>{labelEstado(o.estado)}</span></h1>
          <p className="admMuted">
            Creada el {fechaHora(o.created_at)} desde {o.origen === "web" ? "la web" : o.origen === "cotizacion" ? "una cotización" : "el panel"}
            {o.cotizacion_id && <> · <Link href={`/admin/cotizaciones/${o.cotizacion_id}`}>ver cotización</Link></>}
          </p>
        </div>
      </header>

      <div className="admGrid2 admGridDetail">
        <div className="admStack">
          <section className="admCard">
            <h2>Canastas</h2>
            <table className="admTable">
              <thead><tr><th>Canasta</th><th>Tipo</th><th className="num">Cant.</th><th className="num">P. unit.</th><th className="num">Subtotal</th></tr></thead>
              <tbody>
                {lineas.map((it) => (
                  <tr key={it.id}>
                    <td>{it.producto_nombre}</td>
                    <td>{it.tipo_canasta ?? "—"}</td>
                    <td className="num">{it.cantidad}</td>
                    <td className="num">{soles(it.precio_unitario)}</td>
                    <td className="num">{soles(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={4}>Subtotal</td><td className="num">{soles(o.subtotal)}</td></tr>
                <tr><td colSpan={4}>Delivery</td><td className="num">{soles(o.delivery)}</td></tr>
                <tr className="admTotalRow"><td colSpan={4}>Total</td><td className="num">{soles(o.total)}</td></tr>
              </tfoot>
            </table>
          </section>

          <section className="admCard">
            <h2>Cliente y comprobante</h2>
            <dl className="admDl">
              {dato("Cliente", o.cliente_nombre)}
              {dato("Correo", o.cliente_email)}
              {dato("Celular", o.cliente_telefono)}
              {dato("Comprobante", o.comprobante_tipo === "factura" ? "Factura" : "Boleta")}
              {dato(o.comprobante_tipo === "factura" ? "RUC" : "DNI", o.comprobante_documento)}
              {dato(o.comprobante_tipo === "factura" ? "Razón social" : "Nombre", o.comprobante_nombre)}
              {o.comprobante_tipo === "factura" && dato("Dirección fiscal", o.direccion_fiscal)}
              {dato("Método de pago", o.metodo_pago)}
            </dl>
          </section>

          <section className="admCard">
            <h2>Entrega</h2>
            <dl className="admDl">
              {dato("Fecha", fecha(o.fecha_entrega))}
              {dato("Horario", o.horario)}
              {dato("Distrito", o.distrito)}
              {dato("Dirección", o.direccion)}
              {dato("Referencia", o.referencia)}
              {dato("Recibe", o.recibe_nombre ? `${o.recibe_nombre}${o.recibe_telefono ? ` · ${o.recibe_telefono}` : ""}` : null)}
            </dl>
            {o.dedicatoria && <blockquote className="admQuote">“{o.dedicatoria}”</blockquote>}
          </section>
        </div>

        <aside className="admCard admSticky">
          <h2>Gestionar</h2>
          <form action={actualizarOrden} className="admForm">
            <input type="hidden" name="id" value={o.id} />
            <label>
              Estado del pedido
              <select className="admInput" name="estado" defaultValue={o.estado}>
                {ESTADOS_ORDEN.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </label>
            <label>
              Pago
              <select className="admInput" name="estado_pago" defaultValue={o.estado_pago}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </label>
            <label>
              Notas internas
              <textarea className="admInput" name="notas" rows={4} defaultValue={o.notas ?? ""} />
            </label>
            <button className="admBtn admBtnPrimary" type="submit">Guardar cambios</button>
          </form>
          <p className="admMuted admSmall">Al pasar a “En preparación”, los insumos de la receta se descuentan del inventario.</p>
        </aside>
      </div>
    </>
  );
}
