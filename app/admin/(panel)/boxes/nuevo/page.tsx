import Link from "next/link";
import { requireSeccion } from "@/lib/admin/auth";
import { puede } from "@/lib/admin/permisos";
import BoxForm from "../BoxForm";

export const metadata = { title: "Nuevo box" };

export default async function NuevoBoxPage() {
  const { permisos } = await requireSeccion("boxes");
  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/boxes" className="admLinkMuted">← Boxes navideños</Link>
          <h1>Nuevo box</h1>
        </div>
      </header>
      <section className="admCard">
        {puede(permisos, "boxes.editar")
          ? <BoxForm box={{ nombre: "", precio: null, imagen: null, descripcion: "", incluye: [], activo: false }} puedeActivar={puede(permisos, "boxes.visibilidad")} />
          : <p className="admMuted">Tu rol no puede crear boxes.</p>}
      </section>
    </>
  );
}
