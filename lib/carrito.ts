"use client";

import { useSyncExternalStore } from "react";

/*
 * Carrito de la tienda, guardado en el navegador (localStorage) para que
 * sobreviva a recargas. Los precios NO se guardan aquí: se calculan con el
 * catálogo al mostrarlo y la base los recalcula al crear el pedido.
 */

export type LineaCarrito = { slug: string; tipo: string; cantidad: number };
export type Tarjetas = { activa: boolean; cantidad: number; dedicatoria: string };
export type Carrito = { lineas: LineaCarrito[]; tarjetas: Tarjetas };

const CLAVE = "mka-carrito";
const VACIO: Carrito = { lineas: [], tarjetas: { activa: false, cantidad: 1, dedicatoria: "" } };

let actual: Carrito | null = null;
const oyentes = new Set<() => void>();

function leer(): Carrito {
  if (actual) return actual;
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as Partial<Carrito> | null;
    actual = {
      lineas: Array.isArray(crudo?.lineas)
        ? crudo.lineas
            .filter((l) => l && typeof l.slug === "string" && typeof l.tipo === "string")
            .map((l) => ({ slug: l.slug, tipo: l.tipo, cantidad: Math.min(500, Math.max(1, Math.round(Number(l.cantidad) || 1))) }))
        : [],
      tarjetas: {
        activa: Boolean(crudo?.tarjetas?.activa),
        cantidad: Math.min(500, Math.max(1, Math.round(Number(crudo?.tarjetas?.cantidad) || 1))),
        dedicatoria: String(crudo?.tarjetas?.dedicatoria ?? "").slice(0, 240),
      },
    };
  } catch {
    actual = VACIO;
  }
  return actual;
}

function guardar(nuevo: Carrito) {
  actual = nuevo;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    /* Navegación privada o almacenamiento lleno: el carrito vive en memoria. */
  }
  oyentes.forEach((o) => o());
}

function suscribir(o: () => void) {
  oyentes.add(o);
  const alCambiarOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE) {
      actual = null;
      o();
    }
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(o);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

export function useCarrito() {
  return useSyncExternalStore(suscribir, leer, () => VACIO);
}

export const carrito = {
  agregar(slug: string, tipo: string, cantidad: number) {
    const c = leer();
    const existe = c.lineas.find((l) => l.slug === slug && l.tipo === tipo);
    const lineas = existe
      ? c.lineas.map((l) => (l === existe ? { ...l, cantidad: Math.min(500, l.cantidad + cantidad) } : l))
      : [...c.lineas, { slug, tipo, cantidad }];
    guardar({ ...c, lineas });
    window.dispatchEvent(new CustomEvent("mka:cart-add", { detail: { qty: cantidad } }));
  },
  cantidad(slug: string, tipo: string, cantidad: number) {
    const c = leer();
    guardar({ ...c, lineas: c.lineas.map((l) => (l.slug === slug && l.tipo === tipo ? { ...l, cantidad: Math.min(500, Math.max(1, cantidad)) } : l)) });
  },
  quitar(slug: string, tipo: string) {
    const c = leer();
    guardar({ ...c, lineas: c.lineas.filter((l) => !(l.slug === slug && l.tipo === tipo)) });
  },
  tarjetas(cambios: Partial<Tarjetas>) {
    const c = leer();
    guardar({ ...c, tarjetas: { ...c.tarjetas, ...cambios } });
  },
  vaciar() {
    guardar(VACIO);
  },
};

export const unidades = (c: Carrito) => c.lineas.reduce((s, l) => s + l.cantidad, 0);
