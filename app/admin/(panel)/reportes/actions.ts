"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { juntarClientes, type ClienteReporte } from "@/lib/admin/clientes";
import type { Compra, Cotizacion, Orden, OrdenItem, Producto } from "@/lib/admin/types";

export type DatosReporte = {
  desde: string;
  hasta: string;
  porCanasta: { canasta: string; pedidos: number; cantidad: number; precioCatalogo: number | null; precioPromedio: number; total: number }[];
  ordenes: (Orden & { items: OrdenItem[] })[];
  compras: Compra[];
  clientes: ClienteReporte[];
};

const fechaValida = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Datos de los reportes entre dos fechas (inclusive), en hora de Lima. */
export async function obtenerDatosReporte(desde: string, hasta: string): Promise<DatosReporte> {
  const { supabase } = await requireAdmin();
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) throw new Error("Rango de fechas inválido");

  const inicio = `${desde}T00:00:00-05:00`;
  const fin = `${hasta}T23:59:59.999-05:00`;

  const [{ data: ordenes, error: e1 }, { data: compras, error: e2 }, { data: productos }, { data: cotizaciones, error: e3 }, { data: zonas }] = await Promise.all([
    supabase.from("ordenes").select("*, orden_items(*)").is("eliminado_at", null).gte("created_at", inicio).lte("created_at", fin).order("created_at"),
    supabase.from("compras").select("*").gte("fecha", desde).lte("fecha", hasta).order("fecha"),
    supabase.from("canastas").select("nombre,precio"),
    supabase.from("cotizaciones").select("*").is("eliminado_at", null).gte("created_at", inicio).lte("created_at", fin).order("created_at"),
    supabase.from("zonas_delivery").select("distrito"),
  ]);
  if (e1 || e2 || e3) throw new Error((e1 ?? e2 ?? e3)!.message);

  const lista = ((ordenes ?? []) as (Orden & { orden_items: OrdenItem[] })[]).map(({ orden_items, ...o }) => ({ ...o, items: orden_items }));
  const precioDe = new Map(((productos ?? []) as Pick<Producto, "nombre" | "precio">[]).map((p) => [p.nombre, Number(p.precio)]));

  // Pedidos por canasta: solo órdenes no anuladas.
  const acc = new Map<string, { pedidos: Set<string>; cantidad: number; total: number }>();
  lista.filter((o) => o.estado !== "anulada").forEach((o) => {
    o.items.forEach((it) => {
      const a = acc.get(it.canasta_nombre) ?? { pedidos: new Set<string>(), cantidad: 0, total: 0 };
      a.pedidos.add(o.id);
      a.cantidad += it.cantidad;
      a.total += Number(it.subtotal);
      acc.set(it.canasta_nombre, a);
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

  const distritosLima = new Set(((zonas ?? []) as { distrito: string }[]).map((z) => z.distrito));
  const clientes = juntarClientes(lista, (cotizaciones ?? []) as Cotizacion[], distritosLima);

  return { desde, hasta, porCanasta, ordenes: lista, compras: (compras ?? []) as Compra[], clientes };
}
