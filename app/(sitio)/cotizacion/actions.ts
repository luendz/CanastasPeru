"use server";

import { esFechaReparto } from "@/lib/entrega";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CotizacionState = { enviada?: boolean; numero?: string; error?: string };

const campo = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Registra la solicitud del formulario de empresas como cotización pendiente. */
export async function solicitarCotizacion(_prev: CotizacionState, fd: FormData): Promise<CotizacionState> {
  if (!campo(fd, "empresa") || !campo(fd, "contacto")) return { error: "Completa la empresa / razón social y el nombre de contacto." };
  const ruc = campo(fd, "ruc").replace(/\D/g, "");
  if (ruc && ruc.length !== 11) return { error: "El RUC debe tener 11 dígitos." };
  if (!campo(fd, "email") && !campo(fd, "telefono")) return { error: "Déjanos un correo o un celular para enviarte la propuesta." };
  if (!esFechaReparto(campo(fd, "fecha_requerida"))) return { error: "Elige una fecha de reparto: martes, jueves o sábado, con al menos 5 días de anticipación." };

  // Sin Supabase configurado, el formulario funciona como demostración.
  if (!supabaseConfigurado) return { enviada: true };

  const direccion = [campo(fd, "direccion"), campo(fd, "referencia") && `Ref.: ${campo(fd, "referencia")}`].filter(Boolean).join(" · ");
  const requerimientos = [campo(fd, "requerimientos"), campo(fd, "adicional") && `Información adicional: ${campo(fd, "adicional")}`].filter(Boolean).join("\n\n");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_cotizacion_web", {
    p: {
      empresa: campo(fd, "empresa"),
      ruc,
      contacto: campo(fd, "contacto"),
      cargo: campo(fd, "cargo"),
      email: campo(fd, "email"),
      telefono: campo(fd, "telefono"),
      cantidad_estimada: campo(fd, "cantidad_estimada"),
      presupuesto: campo(fd, "presupuesto"),
      fecha_requerida: campo(fd, "fecha_requerida"),
      lugar_entrega: direccion,
      distrito: campo(fd, "distrito"),
      canastas_base: fd.getAll("canastas_base").map(String),
      personalizacion: fd.getAll("personalizacion").map(String),
      requerimientos,
    },
  });
  if (error || !data) return { error: "No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos." };

  return { enviada: true, numero: (data as { numero: string }).numero };
}
