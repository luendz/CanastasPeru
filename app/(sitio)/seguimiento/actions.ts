"use server";

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
  items: { nombre: string; envase: string | null; cantidad: number; subtotal: number }[];
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
  const { data, error } = await supabase.rpc("seguimiento_pedido", { p_numero: numero, p_contacto: contacto });
  if (error) {
    console.error("No se pudo consultar el seguimiento.", error);
    return { error: "No pudimos consultar tu pedido. Inténtalo de nuevo en unos minutos.", numero };
  }
  if (!data) return { error: "No encontramos un pedido con esos datos. Revisa el número y usa el mismo correo o celular de la compra.", numero };
  return { pedido: data as PedidoSeguimiento, numero };
}
