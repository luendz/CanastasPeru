import { requireAdmin } from "@/lib/admin/auth";
import { fechaCorta } from "@/lib/admin/format";
import ListaCorreos from "./ListaCorreos";

export const metadata = { title: "Suscriptores" };

export default async function SuscriptoresPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("suscriptores").select("email,created_at").order("created_at", { ascending: false });
  const lista = (data ?? []) as { email: string; created_at: string }[];

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Suscriptores</h1>
          <p className="admMuted">Correos que se suscribieron a las novedades desde el pie de la web. Úsalos para tus campañas por correo.</p>
        </div>
        <ListaCorreos correos={lista.map((s) => s.email)} />
      </header>
      {error && <p className="admError">No se pudo cargar la lista: {error.message}</p>}
      <div className="admCard admCardFlush">
        {lista.length === 0 ? (
          <p className="admEmpty">Todavía no hay suscriptores.</p>
        ) : (
          <table className="admTable">
            <thead><tr><th>Correo</th><th>Fecha</th></tr></thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.email}><td><a href={`mailto:${s.email}`}>{s.email}</a></td><td>{fechaCorta(s.created_at)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="admMuted admSmall">{lista.length} {lista.length === 1 ? "suscriptor" : "suscriptores"}.</p>
    </>
  );
}
