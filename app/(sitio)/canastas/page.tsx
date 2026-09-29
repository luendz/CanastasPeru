import CatalogoLineas from "@/components/CatalogoLineas";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Canastas" };

export default async function CanastasPage() {
  const [{ products }, { catalogo }] = await Promise.all([getCatalogo(), getContenido()]);
  return (
    <CatalogoLineas
      products={products}
      textos={catalogo}
      lineas={["economicas", "premium", "ejecutivas"]}
      cabecera={{ etiqueta: catalogo.etiqueta, titulo: catalogo.titulo, texto: catalogo.texto }}
    />
  );
}
