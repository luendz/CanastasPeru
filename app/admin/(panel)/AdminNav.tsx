"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Inicio", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/admin/ordenes", label: "Órdenes", icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" },
  { href: "/admin/cotizaciones", label: "Cotizaciones", icon: "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5" },
  { href: "/admin/catalogo", label: "Catálogo", icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z" },
  { href: "/admin/contenido", label: "Contenido web", icon: "M4 5h16M4 10h16M4 15h10M4 20h7" },
  { href: "/admin/medios", label: "Imágenes", icon: "M4 5h16v14H4zM4 15l4.5-4.5 4 4L15 12l5 5M15.5 9.5h.01" },
  { href: "/admin/compras", label: "Compras y costos", icon: "M4 7h16l-1.5 11a2 2 0 0 1-2 1.8h-9a2 2 0 0 1-2-1.8zM8.5 7a3.5 3.5 0 0 1 7 0" },
  { href: "/admin/costeo", label: "Costeo por canasta", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/admin/produccion", label: "Producción e inventario", icon: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" },
  { href: "/admin/reportes", label: "Reportes Excel", icon: "M5 3h10l4 4v14H5zM9 17l2-3-2-3M15 17h-3" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admNav" aria-label="Panel">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={it.icon} /></svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
