import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, fechaHora, numero } from "@/lib/admin/format";
import { ESTADOS_COTIZACION, labelEstado, type Cotizacion } from "@/lib/admin/types";

export const metadata = { title: "Cotizaciones" };

export default async function CotizacionesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { supabase } = await requireAdmin();
  const { estado = "" } = await searchParams;

  let query = supabase.from("cotizaciones").select("*").order("created_at", { ascending: false }).limit(200);
  if (estado) query = query.eq("estado", estado);
  const { data, error } = await query;
  const cotizaciones = (data ?? []) as Cotizacion[];

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Cotizaciones</h1>
          <p className="admMuted">Llegan desde el formulario de empresas. Al aprobarlas se convierten en órdenes de pedido.</p>
        </div>
      </header>

      <nav className="admTabs" aria-label="Filtrar por estado">
        <Link href="/admin/cotizaciones" aria-current={!estado ? "page" : undefined}>Todas</Link>
        {ESTADOS_COTIZACION.map((e) => (
          <Link key={e.id} href={`/admin/cotizaciones?estado=${e.id}`} aria-current={estado === e.id ? "page" : undefined}>{e.label}</Link>
        ))}
      </nav>

      {error && <p className="admError">No se pudieron cargar: {error.message}</p>}

      <div className="admCard admCardFlush">
        {cotizaciones.length === 0 ? (
          <p className="admEmpty">No hay cotizaciones {estado ? "en este estado" : "todavía"}.</p>
        ) : (
          <table className="admTable">
            <thead><tr><th>N.º</th><th>Recibida</th><th>Empresa</th><th>Contacto</th><th className="num">Cantidad</th><th>Presupuesto</th><th>Para</th><th>Estado</th></tr></thead>
            <tbody>
              {cotizaciones.map((c) => (
                <tr key={c.id}>
                  <td><Link className="admStrongLink" href={`/admin/cotizaciones/${c.id}`}>{c.numero}</Link></td>
                  <td>{fechaHora(c.created_at)}</td>
                  <td>{c.empresa}<small className="admMuted admBlock">{c.ruc ?? ""}</small></td>
                  <td>{c.contacto}<small className="admMuted admBlock">{c.email ?? c.telefono ?? ""}</small></td>
                  <td className="num">{c.cantidad_estimada ? numero(c.cantidad_estimada) : "—"}</td>
                  <td>{c.presupuesto ?? "—"}</td>
                  <td>{fecha(c.fecha_requerida)}</td>
                  <td><span className="admBadge" data-estado={c.estado}>{labelEstado(c.estado)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
