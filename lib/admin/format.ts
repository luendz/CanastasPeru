import { formatPrice } from "@/lib/mock-data";

const LIMA = "America/Lima";

export const soles = (n: number | string | null | undefined) => formatPrice(Number(n ?? 0));

export const fecha = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-PE", { timeZone: LIMA, day: "2-digit", month: "short", year: "numeric" }) : "—";

/** Fecha simple: 24/09/2026. */
export const fechaCorta = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-PE", { timeZone: LIMA, day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const fechaHora = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("es-PE", { timeZone: LIMA, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export const numero = (n: number | string | null | undefined, decimales = 0) =>
  Number(n ?? 0).toLocaleString("es-PE", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/** Fecha de hoy en Lima como YYYY-MM-DD. */
export const hoyLima = () => new Date().toLocaleDateString("en-CA", { timeZone: LIMA });

/** Primer día del mes actual en Lima como YYYY-MM-DD. */
export const inicioMesLima = () => `${hoyLima().slice(0, 7)}-01`;
