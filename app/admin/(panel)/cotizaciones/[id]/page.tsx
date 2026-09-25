import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, fechaHora, numero, soles } from "@/lib/admin/format";
import { labelEstado, type Cotizacion, type CotizacionItem, type Producto, type TipoCanasta } from "@/lib/admin/types";
import ConfirmButton from "../../ConfirmButton";
import { actualizarCotizacion, agregarItemCotizacion, aprobarCotizacion, quitarItemCotizacion } from "../actions";

export const metadata = { title: "Cotización" };

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: cot }, { data: items }, { data: productos }, { data: tipos }, { data: orden }] = await Promise.all([
    supabase.from("cotizaciones").select("*").eq("id", id).maybeSingle(),
    supabase.from("cotizacion_items").select("*").eq("cotizacion_id", id),
    supabase.from("productos").select("*").order("precio"),
    supabase.from("tipos_canasta").select("*").order("recargo"),
    supabase.from("ordenes").select("id,numero").eq("cotizacion_id", id).maybeSingle(),
  ]);
  if (!cot) notFound();
  const c = cot as Cotizacion;
  const lineas = (items ?? []) as CotizacionItem[];
  const total = lineas.reduce((s, it) => s + Number(it.subtotal), 0);
  const unidades = lineas.reduce((s, it) => s + it.cantidad, 0);
  const editable = c.estado !== "aprobada";

  const dato = (label: string, value: React.ReactNode) => <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/cotizaciones" className="admLinkMuted">← Cotizaciones</Link>
          <h1>{c.numero} <span className="admBadge" data-estado={c.estado}>{labelEstado(c.estado)}</span></h1>
          <p className="admMuted">{c.empresa} · recibida el {fechaHora(c.created_at)}</p>
        </div>
        {orden && <Link className="admBtn" href={`/admin/ordenes/${orden.id}`}>Ver orden {orden.numero} →</Link>}
      </header>

      <div className="admGrid2 admGridDetail">
        <div className="admStack">
          <section className="admCard">
            <h2>Lo que pidió el cliente</h2>
            <dl className="admDl">
              {dato("Empresa", c.empresa)}
              {dato("RUC", c.ruc)}
              {dato("Contacto", `${c.contacto}${c.cargo ? ` · ${c.cargo}` : ""}`)}
              {dato("Correo", c.email)}
              {dato("Celular", c.telefono)}
              {dato("Cantidad estimada", c.cantidad_estimada ? `${numero(c.cantidad_estimada)} canastas` : null)}
              {dato("Presupuesto por unidad", c.presupuesto)}
              {dato("Fecha requerida", fecha(c.fecha_requerida))}
              {dato("Lugar de entrega", c.lugar_entrega)}
              {dato("Canastas de referencia", c.canastas_base.join(", "))}
              {dato("Personalización", c.personalizacion.join(", "))}
            </dl>
            {c.requerimientos && <blockquote className="admQuote">{c.requerimientos}</blockquote>}
          </section>

          <section className="admCard">
            <h2>Propuesta</h2>
            {lineas.length === 0 ? (
              <p className="admEmpty">Agrega las canastas y el precio por volumen que vas a ofrecer.</p>
            ) : (
              <table className="admTable">
                <thead><tr><th>Canasta</th><th>Tipo</th><th className="num">Cant.</th><th className="num">P. unit.</th><th className="num">Subtotal</th>{editable && <th />}</tr></thead>
                <tbody>
                  {lineas.map((it) => (
                    <tr key={it.id}>
                      <td>{it.producto_nombre}</td>
                      <td>{(tipos as TipoCanasta[] | null)?.find((t) => t.id === it.tipo_canasta)?.nombre ?? it.tipo_canasta ?? "—"}</td>
                      <td className="num">{numero(it.cantidad)}</td>
                      <td className="num">{soles(it.precio_unitario)}</td>
                      <td className="num">{soles(it.subtotal)}</td>
                      {editable && (
                        <td className="num">
                          <form action={quitarItemCotizacion}>
                            <input type="hidden" name="id" value={it.id} />
                            <input type="hidden" name="cotizacion_id" value={c.id} />
                            <button className="admLinkDanger" type="submit">Quitar</button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="admTotalRow"><td colSpan={2}>Total</td><td className="num">{numero(unidades)}</td><td /><td className="num">{soles(total)}</td>{editable && <td />}</tr>
                </tfoot>
              </table>
            )}

            {editable && (
              <form action={agregarItemCotizacion} className="admInlineForm">
                <input type="hidden" name="cotizacion_id" value={c.id} />
                <label>Canasta
                  <select className="admInput" name="producto_id" required>
                    {((productos ?? []) as Producto[]).map((p) => <option key={p.id} value={p.id}>{p.nombre} · {soles(p.precio)}</option>)}
                  </select>
                </label>
                <label>Tipo
                  <select className="admInput" name="tipo_canasta" defaultValue="">
                    <option value="">La de la canasta</option>
                    {((tipos ?? []) as TipoCanasta[]).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </label>
                <label>Cantidad
                  <input className="admInput" name="cantidad" type="number" min={1} defaultValue={c.cantidad_estimada ?? 20} required />
                </label>
                <label>Precio unitario
                  <input className="admInput" name="precio_unitario" type="number" min={0} step="0.01" placeholder="Precio de catálogo" />
                </label>
                <button className="admBtn" type="submit">Agregar</button>
              </form>
            )}
          </section>
        </div>

        <aside className="admCard admSticky">
          <h2>Gestionar</h2>
          {editable ? (
            <>
              <form action={actualizarCotizacion} className="admForm">
                <input type="hidden" name="id" value={c.id} />
                <label>Estado
                  <select className="admInput" name="estado" defaultValue={c.estado}>
                    <option value="pendiente">Pendiente</option>
                    <option value="enviada">Enviada al cliente</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </label>
                <label>Válida hasta
                  <input className="admInput" type="date" name="valida_hasta" defaultValue={c.valida_hasta ?? ""} />
                </label>
                <label>Notas internas
                  <textarea className="admInput" name="notas" rows={3} defaultValue={c.notas ?? ""} />
                </label>
                <button className="admBtn" type="submit">Guardar</button>
              </form>

              <form action={aprobarCotizacion} className="admApprove">
                <input type="hidden" name="id" value={c.id} />
                <p>Aprobar crea una orden de pedido con estas {numero(unidades)} canastas por {soles(total)}.</p>
                <ConfirmButton className="admBtn admBtnPrimary" disabled={lineas.length === 0} message={`¿Aprobar ${c.numero} y crear la orden de pedido?`}>
                  Aprobar y crear orden
                </ConfirmButton>
              </form>
            </>
          ) : (
            <p className="admMuted">Esta cotización ya fue aprobada{orden ? <> y generó la orden <Link href={`/admin/ordenes/${orden.id}`}>{orden.numero}</Link></> : ""}.</p>
          )}
        </aside>
      </div>
    </>
  );
}
