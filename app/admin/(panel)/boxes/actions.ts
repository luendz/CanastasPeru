"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermiso } from "@/lib/admin/auth";
import { puede } from "@/lib/admin/permisos";
import { urlPublicaMedio } from "@/lib/medios";

/*
 * Boxes navideños: se guardan en la tabla de canastas con la categoría
 * "Box Navideño" y el envase interno "box", así el carrito, el checkout y
 * las órdenes los tratan igual que a una canasta.
 */
const CATEGORIA_BOX = "Box Navideño";
const ENVASE_BOX = "box";

export type BoxState = { ok?: boolean; error?: string };

const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

const slugDe = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function refrescar(id?: string) {
  revalidatePath("/admin/boxes");
  if (id) revalidatePath(`/admin/boxes/${id}`);
  revalidatePath("/boxes");
  revalidatePath("/");
}

function leer(fd: FormData) {
  const nombre = txt(fd, "nombre", 120);
  if (!nombre) return { error: "Escribe el nombre del box." } as const;
  const precio = Number(txt(fd, "precio", 20).replace(",", "."));
  if (!Number.isFinite(precio) || precio <= 0) return { error: "Escribe un precio válido." } as const;
  const imagen = txt(fd, "imagen", 400);
  if (imagen && !((imagen.startsWith("/") && !imagen.startsWith("//")) || imagen.startsWith(urlPublicaMedio("")))) {
    return { error: "La imagen debe elegirse de la biblioteca." } as const;
  }
  // Una línea por producto, en el orden en que se escribieron.
  const incluye = fd.getAll("incluye").map((v) => String(v).trim().slice(0, 160)).filter(Boolean).slice(0, 40);
  return {
    datos: {
      nombre,
      precio: Math.round(precio * 100) / 100,
      imagen: imagen || null,
      descripcion: txt(fd, "descripcion", 300),
      incluye,
      activo: fd.get("activo") === "on",
    },
  } as const;
}

export async function guardarBox(_prev: BoxState, fd: FormData): Promise<BoxState> {
  let ctx;
  try { ctx = await requirePermiso("boxes.editar"); } catch (e) { return { error: e instanceof Error ? e.message : "Sin permiso." }; }
  const { supabase } = ctx;
  const r = leer(fd);
  if ("error" in r) return { error: r.error };
  const id = txt(fd, "id", 40);
  // Sin el permiso de visibilidad no se cambia si se ve en la web (uno nuevo nace oculto).
  const { activo, ...resto } = r.datos;
  const datos = puede(ctx.permisos, "boxes.visibilidad") ? { ...resto, activo } : id ? resto : { ...resto, activo: false };

  if (id) {
    const { error } = await supabase.from("canastas").update(datos).eq("id", id).eq("envase_base_id", ENVASE_BOX);
    if (error) return { error: error.message };
    // El precio de venta sale del envase del box.
    const { error: e2 } = await supabase.from("canasta_envases").update({ precio: r.datos.precio }).eq("canasta_id", id).eq("envase_id", ENVASE_BOX);
    if (e2) return { error: e2.message };
    refrescar(id);
    return { ok: true };
  }

  const base = slugDe(r.datos.nombre) || "box";
  const { data: usados } = await supabase.from("canastas").select("slug").like("slug", `${base}%`);
  const tomados = new Set((usados ?? []).map((u) => u.slug as string));
  let slug = base;
  for (let n = 2; tomados.has(slug); n++) slug = `${base}-${n}`;

  const { data: ultimo } = await supabase.from("canastas").select("orden").eq("envase_base_id", ENVASE_BOX).order("orden", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("canastas")
    .insert({ ...datos, slug, categoria: CATEGORIA_BOX, envase_base_id: ENVASE_BOX, emoji: "🎁", orden: Math.max(1000, (ultimo?.orden ?? 999) + 1) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const { error: e2 } = await supabase.from("canasta_envases").insert({ canasta_id: data.id, envase_id: ENVASE_BOX, precio: r.datos.precio });
  if (e2) return { error: e2.message };

  refrescar();
  redirect(`/admin/boxes?creado=${encodeURIComponent(r.datos.nombre)}`);
}

/** Muestra u oculta el box en la web. */
export async function alternarBox(fd: FormData) {
  const { supabase } = await requirePermiso("boxes.visibilidad");
  const id = txt(fd, "id", 40);
  const { error } = await supabase.from("canastas").update({ activo: fd.get("activo") === "true" }).eq("id", id).eq("envase_base_id", ENVASE_BOX);
  if (error) throw new Error(error.message);
  refrescar(id);
}

/** Sube o baja el box en la lista (el orden es el de la web). */
export async function moverBox(fd: FormData) {
  const { supabase } = await requirePermiso("boxes.editar");
  const id = txt(fd, "id", 40);
  const delta = fd.get("dir") === "arriba" ? -1 : 1;
  const { data } = await supabase.from("canastas").select("id,orden").eq("envase_base_id", ENVASE_BOX).order("orden").order("created_at");
  const lista = (data ?? []) as { id: string; orden: number }[];
  const i = lista.findIndex((b) => b.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  await Promise.all(lista.map((b, n) => supabase.from("canastas").update({ orden: 1000 + n }).eq("id", b.id)));
  refrescar();
}

export async function eliminarBox(fd: FormData) {
  const { supabase } = await requirePermiso("boxes.editar");
  const id = txt(fd, "id", 40);
  const { error } = await supabase.from("canastas").delete().eq("id", id).eq("envase_base_id", ENVASE_BOX);
  if (error) throw new Error(error.message);
  refrescar();
  if (fd.get("volver")) redirect("/admin/boxes");
}
