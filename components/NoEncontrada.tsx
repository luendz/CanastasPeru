import Link from "next/link";
import AdornoNavidad from "@/components/AdornoNavidad";
import Icono from "@/components/Icono";

/** Contenido de la página 404 de la tienda (sin header ni footer). */
export default function NoEncontrada() {
  return (
    <section className="shell noEncontrada">
      <AdornoNavidad className="noEncontradaAdorno" />
      <span className="eyebrow">Error 404</span>
      <h1>Esta página <em>no está</em> disponible</h1>
      <p>Puede que el enlace esté mal escrito o que el producto ya no se encuentre en el catálogo. Te ayudamos a encontrar el regalo ideal.</p>
      <div className="noEncontradaBotones">
        <Link className="btn btnPrimary" href="/canastas">Ver canastas <Icono nombre="flecha" /></Link>
        <Link className="btn btnGhost" href="/">Ir al inicio</Link>
      </div>
    </section>
  );
}
