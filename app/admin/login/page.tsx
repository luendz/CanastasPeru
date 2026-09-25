import { supabaseConfigurado } from "@/lib/supabase/config";
import LoginForm from "./LoginForm";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="admLogin">
      <div className="admLoginCard">
        <img src="/marca/mka-icono.png" alt="" width={64} height={64} className="admLoginLogo" />
        <h1>Panel MKA</h1>
        <p className="admMuted">Gestión de pedidos, cotizaciones y costos.</p>

        {supabaseConfigurado ? (
          <LoginForm aviso={error === "sin-permiso" ? "Esta cuenta no tiene acceso al panel." : undefined} />
        ) : (
          <div className="admNotice">
            <strong>Falta conectar Supabase</strong>
            <p>
              Crea el archivo <code>.env.local</code> con <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (ver <code>.env.example</code>) y reinicia el servidor.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
