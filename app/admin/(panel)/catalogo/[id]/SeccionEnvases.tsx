import { requireAdmin } from "@/lib/admin/auth";
import EnvasesPrecios, { type CanastaDestino, type FilaEnvase, type OpcionEnvase } from "./EnvasesPrecios";

type Tipo = { id: string; nombre: string; descripcion: string | null; insumo_id: string | null };
type Empaque = { id: string; nombre: string; imagen: string | null };

/** Envases de la canasta con el cálculo de cada uno, y los que se le pueden agregar. */
export default async function SeccionEnvases({ productoId }: { productoId: string }) {
  const { supabase } = await requireAdmin();
  const [{ data: envases }, { data: tipos }, { data: empaques }, { data: canastas }, { data: usos }] = await Promise.all([
    supabase.from("v_envases_canasta").select("*").eq("producto_id", productoId).order("orden").order("tipo_canasta"),
    supabase.from("tipos_canasta").select("id,nombre,descripcion,insumo_id").order("orden"),
    supabase.from("insumos").select("id,nombre,imagen").eq("tipo", "empaque").order("nombre"),
    supabase.from("productos").select("id,nombre,precio").neq("id", productoId).order("orden").order("precio"),
    supabase.from("canasta_envases").select("producto_id,tipo_canasta"),
  ]);
  const listaTipos = (tipos ?? []) as Tipo[];
  const descripcionDe = new Map(listaTipos.map((t) => [t.id, t.descripcion]));
  const filas = ((envases ?? []) as Omit<FilaEnvase, "descripcion">[]).map((f) => ({ ...f, descripcion: descripcionDe.get(f.tipo_canasta) ?? null }));
  const listaEmpaques = (empaques ?? []) as Empaque[];
  const relacionados = new Set(listaTipos.map((t) => t.insumo_id));

  // Se elige de los envases que ya vende la web o del listado de productos (con foto, porque la web la muestra).
  // Los que no se pueden elegir también salen, con el motivo, para que se sepa por qué.
  const nombreEmpaque = new Map(listaEmpaques.map((e) => [e.id, e.nombre]));
  const opciones: OpcionEnvase[] = [
    ...listaTipos.map((t) => {
      const producto = t.insumo_id ? nombreEmpaque.get(t.insumo_id) : undefined;
      return {
        valor: `tipo:${t.id}`,
        etiqueta: producto && producto !== t.nombre ? `${t.nombre} (${producto})` : t.nombre,
        motivo: filas.some((f) => f.tipo_canasta === t.id) ? "ya está en esta canasta" : undefined,
      };
    }),
    ...listaEmpaques.filter((e) => !relacionados.has(e.id)).map((e) => ({ valor: `insumo:${e.id}`, etiqueta: e.nombre, motivo: e.imagen ? undefined : "sin foto" })),
  ];

  // A qué otras canastas se puede llevar cada envase.
  const listaUsos = (usos ?? []) as { producto_id: string; tipo_canasta: string }[];
  const destinos: CanastaDestino[] = ((canastas ?? []) as { id: string; nombre: string; precio: number }[]).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    precio: Number(c.precio),
    envases: listaUsos.filter((u) => u.producto_id === c.id).map((u) => u.tipo_canasta),
  }));

  return <EnvasesPrecios productoId={productoId} filas={filas} opciones={opciones} destinos={destinos} productos={listaEmpaques.map((e) => ({ id: e.id, nombre: e.nombre }))} />;
}
