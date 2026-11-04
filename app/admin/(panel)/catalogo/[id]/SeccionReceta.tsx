import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import { quitarRecetaItem } from "../../costeo/actions";
import AgregarInsumo from "./AgregarInsumo";
import CantidadReceta from "./CantidadReceta";
import OrdenReceta from "./OrdenReceta";

type FilaReceta = { articulo_id: string; cantidad: number; articulos: { nombre: string; costo_referencia: number | null } };

/** Productos de la canasta: su orden, cantidad y costo. De aquí sale "Lo que trae" en la tienda. */
export default async function SeccionReceta({ productoId }: { productoId: string }) {
  const { supabase } = await requireAdmin();
  const [{ data: recetas }, { data: costos }, { data: insumos }] = await Promise.all([
    supabase.from("canasta_articulos").select("articulo_id,cantidad,articulos(nombre,costo_referencia)").eq("canasta_id", productoId).order("orden"),
    supabase.from("v_costo_articulos").select("articulo_id,costo_actual"),
    supabase.from("articulos").select("id,nombre,costo_referencia").eq("tipo", "producto").order("nombre"),
  ]);
  const costoCompra = new Map(((costos ?? []) as { articulo_id: string; costo_actual: number | null }[]).map((c) => [c.articulo_id, c.costo_actual]));
  // Costo unitario: el de la última compra; si no hay compras, el de referencia.
  const costoDe = (id: string, referencia: number | null) => {
    const costo = costoCompra.get(id) ?? referencia;
    return costo == null ? null : Number(costo);
  };

  const filas = ((recetas ?? []) as unknown as FilaReceta[]).map((r) => {
    const costo = costoDe(r.articulo_id, r.articulos.costo_referencia);
    return { id: r.articulo_id, nombre: r.articulos.nombre, cantidad: Number(r.cantidad), costo, total: costo == null ? null : costo * Number(r.cantidad) };
  });
  const total = filas.reduce((s, f) => s + (f.total ?? 0), 0);
  const unidades = filas.reduce((s, f) => s + f.cantidad, 0);
  const sinCosto = filas.filter((f) => f.costo == null).length;
  const disponibles = ((insumos ?? []) as { id: string; nombre: string; costo_referencia: number | null }[])
    .filter((i) => !filas.some((f) => f.id === i.id))
    .map((i) => ({ id: i.id, nombre: i.nombre, costo: costoDe(i.id, i.costo_referencia) }));

  return (
    <section className="admCard admCardFlush admCardAbierta">
      <div className="admCardHead admPad">
        <div>
          <h2>1. Contenido de la canasta</h2>
          <p className="admMuted admSmall">Lo que va dentro. Es igual para todos los envases.</p>
        </div>
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
                  <input type="hidden" name="canasta_id" value={productoId} />
                  <input type="hidden" name="articulo_id" value={f.id} />
                  <button className="admLinkDanger" type="submit" aria-label={`Quitar ${f.nombre}`}>Quitar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
        {filas.length > 0 && (
          <tfoot>
            <tr className="admFilaFuerte">
              <td colSpan={2}>Costo del contenido{sinCosto > 0 && <small className="admWarn"> · {sinCosto} sin costo</small>}</td>
              <td className="num">{numero(unidades, Number.isInteger(unidades) ? 0 : 2)} {unidades === 1 ? "unidad" : "unidades"}</td>
              <td />
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
