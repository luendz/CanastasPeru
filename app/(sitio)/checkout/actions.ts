"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { esFechaReparto } from "@/lib/entrega";
import { findBasketType } from "@/lib/mock-data";
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
  if (!esFechaReparto(campo(fd, "fecha_entrega"))) return { error: "Elige una fecha de reparto: martes, jueves o sábado, con al menos 5 días de anticipación." };
  if (!fd.get("terminos")) return { error: "Acepta los términos para continuar." };

  let items: { slug: string; tipo_canasta?: string; cantidad: number }[] = [];
  try {
    items = JSON.parse(campo(fd, "items"));
  } catch {
    return { error: "No pudimos leer tu carrito." };
  }
  if (!items.length) return { error: "Tu carrito está vacío." };

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
        recibe_nombre: campo(fd, "recibe_nombre"),
        recibe_telefono: campo(fd, "recibe_telefono"),
      },
      tarjetas: { cantidad: Math.max(0, Math.round(Number(campo(fd, "tarjetas")) || 0)), dedicatoria: campo(fd, "dedicatoria") },
      metodo_pago: campo(fd, "metodo_pago"),
      items: items.map((i) => ({ slug: i.slug, tipo_canasta: i.tipo_canasta ?? "", cantidad: i.cantidad })),
    },
  });

  if (error || !data) return { error: "No pudimos registrar tu pedido. Inténtalo de nuevo en unos minutos." };

  const { numero, total } = data as { numero: string; total: number };

  // Resumen para la página de confirmación (cookie privada de una hora; nada personal va en la URL).
  const [{ products, basketTypes }, { checkout }] = await Promise.all([getCatalogo(), getContenido()]);
  const lineas = items.flatMap((i) => {
    const p = products.find((x) => x.slug === i.slug);
    if (!p) return [];
    const propia = findBasketType(basketTypes, p);
    const tipo = basketTypes.find((t) => t.id === i.tipo_canasta) ?? propia;
    return [{ nombre: p.name, detalle: tipo.label, cantidad: i.cantidad, precio: p.price + tipo.priceDelta - propia.priceDelta }];
  });
  const tarjetas = Math.max(0, Math.round(Number(campo(fd, "tarjetas")) || 0));
  if (tarjetas) lineas.push({ nombre: "Tarjeta de dedicatoria", detalle: "", cantidad: tarjetas, precio: checkout.tarjetaPrecio });
  (await cookies()).set(
    "mka-pedido",
    JSON.stringify({
      numero,
      total: Number(total),
      lineas,
      distrito: campo(fd, "distrito"),
      fecha: campo(fd, "fecha_entrega"),
      pago: campo(fd, "metodo_pago"),
      comprobante: factura ? "Factura" : "Boleta",
      correo: campo(fd, "email"),
    }),
    { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 3600, path: "/confirmacion" },
  );
  redirect(`/confirmacion?pedido=${encodeURIComponent(numero)}&total=${Number(total).toFixed(2)}`);
}
