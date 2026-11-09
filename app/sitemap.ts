import type { MetadataRoute } from "next";
import { getCatalogo } from "@/lib/catalogo";
import { LINEAS } from "@/lib/lineas";
import { SITIO } from "@/lib/seo";

/**
 * sitemap.xml: lista de páginas para Google. Las canastas salen del catálogo
 * de la base en cada visita, así que una canasta nueva (visible) aparece sola.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCatalogo();
  const ahora = new Date();
  const pagina = (ruta: string, prioridad: number, frecuencia: "daily" | "weekly" | "monthly" | "yearly" = "weekly") => ({
    url: `${SITIO}${ruta}`,
    lastModified: ahora,
    changeFrequency: frecuencia,
    priority: prioridad,
  });

  return [
    pagina("", 1, "daily"),
    pagina("/canastas", 0.9, "daily"),
    ...LINEAS.filter((l) => l.id !== "boxes").map((l) => pagina(`/canastas/${l.id}`, 0.9, "daily")),
    pagina("/boxes", 0.8, "daily"),
    ...products.map((p) => pagina(`/producto/${p.slug}`, 0.8, "daily")),
    pagina("/cotizacion", 0.8, "monthly"),
    pagina("/nosotros", 0.6, "monthly"),
    pagina("/contacto", 0.6, "monthly"),
    pagina("/preguntas-frecuentes", 0.5, "monthly"),
    pagina("/seguimiento", 0.3, "yearly"),
    pagina("/terminos", 0.2, "yearly"),
    pagina("/privacidad", 0.2, "yearly"),
  ];
}
