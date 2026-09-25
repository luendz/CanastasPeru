import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { cache } from "react";
import {
  basketTypes as demoBasketTypes,
  deliveryZones as demoZones,
  products as demoProducts,
  type BasketType,
  type Product,
  type ProductVisualItem,
} from "@/lib/mock-data";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

export type DeliveryZone = { district: string; fee: number };

export type Catalogo = {
  products: Product[];
  basketTypes: BasketType[];
  deliveryZones: DeliveryZone[];
  /** "base" cuando viene de Supabase; "demo" cuando se usa el catálogo del código. */
  fuente: "base" | "demo";
};

type CatalogoWeb = {
  productos: {
    slug: string;
    nombre: string;
    categoria: string;
    precio: number;
    precio_anterior: number | null;
    insignia: string | null;
    emoji: string;
    descripcion: string;
    tipo_canasta_base: string;
    imagen_base: string | null;
    composicion: ProductVisualItem[];
    contenido: string[];
  }[];
  tipos_canasta: { id: string; nombre: string; imagen: string | null; descripcion: string | null; recargo: number }[];
  zonas: { distrito: string; tarifa: number }[];
};

const demo: Catalogo = { products: demoProducts, basketTypes: demoBasketTypes, deliveryZones: demoZones, fuente: "demo" };

/**
 * Catálogo de la tienda (canastas, tipos de canasta y distritos) leído de
 * Supabase en cada visita, para que un cambio de precio se vea al instante.
 * Es la misma fuente que usa la base para cobrar los pedidos.
 */
export const getCatalogo = cache(async (): Promise<Catalogo> => {
  await connection();
  if (!supabaseConfigurado) return demo;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("catalogo_web");
  if (error || !data) {
    console.error("No se pudo leer el catálogo de Supabase; se usa el catálogo de demostración.", error?.message);
    return demo;
  }

  const c = data as CatalogoWeb;
  return {
    fuente: "base",
    products: c.productos.map((p) => ({
      slug: p.slug,
      name: p.nombre,
      category: p.categoria,
      price: Number(p.precio),
      oldPrice: p.precio_anterior == null ? undefined : Number(p.precio_anterior),
      badge: p.insignia ?? undefined,
      emoji: p.emoji,
      baseImage: p.imagen_base ?? undefined,
      baseType: p.tipo_canasta_base,
      description: p.descripcion,
      items: p.contenido,
      visualItems: p.composicion ?? [],
    })),
    basketTypes: c.tipos_canasta.map((t) => ({
      id: t.id,
      label: t.nombre,
      image: t.imagen ?? "",
      hint: t.descripcion ?? "",
      priceDelta: Number(t.recargo),
    })),
    deliveryZones: c.zonas.map((z) => ({ district: z.distrito, fee: Number(z.tarifa) })),
  };
});
