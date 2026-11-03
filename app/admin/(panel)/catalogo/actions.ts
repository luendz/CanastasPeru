"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { moverProducto } from "@/lib/admin/recetas";
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

/**
 * Valida los campos comunes de una canasta. Devuelve el objeto a guardar o un
 * error. El precio es el de su envase principal.
 */
function datosCanasta(fd: FormData, precio: number | null) {
  const nombre = txt(fd, "nombre", 120);
  const categoria = txt(fd, "categoria", 60);
  const precioAnterior = num(fd, "precio_anterior");
  const tipo = txt(fd, "envase_base_id", 40);

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
      insignia: txt(fd, "insignia", 120) || null,
      descripcion: txt(fd, "descripcion", 400),
      descripcion_completa: txt(fd, "descripcion_completa", 2000),
      emoji: txt(fd, "emoji", 8) || "🧺",
      envase_base_id: tipo,
      orden: entero(fd, "orden"),
      activo: fd.get("activo") === "on",
    },
  };
}

export async function guardarCanasta(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = txt(fd, "id", 40);
  // El envase principal define el precio de la canasta y siempre está visible.
  const { data: envase } = await supabase.from("canasta_envases").select("precio").eq("canasta_id", id).eq("envase_id", txt(fd, "envase_base_id", 40)).maybeSingle();
  if (!envase) return { error: "Ese envase no está en la canasta. Agrégalo en Contenido y envases." };
  const r = datosCanasta(fd, Number(envase.precio));
  if ("error" in r) return { error: r.error };

  const { error } = await supabase.from("canastas").update(r.datos).eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("canasta_envases").update({ visible: true }).eq("canasta_id", id).eq("envase_id", r.datos.envase_base_id);
  refrescar(id);
  return { ok: true };
}

export async function crearCanasta(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const r = datosCanasta(fd, num(fd, "precio"));
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
    .from("canastas")
    .insert({ ...r.datos, slug, activo: false })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "Ya existe una canasta con esa dirección web." : error.message };

  const { error: errorEnvase } = await supabase.from("canasta_envases").insert({ canasta_id: data.id, envase_id: r.datos.envase_base_id, precio: r.datos.precio });
  if (errorEnvase) return { error: errorEnvase.message };

  refrescar();
  redirect(`/admin/catalogo/${data.id}`);
}

export async function alternarCanasta(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = txt(fd, "id", 40);
  const { error } = await supabase.from("canastas").update({ activo: fd.get("activo") === "true" }).eq("id", id);
  if (error) throw new Error(error.message);
  refrescar(id);
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

const precioValido = (precio: number) => Number.isFinite(precio) && precio > 0;

type DatosEnvase = { nombre: string; descripcion: string; insumoId: string | null };

/**
 * Guarda un envase de la canasta: su precio y costo manual (usado si su producto
 * no tiene costo) son de esta canasta; nombre, descripción y producto, de todas.
 */
export async function guardarEnvase(productoId: string, tipo: string, precio: number, costoManual: number | null, datos: DatosEnvase): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!precioValido(precio)) return { error: "El precio debe ser mayor que cero." };
  if (costoManual !== null && !(Number.isFinite(costoManual) && costoManual >= 0)) return { error: "El costo no es válido." };
  const nombre = datos.nombre.trim().slice(0, 80);
  if (!nombre) return { error: "Falta el nombre del envase." };

  const { error: errorDatos } = await supabase
    .from("envases")
    .update({ nombre, descripcion: datos.descripcion.trim().slice(0, 120) || null, articulo_id: datos.insumoId })
    .eq("id", tipo);
  if (errorDatos) return { error: errorDatos.message };

  const { error } = await supabase
    .from("canasta_envases")
    .update({ precio: Math.round(precio * 100) / 100, costo_manual: costoManual === null ? null : Math.round(costoManual * 100) / 100 })
    .eq("canasta_id", productoId)
    .eq("envase_id", tipo);
  if (error) return { error: error.message };

  // El precio de la canasta en el catálogo es el de su envase principal.
  const { data: producto } = await supabase.from("canastas").select("envase_base_id").eq("id", productoId).maybeSingle();
  if (producto?.envase_base_id === tipo) {
    const { error: errorPrecio } = await supabase.from("canastas").update({ precio: Math.round(precio * 100) / 100 }).eq("id", productoId);
    if (errorPrecio) return { error: errorPrecio.message };
  }
  refrescar(productoId);
  return { ok: true };
}

