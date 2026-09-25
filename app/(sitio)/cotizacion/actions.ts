"use server";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CotizacionState = { enviada?: boolean; numero?: string; error?: string };

const campo = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Registra la solicitud del formulario de empresas como cotización pendiente. */
export async function solicitarCotizacion(_prev: CotizacionState, fd: FormData): Promise<CotizacionState> {
  if (!campo(fd, "empresa") || !campo(fd, "contacto")) return { error: "Completa el nombre de la empresa y del contacto." };
  if (!campo(fd, "email") && !campo(fd, "telefono")) return { error: "Déjanos un correo o un celular para enviarte la propuesta." };

  // Sin Supabase configurado, el formulario funciona como demostración.
  if (!supabaseConfigurado) return { enviada: true };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_cotizacion_web", {
    p: {
      empresa: campo(fd, "empresa"),
      ruc: campo(fd, "ruc"),
      contacto: campo(fd, "contacto"),
      cargo: campo(fd, "cargo"),
      email: campo(fd, "email"),
      telefono: campo(fd, "telefono"),
      cantidad_estimada: campo(fd, "cantidad_estimada"),
      presupuesto: campo(fd, "presupuesto"),
      fecha_requerida: campo(fd, "fecha_requerida"),
      lugar_entrega: campo(fd, "lugar_entrega"),
      canastas_base: fd.getAll("canastas_base").map(String),
      personalizacion: fd.getAll("personalizacion").map(String),
      requerimientos: campo(fd, "requerimientos"),
    },
  });
  if (error || !data) return { error: "No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos." };

  return { enviada: true, numero: (data as { numero: string }).numero };
}
