import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeccion } from "@/lib/admin/auth";
import { puede } from "@/lib/admin/permisos";
import BotonEliminar from "../../BotonEliminar";
import { eliminarBox } from "../actions";
import BoxForm from "../BoxForm";
import { ajusteFoto } from "../foto";

export const metadata = { title: "Editar box" };

export default async function EditarBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, permisos } = await requireSeccion("boxes");
  const { data: b } = await supabase
    .from("canastas")
    .select("id,slug,nombre,precio,imagen,descripcion,incluye,activo,ajuste_envase")
    .eq("id", id)
    .eq("envase_base_id", "box")
    .maybeSingle();
  if (!b) notFound();
  const editar = puede(permisos, "boxes.editar");

  return (
    <>
      <header className="admHead">
        <div>
          <Link href="/admin/boxes" className="admLinkMuted">← Boxes navideños</Link>
          <h1>{b.nombre}</h1>
          <p className="admMuted">
            {b.activo ? <>Visible en la web: <a href={`/producto/${b.slug}`} target="_blank" rel="noopener noreferrer">ver ficha ↗</a></> : "Oculto en la web."}
          </p>
        </div>
        {editar && <BotonEliminar id={b.id} accion={eliminarBox} volver variante="boton" mensaje={`¿Eliminar el box «${b.nombre}»? No se puede deshacer.`} />}
      </header>
      <section className="admCard">
        {editar ? (
          <BoxForm
            box={{ id: b.id, nombre: b.nombre, precio: Number(b.precio), imagen: b.imagen, descripcion: b.descripcion ?? "", incluye: (b.incluye ?? []) as string[], activo: b.activo, ajuste: ajusteFoto(b.ajuste_envase) }}
            puedeActivar={puede(permisos, "boxes.visibilidad")}
          />
        ) : (
          <p className="admMuted">Tu rol puede ver los boxes pero no editarlos.</p>
        )}
      </section>
    </>
  );
}
