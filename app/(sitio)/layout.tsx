import Header from "@/components/Header";
import Footer from "@/components/Footer";

/** Layout de la tienda pública: header y footer de la marca. */
export default function SitioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
