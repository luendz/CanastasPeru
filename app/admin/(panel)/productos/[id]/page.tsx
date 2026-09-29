import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import type { Insumo } from "@/lib/admin/types";
import { datosFicha, datosProducto } from "../datos";
import FichaProducto from "../FichaProducto";

export const metadata = { title: "Ficha del producto" };

export default async function FichaProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [{ data }, ficha, datos] = await Promise.all([
    supabase.from("insumos").select("*").eq("id", id).maybeSingle(),
    datosFicha(supabase),
    datosProducto(supabase, id),
  ]);
  if (!data) notFound();
  const p = data as Insumo;

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/productos" className="admLinkMuted">← Productos</Link>
          <h1>{p.nombre}</h1>
          <p className="admMuted">SKU {p.sku}{p.categoria ? ` · ${p.categoria}` : ""}</p>
        </div>
        <Link className="admBtn" href={`/admin/compras/registrar`}>Registrar compra</Link>
      </header>
      <FichaProducto producto={p} skuSugerido={ficha.skuSugerido} categorias={ficha.categorias} inventario={datos.inventario} costo={datos.costo} />
    </>
  );
}
