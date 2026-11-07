import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { distritosDelivery } from "../distritos";
import NuevaCotizacionForm from "./NuevaCotizacionForm";

export const metadata = { title: "Nueva cotización" };

export default async function NuevaCotizacionPage() {
  const { supabase } = await requireAdmin();
  const distritos = await distritosDelivery(supabase);
  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/cotizaciones" className="admLinkMuted">← Cotizaciones</Link>
          <h1>Nueva cotización</h1>
          <p className="admMuted">Para pedidos que llegan por WhatsApp o correo. Al crearla pasas a su detalle para agregar las canastas y los precios.</p>
        </div>
      </header>
      <section className="admCard admNarrow">
        <NuevaCotizacionForm distritos={distritos} />
      </section>
    </>
  );
}
