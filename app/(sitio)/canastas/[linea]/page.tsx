import { notFound, redirect } from "next/navigation";
import CatalogoLineas from "@/components/CatalogoLineas";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { LINEAS } from "@/lib/lineas";

export async function generateMetadata({ params }: { params: Promise<{ linea: string }> }) {
  const { linea } = await params;
  return { title: LINEAS.find((l) => l.id === linea)?.titulo ?? "Canastas" };
}

export default async function LineaPage({ params }: { params: Promise<{ linea: string }> }) {
  const { linea } = await params;
  if (linea === "boxes") redirect("/boxes");
  const n = LINEAS.findIndex((l) => l.id === linea);
  if (n < 0) notFound();

  const [{ products }, { catalogo }] = await Promise.all([getCatalogo(), getContenido()]);
  const texto = catalogo.lineas[n];
  return (
    <CatalogoLineas
      products={products}
      textos={catalogo}
      lineas={[LINEAS[n].id]}
      actual={LINEAS[n].id}
      cabecera={{ etiqueta: catalogo.etiqueta, titulo: texto?.titulo ?? LINEAS[n].titulo, texto: texto?.texto ?? "" }}
    />
  );
}
