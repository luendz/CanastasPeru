import type { SupabaseClient } from "@supabase/supabase-js";
import { PROVINCIA, esProvincia } from "@/lib/admin/delivery";
import { soles } from "@/lib/admin/format";

export type DistritoDelivery = { distrito: string; tarifa: number };

/** Distritos con cobertura de "Delivery por distrito" (Catálogo), en su orden, y al final «Provincia» (solo cotizaciones). */
export async function distritosDelivery(supabase: SupabaseClient): Promise<DistritoDelivery[]> {
  const { data } = await supabase.from("zonas_delivery").select("distrito,tarifa").eq("activo", true).order("orden").order("distrito");
  const lista = (data ?? []).filter((z) => !esProvincia(z.distrito)).map((z) => ({ distrito: z.distrito, tarifa: Number(z.tarifa) }));
  return [...lista, { distrito: PROVINCIA, tarifa: 0 }];
}

/** Opciones del selector de distrito: el nombre y su tarifa. */
export const opcionesDistrito = (lista: DistritoDelivery[]) => lista.map((z) => ({ valor: z.distrito, texto: esProvincia(z.distrito) ? "Flete a cargo del cliente" : `Delivery ${soles(z.tarifa)}` }));
