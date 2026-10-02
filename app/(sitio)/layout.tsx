import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContenido } from "@/lib/contenido";

/** Layout de la tienda pública: header y footer de la marca, con el contenido editable. */
export default async function SitioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { marca, contacto, pie, anuncios } = await getContenido();
  return (
    <>
      <Header marca={marca} contacto={contacto} franja={anuncios.franja} />
      <main>{children}</main>
      <Footer marca={marca} contacto={contacto} pie={pie} />
    </>
  );
}
