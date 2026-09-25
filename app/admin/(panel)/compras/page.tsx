import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { fecha, hoyLima, numero, soles } from "@/lib/admin/format";
import type { Compra, Insumo } from "@/lib/admin/types";
import ConfirmButton from "../ConfirmButton";
import { eliminarCompra } from "./actions";
import CompraForm from "./CompraForm";

export const metadata = { title: "Compras y costos" };

export default async function ComprasPage({ searchParams }: { searchParams: Promise<{ mes?: string; categoria?: string }> }) {
  const { supabase } = await requireAdmin();
  const hoy = hoyLima();
  const { mes = hoy.slice(0, 7), categoria = "" } = await searchParams;
  const [anio, m] = mes.split("-").map(Number);
  const desde = `${mes}-01`;
  const hasta = new Date(Date.UTC(anio, m, 1)).toISOString().slice(0, 10);

  let query = supabase.from("compras").select("*").gte("fecha", desde).lt("fecha", hasta).order("fecha", { ascending: false }).order("created_at", { ascending: false });
  if (categoria) query = query.eq("categoria", categoria);
  const [{ data, error }, { data: insumos }] = await Promise.all([query, supabase.from("insumos").select("*").order("tipo").order("nombre")]);
  const compras = (data ?? []) as Compra[];
  const listaInsumos = (insumos ?? []) as Insumo[];

  const total = (cat: string) => compras.filter((c) => c.categoria === cat).reduce((s, c) => s + Number(c.total), 0);
  const porSub = new Map<string, number>();
  compras.forEach((c) => {
    const k = `${c.categoria === "produccion" ? "Producción" : "Marketing"} · ${c.subcategoria ?? "Sin subcategoría"}`;
    porSub.set(k, (porSub.get(k) ?? 0) + Number(c.total));
  });

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Compras y costos</h1>
          <p className="admMuted">Registra cada compra de mercadería, insumos o marketing. Las de producción ligadas a un insumo suman stock y definen el costo de cada canasta.</p>
        </div>
      </header>

      <div className="admGrid2 admGridDetail">
        <div className="admStack">
          <form className="admFilters" method="get">
            <label className="admInlineLabel">Mes<input className="admInput" type="month" name="mes" defaultValue={mes} /></label>
            <select className="admInput" name="categoria" defaultValue={categoria}>
              <option value="">Producción y marketing</option>
              <option value="produccion">Solo producción</option>
              <option value="marketing">Solo marketing</option>
            </select>
            <button className="admBtn" type="submit">Ver</button>
            <Link className="admLinkMuted" href="/admin/reportes">Descargar en Excel →</Link>
          </form>

          <section className="admKpis admKpis3">
            <div className="admKpi"><span>Producción</span><strong>{soles(total("produccion"))}</strong></div>
            <div className="admKpi"><span>Marketing</span><strong>{soles(total("marketing"))}</strong></div>
            <div className="admKpi"><span>Total del mes</span><strong>{soles(total("produccion") + total("marketing"))}</strong><small>{compras.length} compras</small></div>
          </section>

          {error && <p className="admError">No se pudieron cargar las compras: {error.message}</p>}

          <div className="admCard admCardFlush">
            {compras.length === 0 ? (
              <p className="admEmpty">No hay compras registradas en este mes.</p>
            ) : (
              <table className="admTable">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Proveedor</th><th className="num">Cant.</th><th className="num">C. unit.</th><th className="num">Total</th><th /></tr></thead>
                <tbody>
                  {compras.map((c) => (
                    <tr key={c.id}>
                      <td>{fecha(c.fecha)}</td>
                      <td><span className="admBadge" data-cat={c.categoria}>{c.categoria === "produccion" ? "Producción" : "Marketing"}</span><small className="admMuted admBlock">{c.subcategoria ?? ""}</small></td>
                      <td>{c.descripcion}{c.insumo_id && <small className="admMuted admBlock">+ stock: {listaInsumos.find((i) => i.id === c.insumo_id)?.nombre}</small>}</td>
                      <td>{c.proveedor ?? "—"}<small className="admMuted admBlock">{c.comprobante ?? ""}</small></td>
                      <td className="num">{numero(c.cantidad, Number.isInteger(Number(c.cantidad)) ? 0 : 2)}</td>
                      <td className="num">{soles(c.costo_unitario)}</td>
                      <td className="num"><strong>{soles(c.total)}</strong></td>
                      <td className="num">
                        <form action={eliminarCompra}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton className="admLinkDanger" message={`¿Eliminar la compra "${c.descripcion}"?`}>Eliminar</ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {porSub.size > 0 && (
            <section className="admCard">
              <h2>Por subcategoría</h2>
              <table className="admTable admTableCompact">
                <tbody>
                  {[...porSub.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td className="num">{soles(v)}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>

        <aside className="admCard admSticky">
          <h2>Nueva compra</h2>
          <CompraForm insumos={listaInsumos} hoy={hoy} />
        </aside>
      </div>
    </>
  );
}
