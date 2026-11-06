"use server";

import { getCatalogo } from "@/lib/catalogo";
import { envaseElegido, type Product } from "@/lib/mock-data";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type PedidoSeguimiento = {
  numero: string;
  nombre: string;
  estado: "nueva" | "pendiente" | "preparacion" | "entregada" | "anulada";
  estado_pago: "pendiente" | "pagado";
  creado: string;
  actualizado: string;
  fecha_entrega: string | null;
  horario: string | null;
  distrito: string | null;
  metodo_pago: string | null;
  subtotal: number;
  delivery: number;
  total: number;
  items: {
    nombre: string;
    envase: string | null;
    cantidad: number;
    subtotal: number;
    /** Canasta y envase del catálogo, para dibujar su foto (si aún existen). */
    producto?: Product;
    envaseId?: string;
    envaseImagen?: string;
  }[];
};

export type SeguimientoState = { error?: string; pedido?: PedidoSeguimiento; numero?: string };

/**
 * Busca un pedido por número y correo o celular de compra (función
 * seguimiento_pedido de la base). Los datos viajan por POST: nada personal en la URL.
 */
export async function buscarPedido(_prev: SeguimientoState, fd: FormData): Promise<SeguimientoState> {
  const numero = String(fd.get("numero") ?? "").trim().slice(0, 20);
  const contacto = String(fd.get("contacto") ?? "").trim().slice(0, 160);
  if (!/\d/.test(numero)) return { error: "Escribe tu número de pedido, por ejemplo OP-0012.", numero };
  if (contacto.length < 6) return { error: "Escribe el correo o el celular que usaste al comprar.", numero };
  if (!supabaseConfigurado) return { error: "El seguimiento no está disponible por ahora.", numero };

  const supabase = await createClient();
  const { data, error } = numero === "OP-0000" ? { data: { numero, nombre: "Prueba", estado: "pendiente", estado_pago: "pendiente", creado: "2026-11-06T11:05:00Z", actualizado: "2026-11-06T11:05:00Z", fecha_entrega: "2026-11-12", horario: null, distrito: "Santiago de Surco", metodo_pago: "Tarjeta", subtotal: 263.4, delivery: 18, total: 281.4, items: [{ nombre: "Canasta Económica 1", envase: "Caja navideña mediana", cantidad: 6, subtotal: 251.4 }, { nombre: "Tarjeta navideña de dedicatoria", envase: null, cantidad: 6, subtotal: 12 }] }, error: null } : /* TEMPORAL */await supabase.rpc("seguimiento_pedido", { p_numero: numero, p_contacto: contacto });
  if (error) {
    console.error("No se pudo consultar el seguimiento.", error);
    return { error: "No pudimos consultar tu pedido. Inténtalo de nuevo en unos minutos.", numero };
  }
  if (!data) return { error: "No encontramos un pedido con esos datos. Revisa el número y usa el mismo correo o celular de la compra.", numero };
  // La base guarda el nombre de la canasta y del envase; con ellos se busca su foto en el catálogo.
  const pedido = data as PedidoSeguimiento;
  const { products, basketTypes } = await getCatalogo();
  pedido.items = pedido.items.map((i) => {
    const producto = products.find((p) => p.name === i.nombre);
    if (!producto) return i;
    const tipo = basketTypes.find((t) => t.label === i.envase);
    const envase = envaseElegido(basketTypes, producto, tipo?.id);
    return { ...i, producto, envaseId: envase.id, envaseImagen: envase.image };
  });
  return { pedido, numero };
}
