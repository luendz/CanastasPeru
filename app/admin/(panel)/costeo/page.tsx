import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import type { CostoInsumo, CosteoCanasta, Insumo, Receta } from "@/lib/admin/types";
import { LINEAS } from "@/lib/lineas";
import { guardarCostosCanasta, guardarRecetaItem, quitarRecetaItem } from "./actions";

export const metadata = { title: "Costeo por canasta" };

export default async function CosteoPage() {
  const { supabase } = await requireAdmin();
  const [{ data: costeo }, { data: prods }, { data: recetas }, { data: costos }, { data: insumos }] = await Promise.all([
    supabase.from("v_costeo_canastas").select("*").order("precio"),
    supabase.from("productos").select("id,categoria,activo"),
    supabase.from("recetas").select("*"),
    supabase.from("v_costo_insumos").select("*"),
    supabase.from("insumos").select("*").order("tipo").order("nombre"),
  ]);
  const canastas = (costeo ?? []) as CosteoCanasta[];
  const lista = (recetas ?? []) as Receta[];
  const costoDe = new Map(((costos ?? []) as CostoInsumo[]).map((c) => [c.insumo_id, c]));
  const todos = (insumos ?? []) as Insumo[];
  const infoDe = new Map(((prods ?? []) as { id: string; categoria: string; activo: boolean }[]).map((x) => [x.id, x]));
  const normal = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const grupos = [
    ...LINEAS.filter((l) => l.id !== "boxes").map((l) => ({
      titulo: l.titulo,
      id: l.id,
      canastas: canastas.filter((c) => normal(infoDe.get(c.producto_id)?.categoria ?? "").startsWith(normal(l.categoria).slice(0, 6))),
    })),
  ];
  const agrupadas = new Set(grupos.flatMap((g) => g.canastas.map((c) => c.producto_id)));
  const otras = canastas.filter((c) => !agrupadas.has(c.producto_id));
  if (otras.length) grupos.push({ titulo: "Otras canastas", id: "economicas", canastas: otras });

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Costeo por canasta</h1>
          <p className="admMuted">Costo de cada canasta (víveres + presentación), margen y utilidad sobre su valor de venta. Edita los costos aquí o en la ficha de la canasta. Si una canasta no tiene costos cargados, se calcula con su receta y la última compra de cada producto.</p>
        </div>
      </header>

      {grupos.filter((g) => g.canastas.length).map((g) => (
        <section key={g.titulo} className="admCosteoGrupo" data-linea={g.id}>
          <h2>{g.titulo}</h2>
          <div className="admCosteoGrid">
            {g.canastas.map((c) => (
              <form key={c.producto_id} action={guardarCostosCanasta} className="admCosteoCard">
                <input type="hidden" name="producto_id" value={c.producto_id} />
                <h3>{c.nombre}{infoDe.get(c.producto_id)?.activo === false && <small> · oculta</small>}</h3>
                <table>
                  <tbody>
                    <tr><td>Costo total de víveres</td><td><input className="admInput admInputSm" name="costo_viveres" type="number" min="0" step="0.01" defaultValue={c.costo_viveres ?? ""} placeholder={c.fuente === "receta" ? String(c.costo_receta) : ""} aria-label={`Costo de víveres de ${c.nombre}`} /></td></tr>
                    <tr><td>Costo de presentación</td><td><input className="admInput admInputSm" name="costo_presentacion" type="number" min="0" step="0.01" defaultValue={c.costo_presentacion ?? ""} aria-label={`Costo de presentación de ${c.nombre}`} /></td></tr>
                    <tr className="admFilaFuerte"><td>Costo total de canasta</td><td>{soles(c.costo)}</td></tr>
                    <tr><td>Margen</td><td data-tone={Number(c.margen_pct ?? 0) >= 30 ? "ok" : Number(c.margen_pct ?? 0) >= 10 ? "warn" : "bad"}>{c.margen_pct === null ? "—" : `${numero(c.margen_pct, 1)} %`}</td></tr>
                    <tr><td>Valor venta</td><td>{soles(c.precio)}</td></tr>
                    <tr className="admFilaFuerte"><td>Utilidad</td><td data-tone={Number(c.margen) >= 0 ? "ok" : "bad"}>{soles(c.margen)}</td></tr>
                  </tbody>
                </table>
                <div className="admCosteoPie">
                  <small className="admMuted">{c.fuente === "tabla" ? "Costos cargados a mano" : Number(c.insumos_sin_costo) > 0 ? `Según receta · ${c.insumos_sin_costo} insumos sin compras` : "Según receta"}</small>
                  <button className="admLinkMuted" type="submit">Guardar</button>
                </div>
              </form>
            ))}
          </div>
        </section>
      ))}

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
                  const costo = costoDe.get(r.insumo_id)?.costo_actual;
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
