import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import type { TipoCanasta } from "@/lib/admin/types";
import CanastaForm from "../CanastaForm";

export const metadata = { title: "Nueva canasta" };

export default async function NuevaCanastaPage() {
  const { supabase } = await requireAdmin();
  const [{ data: tipos }, { data: todos }] = await Promise.all([
    supabase.from("tipos_canasta").select("*").order("orden"),
    supabase.from("productos").select("categoria,orden"),
  ]);
  const filas = (todos ?? []) as { categoria: string; orden: number }[];
  const listaTipos = (tipos ?? []) as TipoCanasta[];

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/catalogo" className="admLinkMuted">← Catálogo</Link>
          <h1>Nueva canasta</h1>
          <p className="admMuted">Después de crearla, arma su receta en Costeo y su composición visual en el editor. Luego actívala.</p>
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
            emoji: "🧺",
            tipo_canasta_base: listaTipos[0]?.id ?? "",
            orden: Math.max(0, ...filas.map((f) => f.orden)) + 1,
            activo: false,
          }}
          tipos={listaTipos}
          categorias={[...new Set(filas.map((f) => f.categoria))]}
        />
      </section>
    </>
  );
}
