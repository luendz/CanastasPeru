import { requireSeccion } from "@/lib/admin/auth";

/** Solo los roles con acceso a esta sección entran (ver Usuarios → Roles). */
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireSeccion("reportes");
  return children;
}
