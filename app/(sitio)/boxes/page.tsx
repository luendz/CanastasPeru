import { redirect } from "next/navigation";
import CatalogoLineas from "@/components/CatalogoLineas";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { productosDe } from "@/lib/lineas";

export const metadata = { title: "Boxes navideños" };

export default async function BoxesPage() {
  const [{ products }, { catalogo }] = await Promise.all([getCatalogo(), getContenido()]);
  // Sin boxes activos (Panel → Boxes navideños) la sección no se muestra.
  if (productosDe(products, "boxes").length === 0) redirect("/canastas");
  return (
    <CatalogoLineas
      products={products}
      textos={catalogo}
      lineas={["boxes"]}
      actual="boxes"
      cabecera={{ etiqueta: catalogo.boxesEtiqueta, titulo: catalogo.boxesTitulo, texto: catalogo.boxesTexto }}
    />
  );
}
