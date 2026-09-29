import PaginaTexto from "@/components/PaginaTexto";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Política de privacidad" };

export default async function PrivacidadPage() {
  const { pie } = await getContenido();
  return <PaginaTexto etiqueta="Información" titulo="Política de *privacidad*" texto={pie.privacidad} />;
}
