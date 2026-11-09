import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { puede } from "@/lib/admin/permisos";
import { fecha, fechaHora, soles } from "@/lib/admin/format";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import BotonEliminar from "../../BotonEliminar";
import { eliminarIntento } from "../actions";

export const metadata = { title: "Pagos no completados" };

type Intento = {
  id: string;
  referencia: string;
  total: number;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_telefono: string | null;
  mp_estado: string | null;
  mp_estado_detalle: string | null;
  created_at: string;
  datos: { entrega?: { distrito?: string; fecha?: string } };
  calculo: { lineas?: { nombre: string; cantidad: number }[] };
};

const ESTADO_MP: Record<string, string> = {
  rejected: "Rechazado",
  cancelled: "Cancelado",
  pending: "En proceso",
  in_process: "En revisión",
  approved: "Aprobado (monto distinto)",
};

/** Checkouts con tarjeta que no llegaron a pagarse: no son órdenes ni tienen número. */
export default async function IntentosPage() {
  const { supabase, permisos } = await requireAdmin();
  if (!puede(permisos, "ordenes.intentos")) redirect("/admin/ordenes");
  const { data, error } = await supabase
    .from("intentos_pago")
    .select("id,referencia,total,cliente_nombre,cliente_email,cliente_telefono,mp_estado,mp_estado_detalle,created_at,datos,calculo")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false })
    .limit(200);
  const intentos = (data ?? []) as Intento[];

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Pagos no completados</h1>
          <p className="admMuted">
            Clientes que llegaron a la pantalla de pago con tarjeta y no terminaron de pagar. No son órdenes: si el pago se aprueba, pasan solos a{" "}
            <Link className="admLinkMuted" href="/admin/ordenes">Órdenes</Link>. Sirven para escribirle al cliente si lo ves conveniente.
          </p>
        </div>
      </header>

      {error && <p className="admError">No se pudieron cargar los pagos no completados: {error.message}</p>}

      <div className="admCard admCardFlush">
        {intentos.length === 0 ? (
          <p className="admEmpty">No hay pagos sin completar.</p>
        ) : (
          <table className="admTable">
            <thead>
              <tr><th>Fecha</th><th>Cliente</th><th>Pedido</th><th>Entrega</th><th className="num">Total</th><th>Mercado Pago</th><th><span className="admSrOnly">Acciones</span></th></tr>
            </thead>
            <tbody>
              {intentos.map((i) => (
                <tr key={i.id}>
                  <td>{fechaHora(i.created_at)}</td>
                  <td>
                    {i.cliente_nombre}
                    <small className="admMuted admBlock">{[i.cliente_email, i.cliente_telefono].filter(Boolean).join(" · ")}</small>
                  </td>
                  <td>{(i.calculo.lineas ?? []).map((l) => `${l.cantidad} × ${l.nombre}`).join(", ")}</td>
                  <td>{fecha(i.datos.entrega?.fecha)}<small className="admMuted admBlock">{i.datos.entrega?.distrito ?? ""}</small></td>
                  <td className="num">{soles(i.total)}</td>
                  <td>{i.mp_estado ? ESTADO_MP[i.mp_estado] ?? i.mp_estado : "Sin pago"}</td>
                  <td>
                    <div className="admFilaAcciones">
                      {i.cliente_telefono && (
                        <a className="admLinkMuted" href={enlaceWhatsApp(i.cliente_telefono, `Hola ${i.cliente_nombre.split(" ")[0]}, te escribimos de MKA Canastas por tu pedido en nuestra web.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                      )}
                      <BotonEliminar id={i.id} accion={eliminarIntento} mensaje={`¿Borrar el pago no completado de ${i.cliente_nombre}? No afecta ninguna orden.`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
