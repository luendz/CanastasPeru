import { requireAdmin } from "@/lib/admin/auth";
import { fechaCorta } from "@/lib/admin/format";
import ListaCorreos from "./ListaCorreos";

export const metadata = { title: "Suscriptores" };

type Suscriptor = { email: string; created_at: string; baja_at: string | null };

export default async function SuscriptoresPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("suscriptores").select("email,created_at,baja_at").order("created_at", { ascending: false });
  const lista = (data ?? []) as Suscriptor[];
  // Los dados de baja (en Brevo) no se copian ni se descargan: pidieron no recibir más correos.
  const activos = lista.filter((s) => !s.baja_at);
  const bajas = lista.length - activos.length;

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Suscriptores</h1>
          <p className="admMuted">Correos que se suscribieron a las novedades desde el pie de la web. También están en la lista &quot;Novedades web&quot; de Brevo: envía tus campañas desde allá, que respeta las bajas.</p>
        </div>
        <ListaCorreos correos={activos.map((s) => s.email)} />
      </header>
      {error && <p className="admError">No se pudo cargar la lista: {error.message}</p>}
      <div className="admCard admCardFlush">
        {lista.length === 0 ? (
          <p className="admEmpty">Todavía no hay suscriptores.</p>
        ) : (
          <table className="admTable">
            <thead><tr><th>Correo</th><th>Fecha</th><th>Estado</th></tr></thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.email}>
                  <td>{s.baja_at ? <span className="admMuted">{s.email}</span> : <a href={`mailto:${s.email}`}>{s.email}</a>}</td>
                  <td>{fechaCorta(s.created_at)}</td>
                  <td>{s.baja_at ? <span className="admBadge" data-estado="anulada" title={`Desde el ${fechaCorta(s.baja_at)}`}>Dado de baja</span> : <span className="admBadge" data-estado="entregada">Activo</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="admMuted admSmall">
        {activos.length} {activos.length === 1 ? "suscriptor activo" : "suscriptores activos"}
        {bajas > 0 && ` · ${bajas} dado${bajas === 1 ? "" : "s"} de baja (no se incluyen al copiar ni en el CSV)`}.
      </p>
    </>
  );
}
