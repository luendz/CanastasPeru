import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import type { AjusteEnvase, BasketType, ProductVisualItem } from "@/lib/mock-data";
import EditorComposicion, { type InsumoVisual } from "./composicion/EditorComposicion";

type Fila = {
  slug: string; nombre: string; categoria: string; precio: number; emoji: string; descripcion: string;
  envase_base_id: string; composicion: ProductVisualItem[] | null; ajuste_envase?: Record<string, AjusteEnvase>;
};
type TipoFila = { id: string; nombre: string; imagen: string | null; descripcion: string | null; recargo: number };

/** Composición visual de la canasta: la imagen con efecto que se ve en la tienda. */
export default async function SeccionImagenes({ id }: { id: string }) {
  const { supabase } = await requireAdmin();
  const [{ data: producto }, { data: tipos }, { data: propios }, { data: insumos }] = await Promise.all([
    supabase.from("canastas").select("*").eq("id", id).maybeSingle(),
    supabase.from("envases").select("id,nombre,imagen,descripcion,recargo"),
    supabase.from("canasta_envases").select("envase_id").eq("canasta_id", id).order("orden").order("envase_id"),
    supabase.from("articulos").select("nombre,emoji,imagen").eq("tipo", "producto").order("nombre"),
  ]);
  if (!producto) return null;
  const p = producto as Fila;
  const listaInsumos = (insumos ?? []) as InsumoVisual[];
  const fotoDe = new Map(listaInsumos.map((i) => [i.nombre, i]));

  // Solo los envases de esta canasta (Envases y precios), en su orden y con el principal primero.
  // Los que no tienen foto no se pueden ver en el editor.
  const tipoDe = new Map(((tipos ?? []) as TipoFila[]).map((t) => [t.id, t]));
  const ids = ((propios ?? []) as { envase_id: string }[]).map((e) => e.envase_id);
  const ordenados = [...ids.filter((e) => e === p.envase_base_id), ...ids.filter((e) => e !== p.envase_base_id)];
  const basketTypes: BasketType[] = ordenados.flatMap((e) => {
    const t = tipoDe.get(e);
    return t?.imagen ? [{ id: t.id, label: t.nombre, image: t.imagen, hint: t.descripcion ?? "", priceDelta: Number(t.recargo) }] : [];
  });
  const sinFoto = ordenados.length - basketTypes.length;

  // Igual que en la tienda: la foto y el emoji salen del insumo con el mismo nombre.
  const visualItems = (p.composicion ?? []).map((it) => {
    const ins = fotoDe.get(it.name);
    return { ...it, ...(ins?.imagen ? { image: ins.imagen } : {}), ...(ins ? { emoji: ins.emoji } : {}) };
  });

  if (basketTypes.length === 0) {
    return (
      <p className="admWarn">
        {ordenados.length === 0 ? "Esta canasta no tiene envases." : "Ningún envase de esta canasta tiene foto."} Agrégalo en{" "}
        <Link href={`/admin/catalogo/${id}?seccion=receta#envases`}>Contenido y envases → Envase y precio de venta</Link>.
      </p>
    );
  }

  return (
    <section className="admCard admComposicion">
      <p className="admMuted">
        Arrastra el envase y cada producto. Lo que quede dentro de cada marco es lo que se ve en la tienda: el cuadrado en el catálogo, la página del producto y el carrito, y el ancho en el inicio.
        {sinFoto > 0 && ` ${sinFoto === 1 ? "Un envase de esta canasta no sale en la lista porque no tiene foto." : `${sinFoto} envases de esta canasta no salen en la lista porque no tienen foto.`}`}
      </p>
      <EditorComposicion
        id={id}
        basketTypes={basketTypes}
        insumos={listaInsumos}
        product={{
          slug: p.slug,
          name: p.nombre,
          category: p.categoria,
          price: Number(p.precio),
          emoji: p.emoji,
          baseImage: basketTypes[0].image,
          // En el editor el ajuste va por envase (id), no por foto: dos envases pueden compartir foto.
          ajustesEnvase: p.ajuste_envase ?? {},
          baseType: p.envase_base_id,
          description: p.descripcion,
          items: [],
          visualItems,
        }}
      />
    </section>
  );
}
