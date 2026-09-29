"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { TIPOS_COSTO, TIPOS_DOCUMENTO } from "@/lib/admin/types";

export type CompraState = { ok?: boolean; error?: string };

/** Cabecera del comprobante: se repite en cada ítem registrado. */
export type CabeceraCompra = {
  fecha: string;
  tipo_documento: string;
  comprobante: string;
  proveedor: string;
  ruc_proveedor: string;
  incluye_igv: boolean;
  notas: string;
};

export type ItemCompra = {
  categoria: string;
  insumo_id: string | null;
  descripcion: string;
  presentacion: string;
  cantidad_presentaciones: number;
  unidades_por_presentacion: number;
  precio_presentacion: number;
  afecto_igv: boolean;
};

const txt = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const num = (v: unknown) => Number(String(v ?? "").replace(",", "."));

const refrescar = () => {
  for (const p of ["/admin/compras", "/admin", "/admin/costeo", "/admin/produccion", "/admin/productos"]) revalidatePath(p);
};

/**
 * Importe pagado por un ítem. Si el precio se ingresó sin IGV y el producto
 * está afecto, se le suma el 18 %. El costo unitario es ese importe entre las
 * unidades: paquete de 20 a S/ 60 → S/ 3.00 por unidad.
 */
function calcular(cab: Pick<CabeceraCompra, "incluye_igv">, it: ItemCompra) {
  const bruto = it.cantidad_presentaciones * it.precio_presentacion;
  const importe = !cab.incluye_igv && it.afecto_igv ? bruto * 1.18 : bruto;
  const unidades = it.cantidad_presentaciones * it.unidades_por_presentacion;
  return { unidades, costo_unitario: unidades > 0 ? importe / unidades : 0 };
}

function validarCabecera(c: CabeceraCompra): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) return "Elige la fecha de compra.";
  if (!TIPOS_DOCUMENTO.some((t) => t.id === c.tipo_documento)) return "Elige el tipo de documento.";
  if (c.ruc_proveedor && !/^\d{8,11}$/.test(c.ruc_proveedor)) return "El RUC del proveedor debe tener 11 dígitos (o 8 si es DNI).";
  return null;
}

function validarItem(it: ItemCompra, n: number): string | null {
  const donde = `Ítem ${n}: `;
  if (!TIPOS_COSTO.some((t) => t.id === it.categoria)) return `${donde}elige el tipo de costo.`;
  if (!it.descripcion) return `${donde}escribe la descripción o elige un producto.`;
  if (!(it.cantidad_presentaciones > 0)) return `${donde}la cantidad comprada debe ser mayor que cero.`;
  if (!(it.unidades_por_presentacion > 0)) return `${donde}las unidades por presentación deben ser mayores que cero.`;
  if (!(it.precio_presentacion >= 0)) return `${donde}el precio no es válido.`;
  return null;
}

function fila(cab: CabeceraCompra, it: ItemCompra) {
  const { unidades, costo_unitario } = calcular(cab, it);
  return {
    fecha: cab.fecha,
    tipo_documento: cab.tipo_documento,
    comprobante: txt(cab.comprobante, 60) || null,
    proveedor: txt(cab.proveedor, 160) || null,
    ruc_proveedor: txt(cab.ruc_proveedor, 11) || null,
    incluye_igv: cab.incluye_igv,
    notas: txt(cab.notas, 1000) || null,
    categoria: it.categoria,
    insumo_id: it.insumo_id || null,
    descripcion: txt(it.descripcion, 300),
    presentacion: txt(it.presentacion, 30) || "Unidad",
    cantidad_presentaciones: it.cantidad_presentaciones,
    unidades_por_presentacion: it.unidades_por_presentacion,
    precio_presentacion: it.precio_presentacion,
    afecto_igv: it.afecto_igv,
    cantidad: unidades,
    costo_unitario: Math.round(costo_unitario * 1e6) / 1e6,
  };
}

function leer(formData: FormData): { cab: CabeceraCompra; items: ItemCompra[] } | { error: string } {
  try {
    const datos = JSON.parse(String(formData.get("datos") ?? "{}")) as { cab: CabeceraCompra; items: ItemCompra[] };
    const cab: CabeceraCompra = {
      fecha: txt(datos.cab?.fecha, 10),
      tipo_documento: txt(datos.cab?.tipo_documento, 20),
      comprobante: txt(datos.cab?.comprobante, 60),
      proveedor: txt(datos.cab?.proveedor, 160),
      ruc_proveedor: txt(datos.cab?.ruc_proveedor, 11).replace(/\D/g, ""),
      incluye_igv: Boolean(datos.cab?.incluye_igv),
      notas: txt(datos.cab?.notas, 1000),
    };
    const items = (Array.isArray(datos.items) ? datos.items : []).slice(0, 60).map((it) => ({
      categoria: txt(it.categoria, 20),
      insumo_id: txt(it.insumo_id, 40) || null,
      descripcion: txt(it.descripcion, 300),
      presentacion: txt(it.presentacion, 30),
      cantidad_presentaciones: num(it.cantidad_presentaciones),
      unidades_por_presentacion: num(it.unidades_por_presentacion),
      precio_presentacion: num(it.precio_presentacion),
      afecto_igv: Boolean(it.afecto_igv),
    }));
    return { cab, items };
  } catch {
    return { error: "Datos inválidos." };
  }
}

/** Registra un comprobante con uno o varios ítems. */
export async function registrarCompras(_prev: CompraState, formData: FormData): Promise<CompraState> {
  const { supabase } = await requireAdmin();
  const r = leer(formData);
  if ("error" in r) return { error: r.error };
  const errorCab = validarCabecera(r.cab);
  if (errorCab) return { error: errorCab };
  if (!r.items.length) return { error: "Agrega al menos un ítem." };
  for (const [i, it] of r.items.entries()) {
    const e = validarItem(it, i + 1);
    if (e) return { error: e };
  }

  const { error } = await supabase.from("compras").insert(r.items.map((it) => fila(r.cab, it)));
  if (error) return { error: error.message };

  // Cada producto recuerda cómo se compra, para prellenar la próxima vez.
  for (const it of r.items.filter((x) => x.insumo_id)) {
    await supabase.from("insumos").update({ presentacion_compra: it.presentacion || "Unidad", unidades_por_presentacion: it.unidades_por_presentacion }).eq("id", it.insumo_id!);
  }

  refrescar();
  redirect(`/admin/compras?mes=${r.cab.fecha.slice(0, 7)}&registrado=${r.items.length}`);
}

/** Corrige un registro (una fila del listado). */
export async function editarCompra(_prev: CompraState, formData: FormData): Promise<CompraState> {
  const { supabase } = await requireAdmin();
  const id = txt(formData.get("id"), 40);
  const r = leer(formData);
  if ("error" in r) return { error: r.error };
  const errorCab = validarCabecera(r.cab);
  if (errorCab) return { error: errorCab };
  const it = r.items[0];
  if (!it) return { error: "Faltan los datos del ítem." };
  const e = validarItem(it, 1);
  if (e) return { error: e.replace("Ítem 1: ", "") };

  const { error } = await supabase.from("compras").update(fila(r.cab, it)).eq("id", id);
  if (error) return { error: error.message };
  refrescar();
  redirect(`/admin/compras?mes=${r.cab.fecha.slice(0, 7)}&editado=1`);
}

export async function eliminarCompra(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("compras").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) throw new Error(error.message);
  refrescar();
  redirect("/admin/compras");
}
