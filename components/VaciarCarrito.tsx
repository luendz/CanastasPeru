"use client";

import { useEffect } from "react";
import { borrarBorrador } from "@/lib/borrador";
import { carrito } from "@/lib/carrito";

/** Vacía el carrito y borra los datos guardados del checkout cuando el pedido ya quedó registrado. */
export default function VaciarCarrito() {
  useEffect(() => {
    carrito.vaciar();
    borrarBorrador("mka-borrador-checkout");
  }, []);
  return null;
}
