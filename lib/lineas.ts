import type { Product } from "@/lib/mock-data";

/*
 * Líneas del catálogo. Cada canasta pertenece a una según su categoría
 * (Panel → Catálogo): "Económica", "Premium", "Ejecutiva" o "Box Navideño".
 */
export type Linea = { id: "economicas" | "premium" | "ejecutivas" | "boxes"; categoria: string; titulo: string; corto: string };

export const LINEAS: Linea[] = [
  { id: "economicas", categoria: "Económica", titulo: "Canastas económicas", corto: "Económicas" },
  { id: "premium", categoria: "Premium", titulo: "Canastas premium", corto: "Premium" },
  { id: "ejecutivas", categoria: "Ejecutiva", titulo: "Canastas ejecutivas", corto: "Ejecutivas" },
  { id: "boxes", categoria: "Box Navideño", titulo: "Boxes navideños", corto: "Boxes" },
];

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Línea de una canasta por su categoría ("Económica", "Box navideño", "Ejecutivas"…). */
export function lineaDe(p: Pick<Product, "category">): Linea | undefined {
  const c = normal(p.category);
  return LINEAS.find((l) => {
    const base = normal(l.categoria);
    return c === base || c.startsWith(base.slice(0, 6));
  });
}

export const productosDe = (products: Product[], linea: Linea["id"]) => products.filter((p) => lineaDe(p)?.id === linea);
