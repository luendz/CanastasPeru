/**
 * Reglas de reparto: se entrega martes, jueves y sábados, con al menos
 * 5 días de anticipación para preparar el pedido. Desde más de 100 canastas
 * el delivery es gratis (la base aplica la misma regla en crear_orden_web).
 */
export const DIAS_REPARTO = [2, 4, 6];
export const DIAS_REPARTO_TEXTO = "martes, jueves y sábados";
export const DIAS_ANTICIPACION = 5;
export const UNIDADES_DELIVERY_GRATIS = 100;

export const deliveryGratis = (unidades: number) => unidades > UNIDADES_DELIVERY_GRATIS;

/** Hoy en Lima, a medianoche UTC (para contar días sin saltos de zona horaria). */
function hoyLima() {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
  return new Date(`${iso}T00:00:00Z`);
}

const aIso = (d: Date) => d.toISOString().slice(0, 10);

/** Próximas fechas de reparto disponibles (desde hoy + 5 días). */
export function fechasReparto(cantidad = 24): string[] {
  const d = hoyLima();
  d.setUTCDate(d.getUTCDate() + DIAS_ANTICIPACION);
  const fechas: string[] = [];
  while (fechas.length < cantidad) {
    if (DIAS_REPARTO.includes(d.getUTCDay())) fechas.push(aIso(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return fechas;
}

/** ¿La fecha (AAAA-MM-DD) es día de reparto y respeta la anticipación? */
export function esFechaReparto(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const minima = hoyLima();
  minima.setUTCDate(minima.getUTCDate() + DIAS_ANTICIPACION);
  return d >= minima && DIAS_REPARTO.includes(d.getUTCDay());
}

/** "martes 13 de octubre" */
export const fechaReparto = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
