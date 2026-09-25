"use server";

import { requireAdmin } from "@/lib/admin/auth";
import type { Compra, Orden, OrdenItem, Producto } from "@/lib/admin/types";

export type DatosReporte = {
  desde: string;
  hasta: string;
  porCanasta: { canasta: string; pedidos: number; cantidad: number; precioCatalogo: number | null; precioPromedio: number; total: number }[];
  ordenes: (Orden & { items: OrdenItem[] })[];
  compras: Compra[];
};

const fechaValida = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Datos de los reportes entre dos fechas (inclusive), en hora de Lima. */
export async function obtenerDatosReporte(desde: string, hasta: string): Promise<DatosReporte> {
  const { supabase } = await requireAdmin();
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) throw new Error("Rango de fechas inválido");

  const inicio = `${desde}T00:00:00-05:00`;
  const fin = `${hasta}T23:59:59.999-05:00`;

  const [{ data: ordenes, error: e1 }, { data: compras, error: e2 }, { data: productos }] = await Promise.all([
    supabase.from("ordenes").select("*, orden_items(*)").gte("created_at", inicio).lte("created_at", fin).order("created_at"),
    supabase.from("compras").select("*").gte("fecha", desde).lte("fecha", hasta).order("fecha"),
    supabase.from("productos").select("nombre,precio"),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2)!.message);

  const lista = ((ordenes ?? []) as (Orden & { orden_items: OrdenItem[] })[]).map(({ orden_items, ...o }) => ({ ...o, items: orden_items }));
  const precioDe = new Map(((productos ?? []) as Pick<Producto, "nombre" | "precio">[]).map((p) => [p.nombre, Number(p.precio)]));

  // Pedidos por canasta: solo órdenes no anuladas.
  const acc = new Map<string, { pedidos: Set<string>; cantidad: number; total: number }>();
  lista.filter((o) => o.estado !== "anulada").forEach((o) => {
    o.items.forEach((it) => {
      const a = acc.get(it.producto_nombre) ?? { pedidos: new Set<string>(), cantidad: 0, total: 0 };
      a.pedidos.add(o.id);
      a.cantidad += it.cantidad;
      a.total += Number(it.subtotal);
      acc.set(it.producto_nombre, a);
    });
  });
  const porCanasta = [...acc.entries()]
    .map(([canasta, a]) => ({
      canasta,
      pedidos: a.pedidos.size,
      cantidad: a.cantidad,
      precioCatalogo: precioDe.get(canasta) ?? null,
      precioPromedio: a.cantidad ? Math.round((a.total / a.cantidad) * 100) / 100 : 0,
      total: Math.round(a.total * 100) / 100,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return { desde, hasta, porCanasta, ordenes: lista, compras: (compras ?? []) as Compra[] };
}
