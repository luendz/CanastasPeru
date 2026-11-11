import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import type { TipoCanasta } from "@/lib/admin/types";
import CanastaForm from "../CanastaForm";
import { LINEAS } from "@/lib/lineas";
import { separarInsignias } from "@/lib/mock-data";

export const metadata = { title: "Nueva canasta" };

export default async function NuevaCanastaPage() {
  const { supabase } = await requireAdmin();
  const [{ data: tipos }, { data: todos }] = await Promise.all([
    supabase.from("envases").select("*").neq("id", "box").order("orden"),
    supabase.from("canastas").select("categoria,orden,insignia"),
  ]);
  const filas = (todos ?? []) as { categoria: string; orden: number; insignia: string | null }[];
  const listaTipos = (tipos ?? []) as TipoCanasta[];

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/catalogo" className="admLinkMuted">← Catálogo</Link>
          <h1>Nueva canasta</h1>
          <p className="admMuted">Después de crearla, arma su receta y sus envases, y su composición visual en Imágenes. Luego actívala.</p>
        </div>
      </header>
      <section className="admCard admNarrow">
        <CanastaForm
          canasta={{
            nombre: "",
            categoria: "",
            precio: null,
            precio_anterior: null,
            insignia: null,
            descripcion: "",
            descripcion_completa: "",
            emoji: "🧺",
            envase_base_id: listaTipos[0]?.id ?? "",
            orden: Math.max(0, ...filas.map((f) => f.orden)) + 1,
            activo: false,
          }}
          tipos={listaTipos}
          categorias={[...new Set([...LINEAS.filter((l) => l.id !== "boxes").map((l) => l.categoria), ...filas.map((f) => f.categoria).filter((c) => !/^box/i.test(c))])]}
          insignias={[...new Set(filas.flatMap((f) => separarInsignias(f.insignia)))]}
        />
      </section>
    </>
  );
}
