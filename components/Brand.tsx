import Link from "next/link";

export const BRAND_NAME = "MKA";
export const BRAND_TAGLINE = "Canastas Navideñas & Regalos";

export default function Brand({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link className={`brand ${tone === "light" ? "brandLight" : ""}`} href="/" aria-label={`${BRAND_NAME} · ${BRAND_TAGLINE}, ir al inicio`}>
      <span className="brandMark"><img src="/marca/mka-icono.png" alt="" width={160} height={160} /></span>
      <span className="brandText">
        <strong>{BRAND_NAME}</strong>
        <small>{BRAND_TAGLINE}</small>
      </span>
    </Link>
  );
}
