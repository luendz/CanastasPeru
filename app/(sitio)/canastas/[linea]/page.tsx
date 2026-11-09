import { notFound, redirect } from "next/navigation";
import CatalogoLineas from "@/components/CatalogoLineas";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { LINEAS } from "@/lib/lineas";

export async function generateMetadata({ params }: { params: Promise<{ linea: string }> }) {
  const { linea } = await params;
  const l = LINEAS.find((x) => x.id === linea);
  return {
    title: l?.titulo ?? "Canastas",
    description: l ? `${l.titulo} de MKA: armadas a mano en Lima, para regalar en Navidad o para empresas. Delivery en Lima y envíos a provincias.` : undefined,
    alternates: l ? { canonical: `/canastas/${l.id}` } : undefined,
  };
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
