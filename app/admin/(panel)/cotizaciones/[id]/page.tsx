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
import { editarDatosCotizacion } from "../actions";
import AgregarLinea, { type CanastaOpcion } from "./AgregarLinea";
import GestionarCotizacion from "./GestionarCotizacion";

export const metadata = { title: "Cotización" };

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: cot }, { data: items }, { data: productos }, { data: tipos }, { data: orden }, { data: insumos }, trae, contenido, { data: recetas }, { data: costos }] = await Promise.all([
    supabase.from("cotizaciones").select("*").eq("id", id).maybeSingle(),
    supabase.from("cotizacion_items").select("*").eq("cotizacion_id", id),
    supabase.from("productos").select("*").order("precio"),
    supabase.from("tipos_canasta").select("*").order("recargo"),
    supabase.from("ordenes").select("id,numero").eq("cotizacion_id", id).maybeSingle(),
    supabase.from("insumos").select("id,nombre,costo_referencia").eq("tipo", "producto").order("nombre"),
    productosPorCanasta(supabase),
    getContenido(),
    supabase.from("recetas").select("producto_id,insumo_id,cantidad,insumos!inner(tipo)").eq("insumos.tipo", "producto"),
    supabase.from("v_costo_insumos").select("insumo_id,costo_actual"),
  ]);
  if (!cot) notFound();
  const c = cot as Cotizacion;
  const lineas = (items ?? []) as CotizacionItem[];
  const total = lineas.reduce((s, it) => s + Number(it.subtotal), 0);
  const unidades = lineas.reduce((s, it) => s + it.cantidad, 0);
  const editable = c.estado !== "aprobada";

  // Costo unitario: el de la última compra; si no hay compras, el de referencia.
  const costoCompra = new Map(((costos ?? []) as { insumo_id: string; costo_actual: number | null }[]).map((x) => [x.insumo_id, x.costo_actual]));
  const productosCosteo = ((insumos ?? []) as { id: string; nombre: string; costo_referencia: number | null }[]).map((i) => {
    const costo = costoCompra.get(i.id) ?? i.costo_referencia;
    return { id: i.id, nombre: i.nombre, costo: costo == null ? null : Number(costo) };
  });
  const recetaDe = new Map<string, { insumo_id: string; cantidad: number }[]>();
  for (const r of (recetas ?? []) as { producto_id: string; insumo_id: string; cantidad: number }[]) {
    recetaDe.set(r.producto_id, [...(recetaDe.get(r.producto_id) ?? []), { insumo_id: r.insumo_id, cantidad: Number(r.cantidad) }]);
  }
  const canastas: CanastaOpcion[] = ((productos ?? []) as Producto[]).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: Number(p.precio),
    tipoBase: p.tipo_canasta_base,
    costoPresentacion: p.costo_presentacion == null ? null : Number(p.costo_presentacion),
    receta: recetaDe.get(p.id) ?? [],
  }));

  const dato = (label: string, value: React.ReactNode) => <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/cotizaciones" className="admLinkMuted">← Cotizaciones</Link>
          <h1>{c.numero} <span className="admBadge" data-estado={c.estado}>{labelEstado(c.estado)}</span></h1>
          <p className="admMuted">{c.empresa} · creada el {fechaCorta(c.created_at)} · {labelCanal(c.canal)}</p>
        </div>
        {orden && <Link className="admBtn" href={`/admin/ordenes/${orden.id}`}>Ver orden {orden.numero} →</Link>}
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
                    { clave: "distrito", etiqueta: "Ciudad / Distrito", max: 120 },
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
              {dato("Ciudad / Distrito", c.distrito)}
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
                        {it.producto_nombre}
                        <small className="admMuted admBlock">{(it.contenido ?? trae.get(it.producto_id ?? "") ?? []).map(etiquetaProducto).join(" · ")}</small>
                      </td>
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
              <AgregarLinea
                cotizacionId={c.id}
                cantidadInicial={c.cantidad_estimada ?? 20}
                canastas={canastas}
                envases={((tipos ?? []) as TipoCanasta[]).map((t) => ({ id: t.id, nombre: t.nombre, recargo: Number(t.recargo) }))}
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
              />

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
