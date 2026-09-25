import Link from "next/link";
import type { Contenido } from "@/lib/contenido";

/** Marca (ícono, nombre y lema). Los datos se editan en Panel → Contenido → Marca. */
export default function Brand({ marca, tone = "dark" }: { marca: Contenido["marca"]; tone?: "dark" | "light" }) {
  return (
    <Link className={`brand ${tone === "light" ? "brandLight" : ""}`} href="/" aria-label={`${marca.nombre} · ${marca.lema}, ir al inicio`}>
      <span className="brandMark"><img src={marca.icono} alt="" width={160} height={160} /></span>
      <span className="brandText">
        <strong>{marca.nombre}</strong>
        <small>{marca.lema}</small>
      </span>
    </Link>
  );
}