/** Muestra u oculta un envase en la tienda. El principal siempre se muestra. */
export async function alternarEnvase(productoId: string, tipo: string, visible: boolean): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: producto } = await supabase.from("canastas").select("envase_base_id").eq("id", productoId).maybeSingle();
  if (producto?.envase_base_id === tipo && !visible) return { error: "El envase principal siempre se muestra. Marca otro como principal." };

  const { error } = await supabase.from("canasta_envases").update({ visible }).eq("canasta_id", productoId).eq("envase_id", tipo);
  if (error) return { error: error.message };
  refrescar(productoId);
  return { ok: true };
}

/** Cambia la posición de un envase en la canasta (es el orden en que los ve el cliente) y reacomoda los demás. */
export async function moverEnvase(productoId: string, tipo: string, posicion: number): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("canasta_envases").select("envase_id,orden").eq("canasta_id", productoId).order("orden").order("envase_id");
  if (error) return { error: error.message };
  const filas = (data ?? []) as { envase_id: string; orden: number }[];
  const desde = filas.findIndex((f) => f.envase_id === tipo);
  if (desde < 0 || !Number.isFinite(posicion)) return { error: "Ese envase no está en la canasta." };

  const cambios = await Promise.all(
    moverProducto(filas, desde, Math.round(posicion)).flatMap((f, i) =>
      f.orden === i + 1 ? [] : [supabase.from("canasta_envases").update({ orden: i + 1 }).eq("canasta_id", productoId).eq("envase_id", f.envase_id)],
    ),
  );
  const fallo = cambios.find((c) => c.error);
  if (fallo?.error) return { error: fallo.error.message };
  refrescar(productoId);
  return { ok: true };
}

/** Cambia la foto de un envase. Es del envase, así que se ve en todas las canastas que lo usan. */
export async function guardarImagenEnvase(productoId: string, tipo: string, url: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const fd = new FormData();
  fd.set("imagen", url);
  let foto: string | null;
  try {
    foto = imagen(fd, "imagen");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "La imagen no es válida." };
  }
  if (!foto) return { error: "Elige una imagen." };

  const { error } = await supabase.from("envases").update({ imagen: foto }).eq("id", tipo);
  if (error) return { error: error.message };
  refrescar(productoId);
  return { ok: true };
}

export async function quitarEnvase(productoId: string, tipo: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: producto } = await supabase.from("canastas").select("envase_base_id").eq("id", productoId).maybeSingle();
  if (producto?.envase_base_id === tipo) return { error: "No se puede quitar el envase principal. Marca otro como principal." };

  const { error } = await supabase.from("canasta_envases").delete().eq("canasta_id", productoId).eq("envase_id", tipo);
  if (error) return { error: error.message };
  refrescar(productoId);
  return { ok: true };
}

/** Hace principal un envase de la canasta, como en Datos generales: la canasta toma su precio y el envase queda visible. */
export async function hacerPrincipal(productoId: string, tipo: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: envase } = await supabase.from("canasta_envases").select("precio").eq("canasta_id", productoId).eq("envase_id", tipo).maybeSingle();
  if (!envase) return { error: "Ese envase ya no está en la canasta. Recarga la página." };

  const { error, count } = await supabase.from("canastas").update({ envase_base_id: tipo, precio: Number(envase.precio) }, { count: "exact" }).eq("id", productoId);
  if (error) return { error: error.message };
  if (!count) return { error: "No se encontró la canasta." };
  await supabase.from("canasta_envases").update({ visible: true }).eq("canasta_id", productoId).eq("envase_id", tipo);
  refrescar(productoId);
  return { ok: true };
}

