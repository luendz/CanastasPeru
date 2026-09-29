import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import type { CostoInsumo, Insumo, InventarioFila } from "@/lib/admin/types";
import PestanasProductos from "./PestanasProductos";

export const metadata = { title: "Productos" };

type Search = { q?: string; categoria?: string; tipo?: string; guardado?: string };

export default async function ProductosPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const { q = "", categoria = "", tipo = "", guardado } = await searchParams;

  const [{ data: insumos, error }, { data: inv }, { data: costos }] = await Promise.all([
    supabase.from("insumos").select("*").order("sku"),
    supabase.from("v_inventario").select("insumo_id,stock,requerido_pendiente,stock_minimo"),
    supabase.from("v_costo_insumos").select("insumo_id,costo_actual"),
  ]);
  const todos = (insumos ?? []) as Insumo[];
  const stock = new Map(((inv ?? []) as InventarioFila[]).map((i) => [i.insumo_id, i]));
  const costo = new Map(((costos ?? []) as CostoInsumo[]).map((c) => [c.insumo_id, c.costo_actual]));
  const categorias = [...new Set(todos.map((i) => i.categoria).filter(Boolean) as string[])].sort();

  const texto = q.trim().toLowerCase();
  const lista = todos.filter(
    (i) =>
      (!categoria || i.categoria === categoria) &&
      (!tipo || i.tipo === tipo) &&
      (!texto || i.nombre.toLowerCase().includes(texto) || i.sku.toLowerCase().includes(texto)),
  );

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Productos</h1>
          <p className="admMuted">Cada producto con su SKU, categoría, presentación e imagen. El inventario y el costo se actualizan solos con las compras.</p>
        </div>
      </header>

      <PestanasProductos actual="productos" />

      {guardado && <p className="admSuccess" role="status">Producto {guardado} guardado.</p>}
      {error && <p className="admError">No se pudieron cargar los productos: {error.message}</p>}

      <form className="admFilters admFiltrosProductos" method="get">
        <Link className="admBtn admBtnPrimary" href="/admin/productos/nuevo">+ Añadir nuevo</Link>
        <input className="admInput" name="q" defaultValue={q} placeholder="Buscar producto por nombre o SKU" />
        <select className="admInput" name="categoria" defaultValue={categoria} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="admInput" name="tipo" defaultValue={tipo} aria-label="Filtrar por tipo">
          <option value="">Productos y empaques</option>
          <option value="producto">Solo productos</option>
          <option value="empaque">Solo empaques</option>
          <option value="otro">Otros</option>
        </select>
        <button className="admBtn" type="submit">Filtrar</button>
        {(q || categoria || tipo) && <Link className="admLinkMuted" href="/admin/productos">Limpiar</Link>}
      </form>

      <div className="admCard admCardFlush">
        {lista.length === 0 ? (
          <p className="admEmpty">No hay productos con estos filtros.</p>
        ) : (
          <table className="admTable admTablaProductos">
            <thead>
              <tr><th /><th>SKU</th><th>Descripción</th><th className="num">Inventario (existencias)</th><th className="num">Costo</th><th>Categoría</th></tr>
            </thead>
            <tbody>
              {lista.map((i) => {
                const s = stock.get(i.id);
                const existencias = s ? Number(s.stock) : 0;
                const c = costo.get(i.id);
                return (
                  <tr key={i.id}>
                    <td><span className="admRowThumb">{i.imagen ? <img src={i.imagen} alt="" /> : <span>{i.emoji}</span>}</span></td>
                    <td><Link className="admStrongLink admSku" href={`/admin/productos/${i.id}`}>{i.sku}</Link></td>
                    <td className="admCeldaLarga">
                      <Link className="admLinkPlano" href={`/admin/productos/${i.id}`}>{i.nombre}</Link>
                      <small className="admMuted admBlock">
                        {i.tipo === "empaque" ? "Empaque · " : i.tipo === "otro" ? "Otro · " : ""}
                        {i.presentacion_compra === "Unidad" ? "Por unidad" : `${numero(i.unidades_por_presentacion)} unid. por ${i.presentacion_compra.toLowerCase()}`}
                      </small>
                    </td>
                    <td className="num" data-tone={existencias < Number(i.stock_minimo) ? "bad" : undefined}>{numero(existencias)}</td>
                    <td className="num">{c != null ? soles(c) : <span className="admMuted">—</span>}</td>
                    <td>{i.categoria ?? <span className="admMuted">Sin categoría</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="admMuted admSmall">{lista.length} de {todos.length} productos. Pulsa el SKU para abrir y editar la ficha.</p>
    </>
  );
}
