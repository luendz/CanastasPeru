import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContenido } from "@/lib/contenido";

/** Layout de la tienda pública: header y footer de la marca, con el contenido editable. */
export default async function SitioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { marca, anuncios, contacto, pie } = await getContenido();
  return (
    <>
      <Header marca={marca} anuncios={anuncios} />
      <main>{children}</main>
      <Footer marca={marca} contacto={contacto} pie={pie} />
    </>
  );
}
