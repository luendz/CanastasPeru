import Link from "next/link";
import type { Contenido } from "@/lib/contenido";

/** Logo completo de la marca (canasta, nombre y lema). Se cambia en Panel → Contenido → Marca. */
export default function Brand({ marca, tone = "dark" }: { marca: Contenido["marca"]; tone?: "dark" | "light" }) {
  const logo = tone === "light" ? marca.logoBlanco || marca.logo : marca.logo;
  return (
    <Link className={`brand ${tone === "light" ? "brandLight" : ""}`} href="/" aria-label={`${marca.nombre} · ${marca.lema}, ir al inicio`}>
      <img className="brandLogo" src={logo} alt={`${marca.nombre} · ${marca.lema}`} width={1246} height={385} />
    </Link>
  );
}
