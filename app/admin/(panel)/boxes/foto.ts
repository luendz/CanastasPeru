/** Límites del ajuste de la foto del box (tamaño en %, desplazamiento en % del recuadro). */
export const FOTO_ESCALA_MIN = 50;
export const FOTO_ESCALA_MAX = 250;
export const FOTO_DESPLAZA = 50;

export type AjusteFoto = { x: number; y: number; escala: number };
export const AJUSTE_FOTO_NEUTRO: AjusteFoto = { x: 0, y: 0, escala: 100 };

/** Ajuste guardado del box (en canastas.ajuste_envase.box), o el neutro. */
export function ajusteFoto(guardado: unknown): AjusteFoto {
  const a = (guardado as Record<string, Partial<AjusteFoto>> | null)?.box;
  const n = (v: unknown, def: number) => (typeof v === "number" && Number.isFinite(v) ? v : def);
  return a ? { x: n(a.x, 0), y: n(a.y, 0), escala: n(a.escala, 100) } : AJUSTE_FOTO_NEUTRO;
}
