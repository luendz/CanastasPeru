import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, fechaHora, soles } from "@/lib/admin/format";
import { ESTADOS_ORDEN, labelEstado, type Orden } from "@/lib/admin/types";

export const metadata = { title: "Órdenes" };

type Search = { estado?: string; origen?: string; q?: string };

export default async function OrdenesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const { estado = "", origen = "", q = "" } = await searchParams;

  let query = supabase.from("ordenes").select("*").order("created_at", { ascending: false }).limit(200);
  if (estado) query = query.eq("estado", estado);
  if (origen) query = query.eq("origen", origen);
  const texto = q.trim().replace(/[%,()]/g, "");
  if (texto) query = query.or(`numero.ilike.%${texto}%,cliente_nombre.ilike.%${texto}%,cliente_email.ilike.%${texto}%`);
  const { data, error } = await query;
  const ordenes = (data ?? []) as Orden[];

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Órdenes de pedido</h1>
          <p className="admMuted">Se crean solas con cada compra de la web y al aprobar una cotización.</p>
        </div>
      </header>

      <form className="admFilters" method="get">
        <input className="admInput" name="q" defaultValue={q} placeholder="Buscar por número, cliente o correo" />
        <select className="admInput" name="estado" defaultValue={estado}>
          <option value="">Todos los estados</option>
          {ESTADOS_ORDEN.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
        <select className="admInput" name="origen" defaultValue={origen}>
          <option value="">Web y cotizaciones</option>
          <option value="web">Web</option>
          <option value="cotizacion">Cotización</option>
          <option value="manual">Manual</option>
        </select>
        <button className="admBtn" type="submit">Filtrar</button>
        {(estado || origen || q) && <Link className="admLinkMuted" href="/admin/ordenes">Limpiar</Link>}
      </form>

      {error && <p className="admError">No se pudieron cargar las órdenes: {error.message}</p>}

      <div className="admCard admCardFlush">
        {ordenes.length === 0 ? (
          <p className="admEmpty">No hay órdenes con estos filtros.</p>
        ) : (
          <table className="admTable">
            <thead>
              <tr><th>N.º</th><th>Creada</th><th>Cliente</th><th>Origen</th><th>Entrega</th><th className="num">Total</th><th>Pago</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id}>
                  <td><Link className="admStrongLink" href={`/admin/ordenes/${o.id}`}>{o.numero}</Link></td>
                  <td>{fechaHora(o.created_at)}</td>
                  <td>{o.cliente_nombre}<small className="admMuted admBlock">{o.cliente_email ?? o.cliente_telefono ?? ""}</small></td>
                  <td>{o.origen === "web" ? "Web" : o.origen === "cotizacion" ? "Cotización" : "Manual"}</td>
                  <td>{fecha(o.fecha_entrega)}<small className="admMuted admBlock">{o.distrito ?? ""}</small></td>
                  <td className="num">{soles(o.total)}</td>
                  <td><span className="admBadge" data-pago={o.estado_pago}>{o.estado_pago === "pagado" ? "Pagado" : "Pendiente"}</span></td>
                  <td><span className="admBadge" data-estado={o.estado}>{labelEstado(o.estado)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
