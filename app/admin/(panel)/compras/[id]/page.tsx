import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import type { Compra } from "@/lib/admin/types";
import ConfirmButton from "../../ConfirmButton";
import { eliminarCompra } from "../actions";
import { datosFormulario } from "../datos";
import RegistroCompra from "../RegistroCompra";

export const metadata = { title: "Editar registro" };

export default async function EditarCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [{ data }, { productos, proveedores }] = await Promise.all([
    supabase.from("compras").select("*").eq("id", id).maybeSingle(),
    datosFormulario(supabase),
  ]);
  if (!data) notFound();
  const c = data as Compra;

  return (
    <>
      <header className="admHead">
        <div>
          <Link href={`/admin/compras?mes=${c.fecha.slice(0, 7)}`} className="admLinkMuted">← Costos totales</Link>
          <h1>Editar registro</h1>
          <p className="admMuted">Corrige los datos de este ítem. El costo unitario y el inventario se recalculan al guardar.</p>
        </div>
        <form action={eliminarCompra}>
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton className="admBtn admBtnDanger" message="¿Borrar este registro? Se descuenta del inventario y de los costos.">Borrar</ConfirmButton>
        </form>
      </header>
      <RegistroCompra
        editarId={c.id}
        productos={productos}
        proveedores={proveedores}
        inicial={{
          cab: {
            fecha: c.fecha,
            tipo_documento: c.tipo_documento,
            comprobante: c.comprobante ?? "",
            proveedor: c.proveedor ?? "",
            ruc_proveedor: c.ruc_proveedor ?? "",
            incluye_igv: c.incluye_igv,
            notas: c.notas ?? "",
          },
          items: [
            {
              categoria: c.categoria,
              insumo_id: c.insumo_id,
              descripcion: c.descripcion,
              presentacion: c.presentacion,
              cantidad_presentaciones: Number(c.cantidad_presentaciones ?? c.cantidad),
              unidades_por_presentacion: Number(c.unidades_por_presentacion),
              precio_presentacion: Number(c.precio_presentacion ?? c.costo_unitario),
              afecto_igv: c.afecto_igv,
            },
          ],
        }}
      />
    </>
  );
}
