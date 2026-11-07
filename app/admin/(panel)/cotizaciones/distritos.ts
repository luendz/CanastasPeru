import type { SupabaseClient } from "@supabase/supabase-js";
import { soles } from "@/lib/admin/format";

export type DistritoDelivery = { distrito: string; tarifa: number };

/** Distritos con cobertura de "Delivery por distrito" (Catálogo), en su orden. */
export async function distritosDelivery(supabase: SupabaseClient): Promise<DistritoDelivery[]> {
  const { data } = await supabase.from("zonas_delivery").select("distrito,tarifa").eq("activo", true).order("orden").order("distrito");
  return (data ?? []).map((z) => ({ distrito: z.distrito, tarifa: Number(z.tarifa) }));
}

/** Opciones del selector de distrito: el nombre y su tarifa. */
export const opcionesDistrito = (lista: DistritoDelivery[]) => lista.map((z) => ({ valor: z.distrito, texto: `Delivery ${soles(z.tarifa)}` }));
