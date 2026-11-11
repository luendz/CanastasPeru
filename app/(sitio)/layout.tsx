import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { productosDe } from "@/lib/lineas";

/** Layout de la tienda pública: header y footer de la marca, con el contenido editable. */
export default async function SitioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ marca, contacto, pie, anuncios }, { products }] = await Promise.all([getContenido(), getCatalogo()]);
  return (
    <>
      <Header marca={marca} contacto={contacto} franja={anuncios.franja} hayBoxes={productosDe(products, "boxes").length > 0} />
      <main>{children}</main>
      <Footer marca={marca} contacto={contacto} pie={pie} />
    </>
  );
}
