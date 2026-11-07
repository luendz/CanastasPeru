import ConfirmButton from "./ConfirmButton";

type Props = {
  id: string;
  accion: (fd: FormData) => Promise<void>;
  mensaje: string;
  /** En el detalle: después de eliminar vuelve a la lista. */
  volver?: boolean;
  /** "enlace": texto pequeño (tablas); "boton": botón (cabecera). */
  variante?: "enlace" | "boton";
  /** "restaurar": devuelve un elemento eliminado. */
  tipo?: "eliminar" | "restaurar";
};

/** Botón Eliminar o Restaurar con confirmación (eliminación lógica). */
export default function BotonEliminar({ id, accion, mensaje, volver, variante = "enlace", tipo = "eliminar" }: Props) {
  const restaurar = tipo === "restaurar";
  const clase = variante === "boton" ? (restaurar ? "admBtn" : "admBtn admBtnDanger") : restaurar ? "admLinkMuted" : "admLinkDanger";
  return (
    <form action={accion} className="admFormInline">
      <input type="hidden" name="id" value={id} />
      {volver && <input type="hidden" name="volver" value="1" />}
      <ConfirmButton className={clase} message={mensaje}>{restaurar ? "Restaurar" : "Eliminar"}</ConfirmButton>
    </form>
  );
}
