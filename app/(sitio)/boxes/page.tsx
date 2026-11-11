import CatalogoLineas from "@/components/CatalogoLineas";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Boxes navideños" };

export default async function BoxesPage() {
  const [{ products }, { catalogo }] = await Promise.all([getCatalogo(), getContenido()]);
  // Sin boxes activos (Panel → Boxes navideños) la página muestra un aviso de «muy pronto».
  return (
    <CatalogoLineas
      products={products.filter((p) => !p.category.toLowerCase().startsWith("box"))}
      textos={catalogo}
      lineas={["boxes"]}
      actual="boxes"
      cabecera={{ etiqueta: catalogo.boxesEtiqueta, titulo: catalogo.boxesTitulo, texto: catalogo.boxesTexto }}
    />
  );
}
