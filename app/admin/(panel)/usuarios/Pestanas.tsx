"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Pestanas() {
  const ruta = usePathname();
  const roles = ruta.startsWith("/admin/usuarios/roles");
  return (
    <nav className="admTabs admTabsSeccion" aria-label="Usuarios y roles">
      <Link href="/admin/usuarios" aria-current={roles ? undefined : "page"}>Usuarios</Link>
      <Link href="/admin/usuarios/roles" aria-current={roles ? "page" : undefined}>Roles y accesos</Link>
    </nav>
  );
}
