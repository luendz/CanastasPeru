import Link from "next/link";
import PaginaTexto from "@/components/PaginaTexto";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Preguntas frecuentes" };

export default async function PreguntasPage() {
  const { pie } = await getContenido();
  return (
    <PaginaTexto etiqueta="Información" titulo="Preguntas *frecuentes*">
      <div className="faqLista">
        {pie.faq.map((f, n) => (
          <details key={n} className="faqItem" open={n === 0}>
            <summary>{f.titulo}</summary>
            <p>{f.texto}</p>
          </details>
        ))}
      </div>
      <p className="faqMas">¿Tienes otra duda? <Link href="/contacto">Escríbenos →</Link></p>
    </PaginaTexto>
  );
}
