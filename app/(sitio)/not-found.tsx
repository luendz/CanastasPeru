import type { Metadata } from "next";
import NoEncontrada from "@/components/NoEncontrada";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

/** 404 dentro de la tienda (producto o línea que ya no existe): el layout ya pone header y footer. */
export default function NoEncontradaSitio() {
  return <NoEncontrada />;
}
