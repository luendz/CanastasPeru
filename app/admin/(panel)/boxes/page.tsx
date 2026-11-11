import Link from "next/link";
import { requireSeccion } from "@/lib/admin/auth";
import { soles } from "@/lib/admin/format";
import { puede } from "@/lib/admin/permisos";
import BotonEliminar from "../BotonEliminar";
import { alternarBox, eliminarBox, moverBox } from "./actions";

export const metadata = { title: "Boxes navideños" };

type Fila = { id: string; slug: string; nombre: string; precio: number; imagen: string | null; incluye: string[] | null; activo: boolean };

/** Boxes navideños: lista simple con foto, precio, contenido y activar / desactivar. */
export default async function BoxesPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const { supabase, permisos } = await requireSeccion("boxes");
  const { creado } = await searchParams;
  const { data, error } = await supabase
    .from("canastas")
    .select("id,slug,nombre,precio,imagen,incluye,activo")
    .eq("envase_base_id", "box")
    .order("orden")
    .order("created_at");
  const boxes = (data ?? []) as Fila[];
  const editar = puede(permisos, "boxes.editar");
  const visibilidad = puede(permisos, "boxes.visibilidad");
  const activos = boxes.filter((b) => b.activo).length;

  return (
    <div className="admStack">
      <header className="admHead">
        <div>
          <h1>Boxes navideños</h1>
          <p className="admMuted">
            {activos > 0
              ? `${activos} activo${activos === 1 ? "" : "s"}: la sección Boxes y el botón «Ver boxes» del banner de inicio se muestran en la web.`
              : "Ningún box activo: la sección Boxes y el botón del banner de inicio no se muestran en la web."}
          </p>
        </div>
        {editar && <Link className="admBtn" href="/admin/boxes/nuevo">+ Nuevo box</Link>}
      </header>

      {creado && <p className="admSuccess" role="status">Box «{creado}» creado.</p>}
      {error && <p className="admError">No se pudieron cargar los boxes: {error.message}</p>}

      <section className="admCard admCardFlush">
        {boxes.length === 0 ? (
          <p className="admEmpty">Todavía no hay boxes.{editar && <> <Link href="/admin/boxes/nuevo">Crea el primero →</Link></>}</p>
        ) : (
          <table className="admTable">
            <thead><tr><th>Orden</th><th>Box</th><th className="num">Precio</th><th>Incluye</th><th>Web</th><th><span className="admSrOnly">Acciones</span></th></tr></thead>
            <tbody>
              {boxes.map((b, n) => (
                <tr key={b.id}>
                  <td>
                    {editar && (
                      <span className="admBoxOrden">
                        <form action={moverBox}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="dir" value="arriba" /><button className="admIconBtn" disabled={n === 0} aria-label="Subir">↑</button></form>
                        <form action={moverBox}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="dir" value="abajo" /><button className="admIconBtn" disabled={n === boxes.length - 1} aria-label="Bajar">↓</button></form>
                      </span>
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/boxes/${b.id}`} className="admBoxNombre">
                      {b.imagen ? <img src={b.imagen} alt="" /> : <span className="admBoxSinFoto" aria-hidden="true">🎁</span>}
                      <span><strong>{b.nombre}</strong>{!b.imagen && <small className="admMuted admBlock">Sin foto</small>}</span>
                    </Link>
                  </td>
                  <td className="num">{soles(b.precio)}</td>
                  <td>{b.incluye?.length ? `${b.incluye.length} producto${b.incluye.length === 1 ? "" : "s"}` : <span className="admMuted">Sin contenido</span>}</td>
                  <td>
                    {visibilidad ? (
                      <form action={alternarBox}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="activo" value={String(!b.activo)} />
                        <button type="submit" className="admToggle" aria-pressed={b.activo} title={b.activo ? "Ocultar de la web" : "Mostrar en la web"}><span />{b.activo ? "Activo" : "Inactivo"}</button>
                      </form>
                    ) : b.activo ? "Activo" : "Inactivo"}
                  </td>
                  <td>
                    <span className="admBoxAcciones">
                      <Link className="admIconBtn" href={`/admin/boxes/${b.id}`}>{editar ? "Editar" : "Ver"}</Link>
                      {editar && <BotonEliminar id={b.id} accion={eliminarBox} mensaje={`¿Eliminar el box «${b.nombre}»? No se puede deshacer.`} />}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
