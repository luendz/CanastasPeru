import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import type { TipoCanasta } from "@/lib/admin/types";
import CanastaForm, { type CanastaEditable } from "../CanastaForm";
import { LINEAS } from "@/lib/lineas";
import SeccionEnvases from "./SeccionEnvases";
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

  const [{ data: producto }, { data: tipos }, { data: todos }, { data: envases }] = await Promise.all([
    supabase.from("productos").select("*").eq("id", id).maybeSingle(),
    supabase.from("tipos_canasta").select("*").order("orden"),
    supabase.from("productos").select("categoria"),
    supabase.from("canasta_envases").select("tipo_canasta").eq("producto_id", id),
  ]);
  if (!producto) notFound();
  const p = producto as CanastaEditable & { slug: string };
  const categorias = [...new Set([...LINEAS.map((l) => l.categoria), ...((todos ?? []) as { categoria: string }[]).map((t) => t.categoria)])];
  // El envase principal se elige entre los que tiene la canasta.
  const propios = new Set(((envases ?? []) as { tipo_canasta: string }[]).map((e) => e.tipo_canasta));
  const tiposPropios = ((tipos ?? []) as TipoCanasta[]).filter((t) => propios.has(t.id));

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

      {actual === "datos" && (
        <section className="admCard">
          <h2>Datos generales</h2>
          <CanastaForm canasta={p} tipos={tiposPropios} categorias={categorias} />
        </section>
      )}
      {actual === "receta" && (
        <>
          <SeccionReceta productoId={id} />
          <SeccionEnvases productoId={id} />
        </>
      )}
      {actual === "imagenes" && <SeccionImagenes id={id} />}
    </>
  );
}
