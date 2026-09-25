import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import type { TipoCanasta } from "@/lib/admin/types";
import SelectorImagen from "../medios/SelectorImagen";
import { alternarCanasta, crearZona, guardarInsumoVisual, guardarTipo, guardarZona } from "./actions";

export const metadata = { title: "Catálogo" };

type ProductoFila = {
  id: string; slug: string; nombre: string; categoria: string; precio: number; precio_anterior: number | null;
  insignia: string | null; tipo_canasta_base: string; orden: number; activo: boolean; composicion: unknown[];
};
type TipoFila = TipoCanasta & { imagen: string | null; descripcion: string | null; orden: number };
type InsumoFila = { id: string; nombre: string; tipo: string; imagen: string | null; emoji: string };
type ZonaFila = { distrito: string; tarifa: number; activo: boolean; orden: number };

export default async function CatalogoAdminPage() {
  const { supabase } = await requireAdmin();
  const [{ data: productos }, { data: tipos }, { data: zonas }, { data: costeo }, { data: insumos }] = await Promise.all([
    supabase.from("productos").select("*").order("orden").order("precio"),
    supabase.from("tipos_canasta").select("*").order("orden").order("recargo"),
    supabase.from("zonas_delivery").select("*").order("orden").order("distrito"),
    supabase.from("v_costeo_canastas").select("producto_id,costo,margen_pct"),
    supabase.from("insumos").select("id,nombre,tipo,imagen,emoji").order("tipo").order("nombre"),
  ]);
  const listaInsumos = (insumos ?? []) as InsumoFila[];
  const lista = (productos ?? []) as ProductoFila[];
  const listaTipos = (tipos ?? []) as TipoFila[];
  const listaZonas = (zonas ?? []) as ZonaFila[];
  const costoDe = new Map(((costeo ?? []) as { producto_id: string; costo: number; margen_pct: number | null }[]).map((c) => [c.producto_id, c]));

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
        <a href="#productos">Fotos de productos</a>
        <a href="#tipos">Tipos de canasta</a>
        <a href="#delivery">Delivery</a>
      </nav>

      <section className="admCard admCardFlush" id="canastas">
        <div className="admCardHead admPad"><h2>Canastas</h2><span className="admMuted">{lista.filter((p) => p.activo).length} visibles de {lista.length}</span></div>
        <table className="admTable">
          <thead><tr><th>Orden</th><th>Canasta</th><th>Categoría</th><th className="num">Precio</th><th className="num">Tachado</th><th className="num">Margen</th><th>Tienda</th><th /></tr></thead>
          <tbody>
            {lista.map((p) => {
              const c = costoDe.get(p.id);
              return (
                <tr key={p.id} data-inactivo={!p.activo || undefined}>
                  <td>{p.orden}</td>
                  <td>
                    <Link className="admStrongLink" href={`/admin/catalogo/${p.id}`}>{p.nombre}</Link>
                    {p.insignia && <> <span className="admBadge">{p.insignia}</span></>}
                    {p.composicion.length === 0 && <small className="admWarn admBlock">Sin composición visual</small>}
                  </td>
                  <td>{p.categoria}</td>
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

      <section className="admCard" id="productos">
        <div className="admCardHead"><h2>Fotos de productos</h2><span className="admMuted">La foto de cada producto se usa en todas las canastas que lo llevan. Sin foto, se muestra el emoji.</span></div>
        <ul className="admInsumos">
          {listaInsumos.map((i) => (
            <li key={i.id}>
              <form action={guardarInsumoVisual} className="admInsumo">
                <input type="hidden" name="id" value={i.id} />
                <SelectorImagen name="imagen" defaultValue={i.imagen} label={`Foto de ${i.nombre}`} compacto />
                <div>
                  <strong>{i.nombre}</strong>
                  <small className="admMuted admBlock">{i.tipo === "producto" ? "Producto" : i.tipo === "empaque" ? "Empaque" : "Otro"}</small>
                </div>
                <input className="admInput admInputEmoji" name="emoji" defaultValue={i.emoji} maxLength={8} aria-label={`Emoji de ${i.nombre}`} />
                <button className="admLinkMuted" type="submit">Guardar</button>
              </form>
            </li>
          ))}
        </ul>
        {listaInsumos.length === 0 && <p className="admEmpty">Registra productos en Producción e inventario.</p>}
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
