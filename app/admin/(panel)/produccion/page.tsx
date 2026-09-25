import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { numero } from "@/lib/admin/format";
import type { InventarioFila, OrdenItem } from "@/lib/admin/types";
import { actualizarInsumo, crearInsumo } from "./actions";

export const metadata = { title: "Producción e inventario" };

export default async function ProduccionPage() {
  const { supabase } = await requireAdmin();
  const [{ data: inv }, { data: pendientes }] = await Promise.all([
    supabase.from("v_inventario").select("*").order("tipo").order("nombre"),
    supabase.from("orden_items").select("producto_nombre,cantidad,ordenes!inner(estado)").in("ordenes.estado", ["nueva", "pendiente", "preparacion"]),
  ]);
  const inventario = (inv ?? []) as InventarioFila[];

  const porCanasta = new Map<string, number>();
  ((pendientes ?? []) as unknown as OrdenItem[]).forEach((it) => porCanasta.set(it.producto_nombre, (porCanasta.get(it.producto_nombre) ?? 0) + it.cantidad));
  const totalCanastas = [...porCanasta.values()].reduce((s, n) => s + n, 0);

  const filas = inventario.map((i) => {
    const stock = Number(i.stock);
    const requerido = Number(i.requerido_pendiente);
    const faltante = Math.max(0, requerido - stock);
    const despues = stock - requerido;
    const estado = faltante > 0 ? "falta" : despues < Number(i.stock_minimo) ? "bajo" : "ok";
    return { ...i, stock, requerido, faltante, despues, estado };
  });
  const aComprar = filas.filter((f) => f.faltante > 0);

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Producción e inventario</h1>
          <p className="admMuted">
            El stock suma las compras de producción ligadas a cada insumo y descuenta las canastas en preparación o entregadas.
            Lo “requerido” sale de los pedidos nuevos y pendientes.
          </p>
        </div>
      </header>

      <div className="admGrid2">
        <section className="admCard">
          <div className="admCardHead"><h2>Canastas por armar</h2><span className="admMuted">{numero(totalCanastas)} en total</span></div>
          {porCanasta.size === 0 ? (
            <p className="admEmpty">No hay pedidos pendientes de armar.</p>
          ) : (
            <table className="admTable admTableCompact">
              <tbody>
                {[...porCanasta.entries()].sort((a, b) => b[1] - a[1]).map(([nombre, n]) => (
                  <tr key={nombre}><td>{nombre}</td><td className="num"><strong>{numero(n)}</strong></td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="admMuted admSmall">Incluye órdenes nuevas, pendientes y en preparación. <Link href="/admin/ordenes">Ver órdenes</Link></p>
        </section>

        <section className="admCard">
          <div className="admCardHead"><h2>Lista de compras</h2><Link href="/admin/compras">Registrar compra →</Link></div>
          {aComprar.length === 0 ? (
            <p className="admEmpty">El stock cubre todos los pedidos pendientes.</p>
          ) : (
            <table className="admTable admTableCompact">
              <thead><tr><th>Insumo</th><th className="num">Falta comprar</th></tr></thead>
              <tbody>
                {aComprar.map((f) => <tr key={f.insumo_id}><td>{f.nombre}</td><td className="num"><strong>{numero(f.faltante, 2).replace(/[.,]00$/, "")}</strong> <small className="admMuted">{f.unidad}</small></td></tr>)}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="admCard admCardFlush">
        <div className="admCardHead admPad"><h2>Inventario de insumos</h2></div>
        <table className="admTable">
          <thead><tr><th>Insumo</th><th>Tipo</th><th className="num">Stock</th><th className="num">Requerido</th><th className="num">Queda</th><th>Estado</th><th>Stock inicial · mínimo</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.insumo_id}>
                <td>{f.nombre}<small className="admMuted"> · {f.unidad}</small></td>
                <td>{f.tipo === "producto" ? "Producto" : f.tipo === "empaque" ? "Empaque" : "Otro"}</td>
                <td className="num">{numero(f.stock)}</td>
                <td className="num">{numero(f.requerido)}</td>
                <td className="num" data-tone={f.despues < 0 ? "bad" : undefined}>{numero(f.despues)}</td>
                <td><span className="admBadge" data-stock={f.estado}>{f.estado === "falta" ? "Falta" : f.estado === "bajo" ? "Bajo mínimo" : "OK"}</span></td>
                <td>
                  <form action={actualizarInsumo} className="admCellForm">
                    <input type="hidden" name="id" value={f.insumo_id} />
                    <input className="admInput admInputSm" type="number" step="0.01" name="stock_inicial" defaultValue={f.stock_inicial} aria-label={`Stock inicial de ${f.nombre}`} title="Stock inicial (lo que ya tenías antes de registrar compras)" />
                    <input className="admInput admInputSm" type="number" step="0.01" min="0" name="stock_minimo" defaultValue={f.stock_minimo} aria-label={`Stock mínimo de ${f.nombre}`} title="Stock mínimo" />
                    <button className="admLinkMuted" type="submit">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admCard">
        <h2>Nuevo insumo</h2>
        <form action={crearInsumo} className="admInlineForm">
          <label>Nombre<input className="admInput" name="nombre" required maxLength={120} placeholder="Ej. Chocolate Sublime" /></label>
          <label>Unidad<input className="admInput" name="unidad" placeholder="unidad" maxLength={30} /></label>
          <label>Tipo
            <select className="admInput" name="tipo"><option value="producto">Producto</option><option value="empaque">Empaque</option><option value="otro">Otro</option></select>
          </label>
          <label>Stock mínimo<input className="admInput" type="number" name="stock_minimo" min="0" step="1" defaultValue={0} /></label>
          <button className="admBtn" type="submit">Crear</button>
        </form>
      </section>
    </>
  );
}
