import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { numero, soles } from "@/lib/admin/format";
import type { TipoCanasta } from "@/lib/admin/types";
import CanastaForm, { type CanastaEditable } from "../CanastaForm";
import { LINEAS } from "@/lib/lineas";
import SeccionImagenes from "./SeccionImagenes";
import SeccionReceta from "./SeccionReceta";

export const metadata = { title: "Editar canasta" };

const SECCIONES = [
  { id: "datos", titulo: "Datos generales" },
  { id: "receta", titulo: "Receta de productos" },
  { id: "imagenes", titulo: "Imágenes" },
];

export default async function EditarCanastaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ seccion?: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { seccion } = await searchParams;
  const actual = SECCIONES.find((s) => s.id === seccion)?.id ?? "datos";

  const [{ data: producto }, { data: tipos }, { data: todos }, { data: costeo }] = await Promise.all([
    supabase.from("productos").select("*").eq("id", id).maybeSingle(),
    supabase.from("tipos_canasta").select("*").order("orden"),
    supabase.from("productos").select("categoria"),
    supabase.from("v_costeo_canastas").select("costo,margen,margen_pct,costo_viveres,costo_presentacion,fuente").eq("producto_id", id).maybeSingle(),
  ]);
  if (!producto) notFound();
  const p = producto as CanastaEditable & { slug: string; composicion: unknown[] };
  const categorias = [...new Set([...LINEAS.map((l) => l.categoria), ...((todos ?? []) as { categoria: string }[]).map((t) => t.categoria)])];

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/catalogo" className="admLinkMuted">← Catálogo</Link>
          <h1>{p.nombre} <span className="admBadge" data-stock={p.activo ? "ok" : "bajo"}>{p.activo ? "Visible" : "Oculta"}</span></h1>
        </div>
        {p.activo && <Link className="admBtn" href={`/producto/${p.slug}`} target="_blank">Ver en la tienda ↗</Link>}
      </header>

      <nav className="admTabs" aria-label="Secciones de la canasta">
        {SECCIONES.map((s) => (
          <Link key={s.id} href={`/admin/catalogo/${id}?seccion=${s.id}`} scroll={false} aria-current={s.id === actual ? "page" : undefined}>{s.titulo}</Link>
        ))}
      </nav>

      {actual === "receta" && <SeccionReceta productoId={id} />}
      {actual === "imagenes" && <SeccionImagenes id={id} />}

      {actual === "datos" && <div className="admGrid2 admGridDetail">
        <section className="admCard">
          <h2>Datos generales</h2>
          <CanastaForm canasta={p} tipos={(tipos ?? []) as TipoCanasta[]} categorias={categorias} />
        </section>

        <aside className="admStack">
          <section className="admCard">
            <h2>Costo y margen</h2>
            {costeo ? (
              <table className="admTable admTablaCosto">
                <tbody>
                  {costeo.fuente === "tabla" ? (
                    <>
                      <tr><td>Costo total de víveres</td><td className="num">{soles(costeo.costo_viveres ?? 0)}</td></tr>
                      <tr><td>Costo de presentación</td><td className="num">{soles(costeo.costo_presentacion ?? 0)}</td></tr>
                    </>
                  ) : (
                    <tr><td>Costo según la receta</td><td className="num">{soles(costeo.costo)}</td></tr>
                  )}
                  <tr className="admFilaFuerte"><td>Costo total de canasta</td><td className="num">{soles(costeo.costo)}</td></tr>
                  <tr><td>Margen</td><td className="num">{costeo.margen_pct == null ? "—" : `${numero(costeo.margen_pct, 1)} %`}</td></tr>
                  <tr><td>Valor venta</td><td className="num">{soles(p.precio ?? 0)}</td></tr>
                  <tr className="admFilaFuerte"><td>Utilidad</td><td className="num" data-tone={Number(costeo.margen) >= 0 ? "ok" : "bad"}>{soles(costeo.margen)}</td></tr>
                </tbody>
              </table>
            ) : <p className="admMuted">Sin datos.</p>}
          </section>
        </aside>
      </div>}
    </>
  );
}
