import PaginaTexto from "@/components/PaginaTexto";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Términos y condiciones" };

export default async function TerminosPage() {
  const { pie } = await getContenido();
  return <PaginaTexto etiqueta="Información" titulo="Términos y *condiciones*" texto={pie.terminos} />;
}
