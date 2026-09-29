import { requireAdmin } from "@/lib/admin/auth";
import PestanasProductos from "../productos/PestanasProductos";
import Biblioteca from "./Biblioteca";

export const metadata = { title: "Imágenes" };

export default async function MediosPage() {
  await requireAdmin();
  return (
    <>
      <header className="admHead">
        <div>
          <h1>Productos</h1>
          <p className="admMuted">
            Biblioteca con las fotos de productos, canastas y marca. Luego elígelas desde la ficha de cada producto, el Catálogo o Contenido.
            Una imagen que se está usando en la web no se puede borrar.
          </p>
        </div>
      </header>
      <PestanasProductos actual="imagenes" />
      <section className="admCard">
        <Biblioteca />
      </section>
    </>
  );
}
