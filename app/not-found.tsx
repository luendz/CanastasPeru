import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NoEncontrada from "@/components/NoEncontrada";
import { getContenido } from "@/lib/contenido";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

/**
 * 404 para direcciones que no existen: aquí no hay layout de la tienda, así
 * que se agregan el header y el footer para no dejar al cliente sin salida.
 */
export default async function NoEncontradaGlobal() {
  const { marca, contacto, pie, anuncios } = await getContenido();
  return (
    <>
      <Header marca={marca} contacto={contacto} franja={anuncios.franja} />
      <main><NoEncontrada /></main>
      <Footer marca={marca} contacto={contacto} pie={pie} />
    </>
  );
}
