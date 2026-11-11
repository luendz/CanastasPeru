import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { hoyLima, numero } from "@/lib/admin/format";
import type { InventarioFila, OrdenItem } from "@/lib/admin/types";
import { actualizarInsumo } from "./actions";
import BotonExcelInventario from "./BotonExcelInventario";
import type { DatosInventario } from "./excel";

export const metadata = { title: "Producción e inventario" };

export default async function ProduccionPage() {
  const { supabase } = await requireAdmin();
  const [{ data: inv }, { data: pendientes }] = await Promise.all([
    supabase.from("v_inventario").select("*").order("tipo").order("nombre"),
    supabase.from("orden_items").select("canasta_nombre,cantidad,ordenes!inner(estado)").in("ordenes.estado", ["nueva", "pendiente", "preparacion"]).is("ordenes.eliminado_at", null),
  ]);
  const inventario = (inv ?? []) as InventarioFila[];

  const porCanasta = new Map<string, number>();
  ((pendientes ?? []) as unknown as OrdenItem[]).forEach((it) => porCanasta.set(it.canasta_nombre, (porCanasta.get(it.canasta_nombre) ?? 0) + it.cantidad));
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
  const tipoTexto = (t: string) => (t === "producto" ? "Producto" : t === "envase" ? "Envase" : "Otro");

  // Lo mismo que se ve en la página, para el Excel.
  const excel: DatosInventario = {
    fecha: hoyLima(),
    porArmar: [...porCanasta.entries()].sort((a, b) => b[1] - a[1]).map(([canasta, cantidad]) => ({ canasta, cantidad })),
    aComprar: aComprar.map((f) => ({ nombre: f.nombre, unidad: f.unidad, falta: f.faltante })),
    inventario: filas.map((f) => ({
      nombre: f.nombre, tipo: tipoTexto(f.tipo), unidad: f.unidad, stockInicial: Number(f.stock_inicial), stock: f.stock,
      requerido: f.requerido, queda: f.despues, minimo: Number(f.stock_minimo), estado: f.estado as "ok" | "bajo" | "falta",
    })),
  };

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Producción e inventario</h1>
          <p className="admMuted">
            El stock suma las compras registradas de cada producto y descuenta las canastas en preparación o entregadas.
            Lo “requerido” sale de los pedidos nuevos y pendientes.
          </p>
        </div>
        <BotonExcelInventario datos={excel} />
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
          <div className="admCardHead"><h2>Lista de compras</h2><Link href="/admin/compras/registrar">Registrar compra →</Link></div>
          {aComprar.length === 0 ? (
            <p className="admEmpty">El stock cubre todos los pedidos pendientes.</p>
          ) : (
            <table className="admTable admTableCompact">
              <thead><tr><th>Artículo</th><th className="num">Falta comprar</th></tr></thead>
              <tbody>
                {aComprar.map((f) => <tr key={f.articulo_id}><td className="admCeldaLarga">{f.nombre}</td><td className="num"><strong>{numero(f.faltante, 2).replace(/[.,]00$/, "")}</strong> <small className="admMuted">{f.unidad}</small></td></tr>)}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="admCard admCardFlush">
        <div className="admCardHead admPad"><h2>Inventario de artículos</h2><Link href="/admin/productos/nuevo">+ Añadir artículo</Link></div>
        <table className="admTable">
          <thead><tr><th>Artículo</th><th>Tipo</th><th className="num">Stock</th><th className="num">Requerido</th><th className="num">Queda</th><th>Estado</th><th>Stock inicial · mínimo</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.articulo_id}>
                <td className="admCeldaLarga"><Link className="admLinkPlano" href={`/admin/productos/${f.articulo_id}`}>{f.nombre}</Link></td>
                <td>{tipoTexto(f.tipo)}</td>
                <td className="num">{numero(f.stock)}</td>
                <td className="num">{numero(f.requerido)}</td>
                <td className="num" data-tone={f.despues < 0 ? "bad" : undefined}>{numero(f.despues)}</td>
                <td><span className="admBadge" data-stock={f.estado}>{f.estado === "falta" ? "Falta" : f.estado === "bajo" ? "Bajo mínimo" : "OK"}</span></td>
                <td>
                  <form action={actualizarInsumo} className="admCellForm">
                    <input type="hidden" name="id" value={f.articulo_id} />
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

    </>
  );
}
