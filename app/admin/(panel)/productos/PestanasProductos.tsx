import Link from "next/link";

/** Productos e imágenes son una sola opción del panel, con dos pestañas. */
export default function PestanasProductos({ actual }: { actual: "productos" | "imagenes" }) {
  return (
    <nav className="admTabs" aria-label="Productos">
      <Link href="/admin/productos" aria-current={actual === "productos" ? "page" : undefined}>Productos</Link>
      <Link href="/admin/medios" aria-current={actual === "imagenes" ? "page" : undefined}>Biblioteca de imágenes</Link>
    </nav>
  );
}
