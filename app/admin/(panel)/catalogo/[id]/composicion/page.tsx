import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import type { BasketType, ProductVisualItem } from "@/lib/mock-data";
import EditorComposicion, { type InsumoVisual } from "./EditorComposicion";

export const metadata = { title: "Composición visual" };

type Fila = {
  slug: string; nombre: string; categoria: string; precio: number; emoji: string; descripcion: string;
  tipo_canasta_base: string; composicion: ProductVisualItem[] | null; activo: boolean;
};
type TipoFila = { id: string; nombre: string; imagen: string | null; descripcion: string | null; recargo: number };

export default async function ComposicionPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const [{ data: producto }, { data: tipos }, { data: insumos }] = await Promise.all([
    supabase.from("productos").select("slug,nombre,categoria,precio,emoji,descripcion,tipo_canasta_base,composicion,activo").eq("id", id).maybeSingle(),
    supabase.from("tipos_canasta").select("id,nombre,imagen,descripcion,recargo").order("orden"),
    supabase.from("insumos").select("nombre,emoji,imagen").eq("tipo", "producto").order("nombre"),
  ]);
  if (!producto) notFound();
  const p = producto as Fila;
  const listaInsumos = (insumos ?? []) as InsumoVisual[];
  const fotoDe = new Map(listaInsumos.map((i) => [i.nombre, i]));

  const basketTypes: BasketType[] = ((tipos ?? []) as TipoFila[])
    .filter((t) => t.imagen)
    .map((t) => ({ id: t.id, label: t.nombre, image: t.imagen!, hint: t.descripcion ?? "", priceDelta: Number(t.recargo) }));
  const base = basketTypes.find((t) => t.id === p.tipo_canasta_base);

  // Igual que en la tienda: la foto y el emoji salen del insumo con el mismo nombre.
  const visualItems = (p.composicion ?? []).map((it) => {
    const ins = fotoDe.get(it.name);
    return { ...it, ...(ins?.imagen ? { image: ins.imagen } : {}), ...(ins ? { emoji: ins.emoji } : {}) };
  });

  return (
    <>
      <header className="admHead">
        <div>
          <Link href={`/admin/catalogo/${id}`} className="admLinkMuted">← {p.nombre}</Link>
          <h1>Composición visual</h1>
          <p className="admMuted">Arrastra cada producto sobre la canasta. Así se verá en el catálogo y en la página del producto.</p>
        </div>
        {p.activo && <Link className="admBtn" href={`/producto/${p.slug}`} target="_blank">Ver en la tienda ↗</Link>}
      </header>

      {basketTypes.length === 0 ? (
        <p className="admWarn">Primero asigna una imagen a algún tipo de canasta en <Link href="/admin/catalogo#tipos">Catálogo</Link>.</p>
      ) : (
        <section className="admCard admComposicion">
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
              baseImage: base?.image,
              baseType: p.tipo_canasta_base,
              description: p.descripcion,
              items: [],
              visualItems,
            }}
          />
        </section>
      )}
    </>
  );
}
