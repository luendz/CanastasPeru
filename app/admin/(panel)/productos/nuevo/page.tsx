import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { datosFicha } from "../datos";
import FichaProducto from "../FichaProducto";

export const metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage() {
  const { supabase } = await requireAdmin();
  const { categorias, skuSugerido } = await datosFicha(supabase);
  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/productos" className="admLinkMuted">← Productos</Link>
          <h1>Nuevo producto</h1>
          <p className="admMuted">El inventario y el costo se llenan solos cuando registres su primera compra en Costos totales.</p>
        </div>
      </header>
      <FichaProducto producto={null} skuSugerido={skuSugerido} categorias={categorias} inventario={null} costo={null} />
    </>
  );
}
