import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, fechaCorta, inicioMesLima, numero, soles } from "@/lib/admin/format";
import { ESTADOS_ORDEN, labelEstado, type Compra, type InventarioFila, type Orden, type OrdenItem } from "@/lib/admin/types";

export const metadata = { title: "Inicio" };

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const desde = inicioMesLima();

  const [ordenesMes, compras, abiertas, items, cotPend, inventario, entregas] = await Promise.all([
    supabase.from("ordenes").select("id,total,estado").gte("created_at", `${desde}T00:00:00-05:00`).neq("estado", "anulada"),
    supabase.from("compras").select("categoria,total").gte("fecha", desde),
    supabase.from("ordenes").select("estado").neq("estado", "anulada"),
    supabase.from("orden_items").select("producto_nombre,cantidad,subtotal,ordenes!inner(created_at,estado)").gte("ordenes.created_at", `${desde}T00:00:00-05:00`).neq("ordenes.estado", "anulada"),
    supabase.from("cotizaciones").select("id", { count: "exact", head: true }).in("estado", ["pendiente", "enviada"]),
    supabase.from("v_inventario").select("*"),
    supabase.from("ordenes").select("id,numero,cliente_nombre,distrito,fecha_entrega,horario,estado").gte("fecha_entrega", desde).not("estado", "in", "(entregada,anulada)").order("fecha_entrega").limit(6),
  ]);

  const ventas = (ordenesMes.data ?? []) as Pick<Orden, "id" | "total" | "estado">[];
  const totalVentas = ventas.reduce((s, o) => s + Number(o.total), 0);
  const listaCompras = (compras.data ?? []) as Pick<Compra, "categoria" | "total">[];
  const costoProd = listaCompras.filter((c) => c.categoria === "produccion").reduce((s, c) => s + Number(c.total), 0);
  const costoMkt = listaCompras.filter((c) => c.categoria === "marketing").reduce((s, c) => s + Number(c.total), 0);
  const ganancia = totalVentas - costoProd - costoMkt;

  const porEstado = new Map<string, number>();
  (abiertas.data ?? []).forEach((o: { estado: string }) => porEstado.set(o.estado, (porEstado.get(o.estado) ?? 0) + 1));

  const porCanasta = new Map<string, { cantidad: number; importe: number }>();
  ((items.data ?? []) as unknown as OrdenItem[]).forEach((it) => {
    const acc = porCanasta.get(it.producto_nombre) ?? { cantidad: 0, importe: 0 };
    acc.cantidad += it.cantidad;
    acc.importe += Number(it.subtotal);
    porCanasta.set(it.producto_nombre, acc);
  });
  const top = [...porCanasta.entries()].sort((a, b) => b[1].cantidad - a[1].cantidad);
  const maxTop = Math.max(1, ...top.map(([, v]) => v.cantidad));

  const bajos = ((inventario.data ?? []) as InventarioFila[]).filter((i) => Number(i.stock) - Number(i.requerido_pendiente) < Number(i.stock_minimo));

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Inicio</h1>
          <p className="admMuted">Resumen del mes en curso, desde el {fecha(desde)}.</p>
        </div>
      </header>

      <section className="admKpis">
        <div className="admKpi"><span>Ventas del mes</span><strong>{soles(totalVentas)}</strong><small>{ventas.length} órdenes · ticket promedio {soles(ventas.length ? totalVentas / ventas.length : 0)}</small></div>
        <div className="admKpi"><span>Costos de producción</span><strong>{soles(costoProd)}</strong><small>compras de mercadería e insumos</small></div>
        <div className="admKpi"><span>Costos de marketing</span><strong>{soles(costoMkt)}</strong><small>publicidad, diseño, impresiones</small></div>
        <div className="admKpi" data-tone={ganancia >= 0 ? "ok" : "bad"}><span>Ganancia estimada</span><strong>{soles(ganancia)}</strong><small>ventas − costos del mes</small></div>
      </section>

      <div className="admGrid2">
        <section className="admCard">
          <div className="admCardHead"><h2>Estados de pedidos</h2><Link href="/admin/ordenes">Ver órdenes →</Link></div>
          <ul className="admStatusList">
            {ESTADOS_ORDEN.filter((e) => e.id !== "anulada").map((e) => (
              <li key={e.id}>
                <Link href={`/admin/ordenes?estado=${e.id}`}><span className="admBadge" data-estado={e.id}>{e.label}</span><strong>{porEstado.get(e.id) ?? 0}</strong></Link>
              </li>
            ))}
          </ul>
          <p className="admMuted admSmall">{cotPend.count ?? 0} cotizaciones esperando respuesta · <Link href="/admin/cotizaciones">revisar</Link></p>
        </section>

        <section className="admCard">
          <div className="admCardHead"><h2>Canastas más vendidas</h2><Link href="/admin/reportes">Reporte →</Link></div>
          {top.length === 0 ? (
            <p className="admEmpty">Todavía no hay ventas este mes.</p>
          ) : (
            <ul className="admBars">
              {top.map(([nombre, v]) => (
                <li key={nombre}>
                  <span>{nombre}</span>
                  <div className="admBar"><i style={{ width: `${(v.cantidad / maxTop) * 100}%` }} /></div>
                  <strong>{numero(v.cantidad)}</strong>
                  <small>{soles(v.importe)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admCard">
          <div className="admCardHead"><h2>Próximas entregas</h2><Link href="/admin/ordenes">Ver todas →</Link></div>
          {(entregas.data ?? []).length === 0 ? (
            <p className="admEmpty">No hay entregas programadas.</p>
          ) : (
            <table className="admTable admTableCompact">
              <thead><tr><th>N.º OP</th><th>Fecha de entrega</th><th>Horario de entrega</th><th>Distrito</th><th>Estado</th></tr></thead>
              <tbody>
                {(entregas.data as Orden[]).map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/ordenes/${o.id}`}>{o.numero}</Link></td>
                    <td>{fechaCorta(o.fecha_entrega)}</td>
                    <td>{o.horario ?? "—"}</td>
                    <td>{o.distrito ?? "—"}</td>
                    <td><span className="admBadge" data-estado={o.estado}>{labelEstado(o.estado)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admCard">
          <div className="admCardHead"><h2>Stock por reponer</h2><Link href="/admin/produccion">Producción →</Link></div>
          {bajos.length === 0 ? (
            <p className="admEmpty">Todo el stock cubre los pedidos pendientes.</p>
          ) : (
            <table className="admTable admTableCompact">
              <thead><tr><th>Insumo</th><th className="num">Stock</th><th className="num">Pendiente</th><th className="num">Mínimo</th></tr></thead>
              <tbody>
                {bajos.slice(0, 8).map((i) => (
                  <tr key={i.insumo_id}>
                    <td>{i.nombre}</td>
                    <td className="num">{numero(i.stock)}</td>
                    <td className="num">{numero(i.requerido_pendiente)}</td>
                    <td className="num">{numero(i.stock_minimo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
