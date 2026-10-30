import { redirect } from "next/navigation";

/** La composición visual ahora es la pestaña Imágenes de la canasta. */
export default async function ComposicionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/catalogo/${id}?seccion=imagenes`);
}
