import { requireAdmin } from "@/lib/admin/auth";
import { soles } from "@/lib/admin/format";
import { quitarRecetaItem } from "../../costeo/actions";
import AgregarInsumo from "./AgregarInsumo";
import CantidadReceta from "./CantidadReceta";
import OrdenReceta from "./OrdenReceta";

type FilaReceta = { insumo_id: string; cantidad: number; insumos: { nombre: string; costo_referencia: number | null } };

/** Productos de la canasta: su orden, cantidad y costo. De aquí sale "Lo que trae" en la tienda. */
export default async function SeccionReceta({ productoId }: { productoId: string }) {
  const { supabase } = await requireAdmin();
  const [{ data: recetas }, { data: costos }, { data: insumos }] = await Promise.all([
    supabase.from("recetas").select("insumo_id,cantidad,insumos(nombre,costo_referencia)").eq("producto_id", productoId).order("orden"),
    supabase.from("v_costo_insumos").select("insumo_id,costo_actual"),
    supabase.from("insumos").select("id,nombre,costo_referencia").eq("tipo", "producto").order("nombre"),
  ]);
  const costoCompra = new Map(((costos ?? []) as { insumo_id: string; costo_actual: number | null }[]).map((c) => [c.insumo_id, c.costo_actual]));
  // Costo unitario: el de la última compra; si no hay compras, el de referencia.
  const costoDe = (id: string, referencia: number | null) => {
    const costo = costoCompra.get(id) ?? referencia;
    return costo == null ? null : Number(costo);
  };

  const filas = ((recetas ?? []) as unknown as FilaReceta[]).map((r) => {
    const costo = costoDe(r.insumo_id, r.insumos.costo_referencia);
    return { id: r.insumo_id, nombre: r.insumos.nombre, cantidad: Number(r.cantidad), costo, total: costo == null ? null : costo * Number(r.cantidad) };
  });
  const total = filas.reduce((s, f) => s + (f.total ?? 0), 0);
  const sinCosto = filas.filter((f) => f.costo == null).length;
  const disponibles = ((insumos ?? []) as { id: string; nombre: string; costo_referencia: number | null }[])
    .filter((i) => !filas.some((f) => f.id === i.id))
    .map((i) => ({ id: i.id, nombre: i.nombre, costo: costoDe(i.id, i.costo_referencia) }));

  return (
    <section className="admCard admCardFlush">
      <div className="admCardHead admPad">
        <h2>Receta de productos</h2>
        <span className="admMuted">{filas.length} {filas.length === 1 ? "producto" : "productos"}</span>
      </div>
      <table className="admTable">
        <thead><tr><th>N.°</th><th>Producto</th><th className="num">Cantidad por canasta</th><th className="num">Costo unid.</th><th className="num">Costo total</th><th className="num">Acciones</th></tr></thead>
        <tbody>
          {filas.length === 0 && <tr><td colSpan={6} className="admMuted">Esta canasta todavía no tiene productos. Agrégalos con el buscador.</td></tr>}
          {filas.map((f, i) => (
            <tr key={f.id}>
              <td><OrdenReceta productoId={productoId} insumoId={f.id} posicion={i + 1} total={filas.length} nombre={f.nombre} /></td>
              <td>{f.nombre}</td>
              <td className="num"><CantidadReceta key={f.cantidad} productoId={productoId} insumoId={f.id} cantidad={f.cantidad} nombre={f.nombre} /></td>
              <td className="num">{f.costo == null ? <span className="admWarn">Sin costo</span> : soles(f.costo)}</td>
              <td className="num">{f.total == null ? "—" : soles(f.total)}</td>
              <td className="num">
                <form action={quitarRecetaItem}>
                  <input type="hidden" name="producto_id" value={productoId} />
                  <input type="hidden" name="insumo_id" value={f.id} />
                  <button className="admLinkDanger" type="submit" aria-label={`Quitar ${f.nombre}`}>Quitar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
        {filas.length > 0 && (
          <tfoot>
            <tr className="admFilaFuerte">
              <td colSpan={4}>Costo total de los productos{sinCosto > 0 && <small className="admWarn"> · {sinCosto} sin costo</small>}</td>
              <td className="num">{soles(total)}</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
      <div className="admPad">
        <AgregarInsumo productoId={productoId} productos={disponibles} />
      </div>
    </section>
  );
}
