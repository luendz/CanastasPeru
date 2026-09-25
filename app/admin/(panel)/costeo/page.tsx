import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import type { CostoInsumo, CosteoCanasta, Insumo, Receta } from "@/lib/admin/types";
import { guardarRecetaItem, quitarRecetaItem } from "./actions";

export const metadata = { title: "Costeo por canasta" };

export default async function CosteoPage() {
  const { supabase } = await requireAdmin();
  const [{ data: costeo }, { data: recetas }, { data: costos }, { data: insumos }] = await Promise.all([
    supabase.from("v_costeo_canastas").select("*").order("precio"),
    supabase.from("recetas").select("*"),
    supabase.from("v_costo_insumos").select("*"),
    supabase.from("insumos").select("*").order("tipo").order("nombre"),
  ]);
  const canastas = (costeo ?? []) as CosteoCanasta[];
  const lista = (recetas ?? []) as Receta[];
  const costoDe = new Map(((costos ?? []) as CostoInsumo[]).map((c) => [c.insumo_id, c]));
  const todos = (insumos ?? []) as Insumo[];

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Costeo por canasta</h1>
          <p className="admMuted">Costo = cantidad de cada insumo de la receta × su costo promedio en las compras de producción. El margen se calcula sobre el precio de catálogo.</p>
        </div>
      </header>

      <div className="admCard admCardFlush">
        <table className="admTable">
          <thead><tr><th>Canasta</th><th className="num">Precio</th><th className="num">Costo</th><th className="num">Margen</th><th className="num">Margen %</th><th>Observación</th></tr></thead>
          <tbody>
            {canastas.map((c) => (
              <tr key={c.producto_id}>
                <td><a className="admStrongLink" href={`#receta-${c.slug}`}>{c.nombre}</a></td>
                <td className="num">{soles(c.precio)}</td>
                <td className="num">{soles(c.costo)}</td>
                <td className="num" data-tone={Number(c.margen) >= 0 ? "ok" : "bad"}>{soles(c.margen)}</td>
                <td className="num">
                  <span className="admMeter" data-tone={Number(c.margen_pct ?? 0) >= 30 ? "ok" : Number(c.margen_pct ?? 0) >= 10 ? "warn" : "bad"}>
                    <i style={{ width: `${Math.max(0, Math.min(100, Number(c.margen_pct ?? 0)))}%` }} />
                  </span>
                  {c.margen_pct === null ? "—" : `${numero(c.margen_pct, 1)} %`}
                </td>
                <td>{Number(c.insumos_sin_costo) > 0 ? <span className="admWarn">{c.insumos_sin_costo} insumos sin compras registradas</span> : <span className="admMuted">Costo completo</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canastas.map((c) => {
        const items = lista.filter((r) => r.producto_id === c.producto_id);
        const disponibles = todos.filter((i) => !items.some((r) => r.insumo_id === i.id));
        return (
          <section className="admCard" id={`receta-${c.slug}`} key={c.producto_id}>
            <div className="admCardHead"><h2>Receta · {c.nombre}</h2><span className="admMuted">Costo {soles(c.costo)} · precio {soles(c.precio)}</span></div>
            <table className="admTable admTableCompact">
              <thead><tr><th>Insumo</th><th className="num">Cantidad</th><th className="num">Costo prom.</th><th className="num">Subtotal</th><th /></tr></thead>
              <tbody>
                {items.map((r) => {
                  const insumo = todos.find((i) => i.id === r.insumo_id);
                  const costo = costoDe.get(r.insumo_id)?.costo_promedio;
                  return (
                    <tr key={r.insumo_id}>
                      <td>{insumo?.nombre}<small className="admMuted"> · {insumo?.unidad}</small></td>
                      <td className="num">
                        <form action={guardarRecetaItem} className="admCellForm">
                          <input type="hidden" name="producto_id" value={c.producto_id} />
                          <input type="hidden" name="insumo_id" value={r.insumo_id} />
                          <input className="admInput admInputSm" type="number" name="cantidad" min="0.01" step="0.01" defaultValue={r.cantidad} aria-label={`Cantidad de ${insumo?.nombre}`} />
                          <button className="admLinkMuted" type="submit">Guardar</button>
                        </form>
                      </td>
                      <td className="num">{costo == null ? <span className="admWarn">sin compras</span> : soles(costo)}</td>
                      <td className="num">{costo == null ? "—" : soles(Number(costo) * Number(r.cantidad))}</td>
                      <td className="num">
                        <form action={quitarRecetaItem}>
                          <input type="hidden" name="producto_id" value={c.producto_id} />
                          <input type="hidden" name="insumo_id" value={r.insumo_id} />
                          <button className="admLinkDanger" type="submit">Quitar</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {disponibles.length > 0 && (
              <form action={guardarRecetaItem} className="admInlineForm">
                <input type="hidden" name="producto_id" value={c.producto_id} />
                <label>Agregar insumo
                  <select className="admInput" name="insumo_id">
                    {disponibles.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                  </select>
                </label>
                <label>Cantidad<input className="admInput" type="number" name="cantidad" min="0.01" step="0.01" defaultValue={1} /></label>
                <button className="admBtn" type="submit">Agregar</button>
              </form>
            )}
          </section>
        );
      })}
    </>
  );
}
