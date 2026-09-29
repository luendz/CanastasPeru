"use client";

import { useEffect } from "react";
import { carrito } from "@/lib/carrito";

/** Vacía el carrito cuando el pedido ya quedó registrado. */
export default function VaciarCarrito() {
  useEffect(() => carrito.vaciar(), []);
  return null;
}
