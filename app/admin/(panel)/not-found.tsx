import Link from "next/link";

/** 404 dentro del panel: un registro que ya no existe o una dirección mal escrita. */
export default function NoEncontradaPanel() {
  return (
    <section className="admCard">
      <h1>No encontramos esta página</h1>
      <p className="admMuted">Puede que el registro se haya eliminado o que la dirección esté mal escrita.</p>
      <p><Link className="admBtn" href="/admin">Volver al inicio del panel</Link></p>
    </section>
  );
}
