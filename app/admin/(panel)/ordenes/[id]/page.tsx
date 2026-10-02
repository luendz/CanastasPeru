import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, fechaCorta, soles } from "@/lib/admin/format";
import { labelCanal, labelEstado, type Orden, type OrdenItem } from "@/lib/admin/types";
import { etiquetaProducto, productosPorCanasta } from "@/lib/admin/recetas";
import EditarDatos from "../../EditarDatos";
import { editarDatosOrden } from "../actions";
import BotonPdfOrden from "../BotonPdfOrden";
import GestionarOrden from "./GestionarOrden";

export const metadata = { title: "Orden" };

export default async function OrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: orden }, { data: items }, { data: tipos }, trae] = await Promise.all([
    supabase.from("ordenes").select("*").eq("id", id).maybeSingle(),
    supabase.from("orden_items").select("*").eq("orden_id", id),
    supabase.from("tipos_canasta").select("id,nombre"),
    productosPorCanasta(supabase),
  ]);
  if (!orden) notFound();
  const o = orden as Orden;
  const lineas = (items ?? []) as OrdenItem[];
  const envase = new Map((tipos ?? []).map((t: { id: string; nombre: string }) => [t.id, t.nombre]));

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
            Creada el {fechaCorta(o.created_at)} · {labelCanal(o.canal)}{o.origen === "cotizacion" ? " · desde una cotización" : ""}
            {o.cotizacion_id && <> · <Link href={`/admin/cotizaciones/${o.cotizacion_id}`}>ver cotización</Link></>}
          </p>
        </div>
        <div className="admHeadAcciones">
          <EditarDatos
            variante="boton"
            etiquetaBoton="Editar"
            titulo={`Editar datos · ${o.numero}`}
            id={o.id}
            accion={editarDatosOrden}
            valores={o as unknown as Record<string, string | null>}
            campos={[
              { clave: "cliente_nombre", etiqueta: "Cliente", max: 160 },
              { clave: "cliente_telefono", etiqueta: "Celular / WhatsApp", tipo: "tel", max: 40 },
              { clave: "cliente_email", etiqueta: "Correo", tipo: "email", max: 160 },
              { clave: "comprobante_tipo", etiqueta: "Comprobante", tipo: "select", opciones: [{ valor: "boleta", texto: "Boleta" }, { valor: "factura", texto: "Factura" }] },
              { clave: "comprobante_documento", etiqueta: "DNI / RUC", max: 11, ayuda: "8 dígitos para DNI, 11 para RUC." },
              { clave: "comprobante_nombre", etiqueta: "Nombre / Razón social", max: 200 },
              { clave: "direccion_fiscal", etiqueta: "Dirección fiscal (factura)", ancho: true, max: 300 },
              { clave: "fecha_entrega", etiqueta: "Fecha de entrega", tipo: "fecha" },
              { clave: "distrito", etiqueta: "Distrito", max: 80 },
              { clave: "direccion", etiqueta: "Dirección de entrega", max: 300 },
              { clave: "referencia", etiqueta: "Referencia", ancho: true, max: 300 },
              { clave: "recibe_nombre", etiqueta: "Recibe", max: 160 },
              { clave: "recibe_telefono", etiqueta: "Celular de quien recibe", tipo: "tel", max: 40 },
            ]}
          />
        </div>
      </header>

      <div className="admGrid2 admGridDetail">
        <div className="admStack">
          <section className="admCard">
            <h2>Datos del cliente</h2>
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
            <h2>Detalles de entrega</h2>
            <dl className="admDl">
              {dato("Fecha de entrega", fecha(o.fecha_entrega))}
              {dato("Distrito", o.distrito)}
              {dato("Dirección", o.direccion)}
              {dato("Referencia", o.referencia)}
              {dato("Recibe", o.recibe_nombre ? `${o.recibe_nombre}${o.recibe_telefono ? ` · ${o.recibe_telefono}` : ""}` : null)}
            </dl>
            {o.dedicatoria && <blockquote className="admQuote">“{o.dedicatoria}”</blockquote>}
          </section>

          <section className="admCard">
            <h2>Detalle de canasta</h2>
            <table className="admTable">
              <thead><tr><th>Tipo de canasta</th><th>Envase</th><th className="num">Cantidad</th><th className="num">Precio unid.</th><th className="num">Sub total</th></tr></thead>
              <tbody>
                {lineas.map((it) => (
                  <tr key={it.id}>
                    <td>
                      {it.producto_nombre}
                      <small className="admMuted admBlock">{(it.contenido ?? trae.get(it.producto_id ?? "") ?? []).map(etiquetaProducto).join(" · ")}</small>
                    </td>
                    <td>{it.tipo_canasta ? envase.get(it.tipo_canasta) ?? it.tipo_canasta : "—"}</td>
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
        </div>

        <aside className="admCard admSticky">
          <h2>Gestionar</h2>
          <GestionarOrden orden={o} />
          <div className="admPdfBox">
            <BotonPdfOrden id={o.id} numero={o.numero} />
          </div>
          <p className="admMuted admSmall">Al pasar a “En preparación”, los insumos de la receta se descuentan del inventario. Una orden “Nuevo” pasa sola a “Pendiente” a las 24 horas.</p>
        </aside>
      </div>
    </>
  );
}
