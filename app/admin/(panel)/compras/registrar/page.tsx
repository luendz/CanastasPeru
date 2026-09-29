import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { hoyLima } from "@/lib/admin/format";
import { datosFormulario } from "../datos";
import RegistroCompra from "../RegistroCompra";

export const metadata = { title: "Registrar compra / costo" };

export default async function RegistrarCompraPage() {
  const { supabase } = await requireAdmin();
  const { productos, proveedores } = await datosFormulario(supabase);
  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/compras" className="admLinkMuted">← Costos totales</Link>
          <h1>Registrar compra / costo</h1>
          <p className="admMuted">Ingresa el comprobante y sus ítems. El costo unitario se calcula solo: precio de la presentación entre las unidades que trae.</p>
        </div>
      </header>
      <RegistroCompra
        productos={productos}
        proveedores={proveedores}
        inicial={{ cab: { fecha: hoyLima(), tipo_documento: "factura", comprobante: "", proveedor: "", ruc_proveedor: "", incluye_igv: true, notas: "" }, items: [] }}
      />
    </>
  );
}
