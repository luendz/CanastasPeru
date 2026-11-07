import ConfirmButton from "./ConfirmButton";

type Props = {
  id: string;
  accion: (fd: FormData) => Promise<void>;
  mensaje: string;
  /** En el detalle: después de borrar vuelve a la lista. */
  volver?: boolean;
  /** "enlace": texto rojo pequeño (tablas); "boton": botón (cabecera). */
  variante?: "enlace" | "boton";
};

/** Botón Eliminar con confirmación. */
export default function BotonEliminar({ id, accion, mensaje, volver, variante = "enlace" }: Props) {
  return (
    <form action={accion} className="admFormInline">
      <input type="hidden" name="id" value={id} />
      {volver && <input type="hidden" name="volver" value="1" />}
      <ConfirmButton className={variante === "boton" ? "admBtn admBtnDanger" : "admLinkDanger"} message={mensaje}>Eliminar</ConfirmButton>
    </form>
  );
}
