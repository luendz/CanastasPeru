import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { baseCaida, getContenido } from "@/lib/contenido";

/** Layout de la tienda pública: header y footer de la marca, con el contenido editable. */
export default async function SitioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ marca, contacto, pie, anuncios }, caida] = await Promise.all([getContenido(), baseCaida()]);
  // Si Supabase no responde, la web muestra el catálogo de respaldo: se avisa y se deriva a WhatsApp.
  const franja = caida ? `Estamos actualizando la tienda · Para pedidos escríbenos por WhatsApp al ${contacto.telefono}` : anuncios.franja;
  return (
    <>
      <Header marca={marca} contacto={contacto} franja={franja} />
      <main>{children}</main>
      <Footer marca={marca} contacto={contacto} pie={pie} />
    </>
  );
}
