import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { SECCIONES, puede } from "@/lib/admin/permisos";
import { cerrarSesion } from "../login/actions";
import AdminNav from "./AdminNav";

export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { email, permisos } = await requireAdmin();
  const secciones = [...SECCIONES.filter((s) => puede(permisos, s.id)).map((s) => s.id), ...(permisos.administrador ? ["usuarios"] : [])];

  return (
    <div className="admShell">
      <aside className="admSide">
        <Link href="/admin" className="admBrand">
          <img src="/marca/mka-logo-blanco.webp" alt="MKA · Canastas Navideñas & Regalos" width={1245} height={385} />
          <small>Panel de gestión</small>
        </Link>
        <AdminNav secciones={secciones} />
        <div className="admSideFoot">
          <Link href="/" className="admLinkMuted">Ver la tienda ↗</Link>
          <Link href="/admin/mi-cuenta" className="admUser" title={`${email} · Mi cuenta`}>{email}{permisos.rol && <small>{permisos.rol}</small>}</Link>
          <form action={cerrarSesion}><button className="admLinkMuted" type="submit">Cerrar sesión</button></form>
        </div>
      </aside>
      <div className="admMain">{children}</div>
    </div>
  );
}
