"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { urlPublicaMedio } from "@/lib/medios";

export type FormState = { ok?: boolean; error?: string };

const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
const num = (fd: FormData, k: string) => {
  const raw = String(fd.get(k) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};
const entero = (fd: FormData, k: string) => Math.round(Number(fd.get(k) ?? 0)) || 0;

/** Solo imágenes de la propia web (/carpeta/archivo) o de la biblioteca del panel. */
const imagen = (fd: FormData, k: string) => {
  const v = txt(fd, k, 400);
  if (!v) return null;
  if ((v.startsWith("/") && !v.startsWith("//")) || v.startsWith(urlPublicaMedio(""))) return v;
  throw new Error("La imagen debe elegirse de la biblioteca");
};

const refrescar = (id?: string) => {
  revalidatePath("/admin/catalogo");
  if (id) revalidatePath(`/admin/catalogo/${id}`);
  revalidatePath("/admin/costeo");
};

/** Valida los campos comunes de una canasta. Devuelve el objeto a guardar o un error. */
function datosCanasta(fd: FormData) {
  const nombre = txt(fd, "nombre", 120);
  const categoria = txt(fd, "categoria", 60);
  const precio = num(fd, "precio");
  const precioAnterior = num(fd, "precio_anterior");
  const tipo = txt(fd, "tipo_canasta_base", 40);

  if (!nombre) return { error: "Falta el nombre." };
  if (!categoria) return { error: "Falta la categoría." };
  if (precio === null || Number.isNaN(precio) || precio <= 0) return { error: "El precio debe ser mayor que cero." };
  if (Number.isNaN(precioAnterior)) return { error: "El precio anterior no es válido." };
  if (precioAnterior !== null && precioAnterior <= precio) return { error: "El precio tachado debe ser mayor que el precio actual (o déjalo vacío)." };
  if (!tipo) return { error: "Elige el tipo de canasta." };

  return {
    datos: {
      nombre,
      categoria,
      precio,
      precio_anterior: precioAnterior,
      insignia: txt(fd, "insignia", 40) || null,
      descripcion: txt(fd, "descripcion", 400),
      emoji: txt(fd, "emoji", 8) || "🧺",
      tipo_canasta_base: tipo,
      orden: entero(fd, "orden"),
      activo: fd.get("activo") === "on",
    },
  };
}

export async function guardarCanasta(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = txt(fd, "id", 40);
  const r = datosCanasta(fd);
  if ("error" in r) return { error: r.error };

  const { error } = await supabase.from("productos").update(r.datos).eq("id", id);
  if (error) return { error: error.message };
  refrescar(id);
  return { ok: true };
}

export async function crearCanasta(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const r = datosCanasta(fd);
  if ("error" in r) return { error: r.error };

  const slug = txt(fd, "slug", 60)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) return { error: "Falta la dirección web (slug)." };

  // Las canastas nuevas nacen ocultas hasta que tengan receta y composición.
  const { data, error } = await supabase
    .from("productos")
    .insert({ ...r.datos, slug, activo: false })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "Ya existe una canasta con esa dirección web." : error.message };

  refrescar();
  redirect(`/admin/catalogo/${data.id}`);
}

export async function alternarCanasta(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = txt(fd, "id", 40);
  const { error } = await supabase.from("productos").update({ activo: fd.get("activo") === "true" }).eq("id", id);
  if (error) throw new Error(error.message);
  refrescar(id);
}

export async function guardarTipo(fd: FormData) {
  const { supabase } = await requireAdmin();
  const recargo = num(fd, "recargo");
  if (recargo === null || Number.isNaN(recargo) || recargo < 0) throw new Error("El recargo no es válido");
  const nombre = txt(fd, "nombre", 80);
  if (!nombre) throw new Error("Falta el nombre");

  const { error } = await supabase
    .from("tipos_canasta")
    .update({
      nombre,
      recargo,
      descripcion: txt(fd, "descripcion", 120) || null,
      imagen: imagen(fd, "imagen"),
      orden: entero(fd, "orden"),
    })
    .eq("id", txt(fd, "id", 40));
  if (error) throw new Error(error.message);
  refrescar();
}

export async function guardarZona(fd: FormData) {
  const { supabase } = await requireAdmin();
  const tarifa = num(fd, "tarifa");
  if (tarifa === null || Number.isNaN(tarifa) || tarifa < 0) throw new Error("La tarifa no es válida");

  const { error } = await supabase
    .from("zonas_delivery")
    .update({ tarifa, activo: fd.get("activo") === "on", orden: entero(fd, "orden") })
    .eq("distrito", txt(fd, "distrito", 80));
  if (error) throw new Error(error.message);
  refrescar();
}

export async function crearZona(fd: FormData) {
  const { supabase } = await requireAdmin();
  const distrito = txt(fd, "distrito", 80);
  const tarifa = num(fd, "tarifa");
  if (!distrito) throw new Error("Falta el distrito");
  if (tarifa === null || Number.isNaN(tarifa) || tarifa < 0) throw new Error("La tarifa no es válida");

  const { error } = await supabase.from("zonas_delivery").insert({ distrito, tarifa, orden: entero(fd, "orden") || 99 });
  if (error) throw new Error(error.code === "23505" ? "Ese distrito ya existe" : error.message);
  refrescar();
}

/** Foto y emoji de un insumo: es lo que se ve en la composición de todas las canastas que lo llevan. */
export async function guardarInsumoVisual(fd: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("insumos")
    .update({ imagen: imagen(fd, "imagen"), emoji: txt(fd, "emoji", 8) || "📦" })
    .eq("id", txt(fd, "id", 40));
  if (error) throw new Error(error.message);
  refrescar();
  revalidatePath("/", "layout");
}
