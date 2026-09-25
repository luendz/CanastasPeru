import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import type { TipoCanasta } from "@/lib/admin/types";
import CanastaForm, { type CanastaEditable } from "../CanastaForm";

export const metadata = { title: "Editar canasta" };

export default async function EditarCanastaPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: producto }, { data: tipos }, { data: todos }, { data: costeo }, { count: recetaCount }] = await Promise.all([
    supabase.from("productos").select("*").eq("id", id).maybeSingle(),
    supabase.from("tipos_canasta").select("*").order("orden"),
    supabase.from("productos").select("categoria"),
    supabase.from("v_costeo_canastas").select("costo,margen,margen_pct").eq("producto_id", id).maybeSingle(),
    supabase.from("recetas").select("insumo_id", { count: "exact", head: true }).eq("producto_id", id),
  ]);
  if (!producto) notFound();
  const p = producto as CanastaEditable & { slug: string; composicion: unknown[] };
  const categorias = [...new Set(((todos ?? []) as { categoria: string }[]).map((t) => t.categoria))];

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/catalogo" className="admLinkMuted">← Catálogo</Link>
          <h1>{p.nombre} <span className="admBadge" data-stock={p.activo ? "ok" : "bajo"}>{p.activo ? "Visible" : "Oculta"}</span></h1>
        </div>
        {p.activo && <Link className="admBtn" href={`/producto/${p.slug}`} target="_blank">Ver en la tienda ↗</Link>}
      </header>

      <div className="admGrid2 admGridDetail">
        <section className="admCard">
          <h2>Datos de la canasta</h2>
          <CanastaForm canasta={p} tipos={(tipos ?? []) as TipoCanasta[]} categorias={categorias} />
        </section>

        <aside className="admStack">
          <section className="admCard">
            <h2>Costo y margen</h2>
            {costeo ? (
              <dl className="admDl">
                <div><dt>Costo</dt><dd>{soles(costeo.costo)}</dd></div>
                <div><dt>Margen</dt><dd>{soles(costeo.margen)} · {costeo.margen_pct == null ? "—" : `${numero(costeo.margen_pct, 1)} %`}</dd></div>
              </dl>
            ) : <p className="admMuted">Sin datos.</p>}
          </section>
          <section className="admCard">
            <h2>Contenido</h2>
            <ul className="admChecklist">
              <li data-ok={(recetaCount ?? 0) > 0 || undefined}>
                Receta: {recetaCount ?? 0} insumos · <Link href={`/admin/costeo#receta-${p.slug}`}>editar</Link>
                <small className="admMuted admBlock">Define “Lo que trae” en la tienda y el costo.</small>
              </li>
              <li data-ok={p.composicion.length > 0 || undefined}>
                Composición visual: {p.composicion.length} productos · <Link href={`/admin/catalogo/${id}/composicion`}>editar</Link>
                <small className="admMuted admBlock">Dónde va cada producto sobre la canasta.</small>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
