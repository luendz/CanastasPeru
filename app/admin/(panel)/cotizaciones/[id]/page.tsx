import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, fechaCorta, numero, soles } from "@/lib/admin/format";
import { etiquetaProducto, productosPorCanasta } from "@/lib/admin/recetas";
import { labelCanal, labelEstado, type Cotizacion, type CotizacionItem, type Producto, type TipoCanasta } from "@/lib/admin/types";
import { getContenido } from "@/lib/contenido";
import ConfirmButton from "../../ConfirmButton";
import { aprobarCotizacion, quitarItemCotizacion } from "../actions";
import EditarDatos from "../../EditarDatos";
import { editarDatosCotizacion, eliminarCotizacion, restaurarCotizacion } from "../actions";
import AgregarLinea, { type CanastaOpcion } from "./AgregarLinea";
import BotonPdfCotizacion from "../BotonPdfCotizacion";
import EditarLinea from "./EditarLinea";
import GestionarCotizacion from "./GestionarCotizacion";
import BotonEliminar from "../../BotonEliminar";
import { distritosDelivery, opcionesDistrito } from "../distritos";
import { DELIVERY_GRATIS_DESDE, deliveryCotizacion } from "@/lib/admin/delivery";

export const metadata = { title: "Cotización" };

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: cot }, { data: items }, { data: productos }, { data: tipos }, { data: orden }, { data: insumos }, trae, contenido, { data: recetas }, { data: costos }, { data: envasesCanasta }, distritos] = await Promise.all([
    supabase.from("cotizaciones").select("*").eq("id", id).maybeSingle(),
    supabase.from("cotizacion_items").select("*").eq("cotizacion_id", id),
    supabase.from("canastas").select("*").order("precio"),
    supabase.from("envases").select("*").order("recargo"),
    supabase.from("ordenes").select("id,numero").eq("cotizacion_id", id).maybeSingle(),
    supabase.from("articulos").select("id,nombre,costo_referencia").eq("tipo", "producto").order("nombre"),
    productosPorCanasta(supabase),
    getContenido(),
    supabase.from("canasta_articulos").select("canasta_id,articulo_id,cantidad,articulos!inner(tipo)").eq("articulos.tipo", "producto").order("orden"),
    supabase.from("v_costo_articulos").select("articulo_id,costo_actual"),
    supabase.from("v_envases_canasta").select("canasta_id,envase_id,precio,costo_presentacion"),
    distritosDelivery(supabase),
  ]);
  if (!cot) notFound();
  const c = cot as Cotizacion;
  const lineas = (items ?? []) as CotizacionItem[];
  const subtotal = lineas.reduce((s, it) => s + Number(it.subtotal), 0);
  const unidades = lineas.reduce((s, it) => s + it.cantidad, 0);
  const delivery = deliveryCotizacion(c.delivery, unidades);
  const deliveryGratis = Number(c.delivery) > 0 && delivery === 0;
  const total = subtotal + delivery;
  const editable = c.estado !== "aprobada";

  // Costo unitario: el de la última compra; si no hay compras, el de referencia.
  const costoCompra = new Map(((costos ?? []) as { articulo_id: string; costo_actual: number | null }[]).map((x) => [x.articulo_id, x.costo_actual]));
  const productosCosteo = ((insumos ?? []) as { id: string; nombre: string; costo_referencia: number | null }[]).map((i) => {
    const costo = costoCompra.get(i.id) ?? i.costo_referencia;
    return { id: i.id, nombre: i.nombre, costo: costo == null ? null : Number(costo) };
  });
  const recetaDe = new Map<string, { articulo_id: string; cantidad: number }[]>();
  for (const r of (recetas ?? []) as { canasta_id: string; articulo_id: string; cantidad: number }[]) {
    recetaDe.set(r.canasta_id, [...(recetaDe.get(r.canasta_id) ?? []), { articulo_id: r.articulo_id, cantidad: Number(r.cantidad) }]);
  }
  const envasesDe = new Map<string, { id: string; precio: number; costo: number | null }[]>();
  for (const e of (envasesCanasta ?? []) as { canasta_id: string; envase_id: string; precio: number; costo_presentacion: number | null }[]) {
    envasesDe.set(e.canasta_id, [...(envasesDe.get(e.canasta_id) ?? []), { id: e.envase_id, precio: Number(e.precio), costo: e.costo_presentacion == null ? null : Number(e.costo_presentacion) }]);
  }
  const canastas: CanastaOpcion[] = ((productos ?? []) as Producto[]).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: Number(p.precio),
    tipoBase: p.envase_base_id,
    costoPresentacion: envasesDe.get(p.id)?.find((e) => e.id === p.envase_base_id)?.costo ?? null,
    envases: envasesDe.get(p.id) ?? [],
    receta: recetaDe.get(p.id) ?? [],
  }));
  const envases = ((tipos ?? []) as TipoCanasta[]).map((t) => ({ id: t.id, nombre: t.nombre, recargo: Number(t.recargo) }));

  const dato = (label: string, value: React.ReactNode) => <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/cotizaciones" className="admLinkMuted">← Cotizaciones</Link>
          <h1>{c.numero} <span className="admBadge" data-estado={c.estado}>{labelEstado(c.estado)}</span>{c.eliminado_at && <> <span className="admBadge" data-estado="anulada">Eliminada el {fechaCorta(c.eliminado_at)}</span></>}</h1>
          <p className="admMuted">{c.empresa} · creada el {fechaCorta(c.created_at)} · {labelCanal(c.canal)}</p>
        </div>
        <div className="admHeadAcciones">
          {c.eliminado_at ? (
            <BotonEliminar id={c.id} accion={restaurarCotizacion} tipo="restaurar" variante="boton" mensaje={`¿Restaurar la cotización ${c.numero}?`} />
          ) : (
            <BotonEliminar id={c.id} accion={eliminarCotizacion} volver variante="boton" mensaje={`¿Eliminar la cotización ${c.numero}?${orden ? ` La orden ${orden.numero} no cambia.` : ""} Podrás restaurarla desde Eliminadas.`} />
          )}
          {orden && <Link className="admBtn" href={`/admin/ordenes/${orden.id}`}>Ver orden {orden.numero} →</Link>}
        </div>
      </header>

      <div className="admGrid2 admGridDetail">
        <div className="admStack">
          <section className="admCard">
            <div className="admCardHead">
              <h2>Detalle de la cotización</h2>
              {editable && (
                <EditarDatos
                  titulo={`Editar cotización · ${c.numero}`}
                  id={c.id}
                  accion={editarDatosCotizacion}
                  valores={c as unknown as Record<string, string | number | null>}
                  campos={[
                    { clave: "empresa", etiqueta: "Empresa / Razón social", max: 200 },
                    { clave: "ruc", etiqueta: "RUC", max: 11 },
                    { clave: "contacto", etiqueta: "Nombre de contacto", max: 160 },
                    { clave: "cargo", etiqueta: "Cargo", max: 120 },
                    { clave: "email", etiqueta: "Correo", tipo: "email", max: 160 },
                    { clave: "telefono", etiqueta: "Celular / WhatsApp", tipo: "tel", max: 40 },
                    { clave: "cantidad_estimada", etiqueta: "Cantidad estimada", tipo: "numero" },
                    { clave: "presupuesto", etiqueta: "Presupuesto por canasta", max: 60 },
                    { clave: "fecha_requerida", etiqueta: "Fecha requerida", tipo: "fecha" },
                    { clave: "distrito", etiqueta: "Ciudad / Distrito", tipo: "buscar", opciones: opcionesDistrito(distritos), requerido: true },
                    { clave: "lugar_entrega", etiqueta: "Dirección de entrega", ancho: true, max: 300 },
                    { clave: "requerimientos", etiqueta: "Requerimientos", tipo: "area", ancho: true, max: 2000 },
                  ]}
                />
              )}
            </div>
            <dl className="admDl">
              {dato("Empresa / Razón social", c.empresa)}
              {dato("RUC", c.ruc)}
              {dato("Contacto", `${c.contacto}${c.cargo ? ` · ${c.cargo}` : ""}`)}
              {dato("Correo", c.email)}
              {dato("Celular", c.telefono)}
              {dato("Cantidad estimada", c.cantidad_estimada ? `${numero(c.cantidad_estimada)} canastas` : null)}
              {dato("Presupuesto por unidad", c.presupuesto)}
              {dato("Fecha requerida", fecha(c.fecha_requerida))}
              {dato("Dirección de entrega", c.lugar_entrega)}
              {dato("Ciudad / Distrito", c.distrito ? `${c.distrito}${Number(c.delivery) > 0 ? ` · delivery ${soles(c.delivery)}` : ""}` : null)}
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
                <thead><tr><th>Tipo de canasta</th><th>Envase</th><th className="num">Cantidad</th><th className="num">Precio unid.</th><th className="num">Sub total</th>{editable && <th />}</tr></thead>
                <tbody>
                  {lineas.map((it) => (
                    <tr key={it.id}>
                      <td>
                        {it.canasta_nombre}
                        <small className="admMuted admBlock">{(it.contenido ?? trae.get(it.canasta_id ?? "") ?? []).map(etiquetaProducto).join(" · ")}</small>
                      </td>
                      <td>{(tipos as TipoCanasta[] | null)?.find((t) => t.id === it.envase_id)?.nombre ?? it.envase_id ?? "—"}</td>
                      <td className="num">{numero(it.cantidad)}</td>
                      <td className="num">{soles(it.precio_unitario)}</td>
                      <td className="num">{soles(it.subtotal)}</td>
                      {editable && (
                        <td className="num">
                          <div className="admAccionesLinea">
                            <EditarLinea
                              cotizacionId={c.id}
                              linea={{ id: it.id, productoId: it.canasta_id, nombre: it.canasta_nombre, envase: it.envase_id, cantidad: it.cantidad, precio: Number(it.precio_unitario), contenido: it.contenido }}
                              canastas={canastas}
                              envases={envases}
                              productos={productosCosteo}
                            />
                            <form action={quitarItemCotizacion}>
                              <input type="hidden" name="id" value={it.id} />
                              <input type="hidden" name="cotizacion_id" value={c.id} />
                              <button className="admLinkDanger" type="submit">Quitar</button>
                            </form>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="admSubtotalRow"><td colSpan={4}>Canastas</td><td className="num">{soles(subtotal)}</td>{editable && <td />}</tr>
                  <tr className="admSubtotalRow">
                    <td colSpan={4}>
                      Delivery{c.distrito ? ` · ${c.distrito}` : ""}
                      {!c.distrito && <span className="admMuted"> · elige el distrito en Gestionar</span>}
                      {deliveryGratis && <span className="admMuted"> · gratis por más de {DELIVERY_GRATIS_DESDE} canastas</span>}
                    </td>
                    <td className="num">{deliveryGratis ? "Gratis" : soles(delivery)}</td>{editable && <td />}
                  </tr>
                  <tr className="admTotalRow"><td colSpan={2}>Total</td><td className="num">{numero(unidades)}</td><td /><td className="num">{soles(total)}</td>{editable && <td />}</tr>
                </tfoot>
              </table>
            )}

            {editable && (
              <AgregarLinea
                cotizacionId={c.id}
                cantidadInicial={c.cantidad_estimada ?? 20}
                canastas={canastas}
                envases={envases}
                productos={productosCosteo}
              />
            )}
          </section>
        </div>

        <aside className="admCard admSticky">
          <h2>Gestionar</h2>
          {editable ? (
            <>
              <GestionarCotizacion
                id={c.id}
                numero={c.numero}
                estado={c.estado}
                canal={c.canal}
                validaHasta={c.valida_hasta}
                notas={c.notas}
                extra={{ asesor: c.asesor, forma_pago: c.forma_pago, horario_entrega: c.horario_entrega, distrito: c.distrito }}
                porDefecto={{ formaPago: contenido.cotizacion.pdfFormaPago }}
                cliente={{ contacto: c.contacto, telefono: c.telefono, email: c.email }}
                resumen={{ unidades, total }}
                marca={contenido.marca.nombre}
                distritos={distritos}
              />

              <form action={aprobarCotizacion} className="admApprove">
                <input type="hidden" name="id" value={c.id} />
                <p>Aprobar crea una orden de pedido con estas {numero(unidades)} canastas por {soles(total)}{delivery > 0 ? ` (incluye delivery ${soles(delivery)})` : ""}.</p>
                <ConfirmButton className="admBtn admBtnPrimary" disabled={lineas.length === 0} message={`¿Aprobar ${c.numero} y crear la orden de pedido?`}>
                  Aprobar y crear orden
                </ConfirmButton>
              </form>
            </>
          ) : (
            <p className="admMuted">Esta cotización ya fue aprobada{orden ? <> y generó la orden <Link href={`/admin/ordenes/${orden.id}`}>{orden.numero}</Link></> : ""}.</p>
          )}
          <div className="admPdfBox">
            <BotonPdfCotizacion id={c.id} numero={c.numero} />
          </div>
        </aside>
      </div>
    </>
  );
}
