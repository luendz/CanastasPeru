import { requireAdmin } from "@/lib/admin/auth";
import Biblioteca from "./Biblioteca";

export const metadata = { title: "Imágenes" };

export default async function MediosPage() {
  await requireAdmin();
  return (
    <>
      <header className="admHead">
        <div>
          <h1>Imágenes</h1>
          <p className="admMuted">
            Sube aquí las fotos de productos, canastas y marca. Luego elígelas desde Catálogo o Contenido.
            Una imagen que se está usando en la web no se puede borrar.
          </p>
        </div>
      </header>
      <section className="admCard">
        <Biblioteca />
      </section>
    </>
  );
}
