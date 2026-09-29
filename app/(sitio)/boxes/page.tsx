import CatalogoLineas from "@/components/CatalogoLineas";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Boxes navideños" };

export default async function BoxesPage() {
  const [{ products }, { catalogo }] = await Promise.all([getCatalogo(), getContenido()]);
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
