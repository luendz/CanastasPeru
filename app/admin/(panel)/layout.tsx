import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { cerrarSesion } from "../login/actions";
import AdminNav from "./AdminNav";

export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { email } = await requireAdmin();

  return (
    <div className="admShell">
      <aside className="admSide">
        <Link href="/admin" className="admBrand">
          <img src="/marca/mka-logo-blanco.webp" alt="MKA · Canastas Navideñas & Regalos" width={1245} height={385} />
          <small>Panel de gestión</small>
        </Link>
        <AdminNav />
        <div className="admSideFoot">
          <Link href="/" className="admLinkMuted">Ver la tienda ↗</Link>
          <span className="admUser" title={email}>{email}</span>
          <form action={cerrarSesion}><button className="admLinkMuted" type="submit">Cerrar sesión</button></form>
        </div>
      </aside>
      <div className="admMain">{children}</div>
    </div>
  );
}
