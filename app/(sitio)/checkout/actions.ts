"use server";

import { redirect } from "next/navigation";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CheckoutState = { error?: string };

const campo = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/**
 * Crea la orden de pedido desde el checkout. Los precios y el delivery los
 * recalcula la base (función crear_orden_web); aquí solo se envían los datos.
 */
export async function crearPedido(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const nombre = [campo(fd, "nombres"), campo(fd, "apellidos")].filter(Boolean).join(" ");
  if (!nombre) return { error: "Escribe tu nombre para continuar." };
  if (!campo(fd, "email") && !campo(fd, "telefono")) return { error: "Déjanos un correo o un celular para confirmarte el pedido." };
  if (!campo(fd, "distrito")) return { error: "Elige el distrito de entrega." };
  if (!fd.get("terminos")) return { error: "Acepta los términos para continuar." };

  let items: { slug: string; cantidad: number }[] = [];
  try {
    items = JSON.parse(campo(fd, "items"));
  } catch {
    return { error: "No pudimos leer tu carrito." };
  }

  // Sin Supabase configurado, la tienda funciona como demostración.
  if (!supabaseConfigurado) redirect("/confirmacion");

  const factura = campo(fd, "comprobante") === "factura";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_orden_web", {
    p: {
      cliente: { nombre, email: campo(fd, "email"), telefono: campo(fd, "telefono") },
      comprobante: {
        tipo: factura ? "factura" : "boleta",
        documento: campo(fd, factura ? "ruc" : "dni"),
        nombre: campo(fd, factura ? "razon_social" : "nombre_comprobante"),
        direccion_fiscal: factura ? campo(fd, "direccion_fiscal") : "",
      },
      entrega: {
        distrito: campo(fd, "distrito"),
        direccion: campo(fd, "direccion"),
        referencia: campo(fd, "referencia"),
        fecha: campo(fd, "fecha_entrega"),
        horario: campo(fd, "horario"),
        recibe_nombre: campo(fd, "recibe_nombre"),
        recibe_telefono: campo(fd, "recibe_telefono"),
        dedicatoria: campo(fd, "dedicatoria"),
      },
      metodo_pago: campo(fd, "metodo_pago"),
      items: items.map((i) => ({ slug: i.slug, cantidad: i.cantidad })),
    },
  });

  if (error || !data) return { error: "No pudimos registrar tu pedido. Inténtalo de nuevo en unos minutos." };

  const { numero, total } = data as { numero: string; total: number };
  redirect(`/confirmacion?pedido=${encodeURIComponent(numero)}&total=${Number(total).toFixed(2)}`);
}
