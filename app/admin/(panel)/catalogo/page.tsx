import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import type { TipoCanasta } from "@/lib/admin/types";
import { LINEAS, lineaDe } from "@/lib/lineas";
import SelectorImagen from "../medios/SelectorImagen";
import { alternarCanasta, crearZona, guardarTipo, guardarZona } from "./actions";

export const metadata = { title: "Catálogo" };

type ProductoFila = {
  id: string; slug: string; nombre: string; categoria: string; precio: number; precio_anterior: number | null;
  insignia: string | null; tipo_canasta_base: string; orden: number; activo: boolean; composicion: unknown[];
};
type TipoFila = TipoCanasta & { imagen: string | null; descripcion: string | null; orden: number };
type ZonaFila = { distrito: string; tarifa: number; activo: boolean; orden: number };

export default async function CatalogoAdminPage({ searchParams }: { searchParams: Promise<{ linea?: string }> }) {
  const { supabase } = await requireAdmin();
  const { linea } = await searchParams;
  const [{ data: productos }, { data: tipos }, { data: zonas }, { data: costeo }] = await Promise.all([
    supabase.from("productos").select("*").order("orden").order("precio"),
    supabase.from("tipos_canasta").select("*").order("orden").order("recargo"),
    supabase.from("zonas_delivery").select("*").order("orden").order("distrito"),
    supabase.from("v_costeo_canastas").select("producto_id,costo,margen_pct"),
  ]);
  const lista = (productos ?? []) as ProductoFila[];
  const listaTipos = (tipos ?? []) as TipoFila[];
  const listaZonas = (zonas ?? []) as ZonaFila[];
  const costoDe = new Map(((costeo ?? []) as { producto_id: string; costo: number; margen_pct: number | null }[]).map((c) => [c.producto_id, c]));
  const imagenDe = new Map(listaTipos.map((t) => [t.id, t.imagen]));

  // Las líneas se muestran siempre, aunque no tengan canastas; las de categoría desconocida van en "Otras" para no perderlas.
  const sinLinea = lista.filter((p) => !lineaDe({ category: p.categoria }));
  const categorias = [
    ...LINEAS.map((l) => ({ id: l.id as string, titulo: l.titulo, categoria: l.categoria, canastas: lista.filter((p) => lineaDe({ category: p.categoria })?.id === l.id) })),
    ...(sinLinea.length ? [{ id: "otras", titulo: "Otras canastas", categoria: "", canastas: sinLinea }] : []),
  ];
  const actual = categorias.find((c) => c.id === linea) ?? categorias[0];
  const canastas = actual.canastas;
  const verCategoria = actual.id === "otras";

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Catálogo</h1>
          <p className="admMuted">Lo que ves y cambias aquí es lo que muestra y cobra la tienda, al instante.</p>
        </div>
        <Link className="admBtn admBtnPrimary" href="/admin/catalogo/nueva">+ Nueva canasta</Link>
      </header>

      <nav className="admTabs" aria-label="Secciones del catálogo">
        <a href="#canastas">Canastas</a>
        <a href="#tipos">Tipos de canasta</a>
        <a href="#delivery">Delivery</a>
      </nav>

      <nav className="admCategorias" aria-label="Categorías de canastas">
        {categorias.map((c) => {
          const imagen = c.canastas[0] && imagenDe.get(c.canastas[0].tipo_canasta_base);
          return (
            <Link key={c.id} className="admCategoria" data-linea={c.id} href={`/admin/catalogo?linea=${c.id}`} scroll={false} aria-current={c.id === actual.id ? "true" : undefined}>
              {imagen && <img src={imagen} alt="" />}
              <span><strong>{c.titulo}</strong><small>{c.canastas.length} {c.canastas.length === 1 ? "modelo" : "modelos"}</small></span>
              <span className="admCategoriaFlecha" aria-hidden="true">›</span>
            </Link>
          );
        })}
      </nav>

      <section className="admCard admCardFlush" id="canastas">
        <div className="admCardHead admPad"><h2>{actual.titulo}</h2><span className="admMuted">{canastas.filter((p) => p.activo).length} visibles de {canastas.length}</span></div>
        <table className="admTable">
          <thead><tr><th>Orden</th><th>Canasta</th>{verCategoria && <th>Categoría</th>}<th className="num">Precio</th><th className="num">Tachado</th><th className="num">Margen</th><th>Tienda</th><th /></tr></thead>
          <tbody>
            {canastas.length === 0 && (
              <tr><td colSpan={7} className="admMuted">Todavía no hay canastas aquí. Créalas con <Link className="admStrongLink" href="/admin/catalogo/nueva">+ Nueva canasta</Link>, con la categoría «{actual.categoria}».</td></tr>
            )}
            {canastas.map((p) => {
              const c = costoDe.get(p.id);
              return (
                <tr key={p.id} data-inactivo={!p.activo || undefined}>
                  <td>{p.orden}</td>
                  <td>
                    <Link className="admStrongLink" href={`/admin/catalogo/${p.id}`}>{p.nombre}</Link>
                    {p.insignia && <> <span className="admBadge">{p.insignia}</span></>}
                    {p.composicion.length === 0 && <small className="admWarn admBlock">Sin composición visual</small>}
                  </td>
                  {verCategoria && <td>{p.categoria}</td>}
                  <td className="num"><strong>{soles(p.precio)}</strong></td>
                  <td className="num">{p.precio_anterior ? <del>{soles(p.precio_anterior)}</del> : "—"}</td>
                  <td className="num">{c?.margen_pct == null ? "—" : `${numero(c.margen_pct, 1)} %`}</td>
                  <td>
                    <form action={alternarCanasta}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="activo" value={String(!p.activo)} />
                      <button type="submit" className="admToggle" aria-pressed={p.activo} title={p.activo ? "Ocultar de la tienda" : "Mostrar en la tienda"}>
                        <span />{p.activo ? "Visible" : "Oculta"}
                      </button>
                    </form>
                  </td>
                  <td className="num"><Link className="admLinkMuted" href={`/admin/catalogo/${p.id}`}>Editar</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="admCard" id="tipos">
        <div className="admCardHead"><h2>Tipos de canasta</h2><span className="admMuted">El recargo se suma o resta frente al tipo propio de cada canasta.</span></div>
        <table className="admTable admTableCompact">
          <thead><tr><th>Imagen</th><th>Tipo</th><th>Descripción</th><th className="num">Recargo</th><th className="num">Orden</th><th /></tr></thead>
          <tbody>
            {listaTipos.map((t) => (
              <tr key={t.id}>
                <td colSpan={6}>
                  <form action={guardarTipo} className="admRowForm">
                    <input type="hidden" name="id" value={t.id} />
                    <SelectorImagen name="imagen" defaultValue={t.imagen} label={`Imagen de ${t.nombre}`} compacto />
                    <input className="admInput" name="nombre" defaultValue={t.nombre} aria-label="Nombre" required />
                    <input className="admInput" name="descripcion" defaultValue={t.descripcion ?? ""} aria-label="Descripción" placeholder="Descripción" />
                    <input className="admInput admInputSm" name="recargo" type="number" min="0" step="0.01" defaultValue={t.recargo} aria-label="Recargo en soles" />
                    <input className="admInput admInputSm" name="orden" type="number" step="1" defaultValue={t.orden} aria-label="Orden" />
                    <button className="admLinkMuted" type="submit">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admCard" id="delivery">
        <div className="admCardHead"><h2>Delivery por distrito</h2><span className="admMuted">{listaZonas.filter((z) => z.activo).length} distritos con cobertura</span></div>
        <table className="admTable admTableCompact">
          <thead><tr><th>Distrito</th><th className="num">Tarifa (S/)</th><th className="num">Orden</th><th>Cobertura</th><th /></tr></thead>
          <tbody>
            {listaZonas.map((z) => (
              <tr key={z.distrito}>
                <td colSpan={5}>
                  <form action={guardarZona} className="admRowForm admRowFormZona">
                    <input type="hidden" name="distrito" value={z.distrito} />
                    <strong>{z.distrito}</strong>
                    <input className="admInput admInputSm" name="tarifa" type="number" min="0" step="0.5" defaultValue={z.tarifa} aria-label={`Tarifa de ${z.distrito}`} />
                    <input className="admInput admInputSm" name="orden" type="number" step="1" defaultValue={z.orden} aria-label={`Orden de ${z.distrito}`} />
                    <label className="admCheck"><input type="checkbox" name="activo" defaultChecked={z.activo} /><span>Con cobertura</span></label>
                    <button className="admLinkMuted" type="submit">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={crearZona} className="admInlineForm">
          <label>Nuevo distrito<input className="admInput" name="distrito" required maxLength={80} placeholder="Ej. Barranco" /></label>
          <label>Tarifa (S/)<input className="admInput" name="tarifa" type="number" min="0" step="0.5" required /></label>
          <button className="admBtn" type="submit">Agregar</button>
        </form>
      </section>
    </>
  );
}