/** Tipo de canasta de un empaque del listado de productos; si aún no tiene, se crea con su nombre y su foto. */
async function tipoDeInsumo(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], insumoId: string) {
  const { data: existente } = await supabase.from("envases").select("id").eq("articulo_id", insumoId).maybeSingle();
  if (existente) return existente.id as string;

  const { data: insumo } = await supabase.from("articulos").select("nombre,imagen").eq("id", insumoId).eq("tipo", "envase").maybeSingle();
  if (!insumo?.imagen) throw new Error("El envase necesita una foto en Artículos.");

  const { data: tipos } = await supabase.from("envases").select("id,orden");
  const lista = (tipos ?? []) as { id: string; orden: number }[];
  const base = insumo.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let id = base;
  for (let n = 2; lista.some((t) => t.id === id); n++) id = `${base}-${n}`;

  const { error } = await supabase.from("envases").insert({ id, nombre: insumo.nombre, imagen: insumo.imagen, articulo_id: insumoId, orden: Math.max(0, ...lista.map((t) => t.orden)) + 1 });
  if (error) throw new Error(error.message);
  return id;
}

/** Agrega un envase a la canasta. `opcion` es "tipo:<id>" o "insumo:<id>" (un producto del listado). */
export async function agregarEnvase(productoId: string, opcion: string, precio: number): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!precioValido(precio)) return { error: "El precio debe ser mayor que cero." };

  let tipo = opcion.startsWith("tipo:") ? opcion.slice(5) : "";
  if (opcion.startsWith("insumo:")) {
    try {
      tipo = await tipoDeInsumo(supabase, opcion.slice(7));
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo crear el envase." };
    }
  }
  if (!tipo) return { error: "Elige un envase." };

  const { data: actuales } = await supabase.from("canasta_envases").select("orden").eq("canasta_id", productoId);
  const orden = Math.max(0, ...((actuales ?? []) as { orden: number }[]).map((e) => e.orden)) + 1;
  const { error } = await supabase.from("canasta_envases").insert({ canasta_id: productoId, envase_id: tipo, precio: Math.round(precio * 100) / 100, orden });
  if (error) return { error: error.code === "23505" ? "Ese envase ya está en la canasta." : error.message };
  refrescar(productoId);
  revalidatePath("/admin/catalogo");
  return { ok: true };
}

/** Agrega a otras canastas un envase que ya existe. Cada una lleva su propio precio y queda al final de su lista. */
export async function usarEnvaseEnCanastas(origenId: string, tipo: string, destinos: { productoId: string; precio: number }[]): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!tipo || destinos.length === 0) return { error: "Elige al menos una canasta." };
  if (destinos.some((d) => !precioValido(d.precio))) return { error: "Cada canasta necesita un precio mayor que cero." };

  const { data: actuales, error: errorActuales } = await supabase.from("canasta_envases").select("canasta_id,orden").in("canasta_id", destinos.map((d) => d.productoId));
  if (errorActuales) return { error: errorActuales.message };
  const filas = (actuales ?? []) as { canasta_id: string; orden: number }[];

  const { error } = await supabase.from("canasta_envases").insert(destinos.map((d) => ({
    canasta_id: d.productoId,
    envase_id: tipo,
    precio: Math.round(d.precio * 100) / 100,
    orden: Math.max(0, ...filas.filter((f) => f.canasta_id === d.productoId).map((f) => f.orden)) + 1,
  })));
  if (error) return { error: error.code === "23505" ? "Ese envase ya está en alguna de las canastas. Recarga la página." : error.message };

  refrescar(origenId);
  destinos.forEach((d) => refrescar(d.productoId));
  revalidatePath("/admin/catalogo");
  return { ok: true };
}
