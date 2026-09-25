"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { ESTADOS_ORDEN } from "@/lib/admin/types";

export async function actualizarOrden(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const estadoPago = String(formData.get("estado_pago") ?? "");
  const notas = String(formData.get("notas") ?? "").slice(0, 2000);

  if (!ESTADOS_ORDEN.some((e) => e.id === estado)) throw new Error("Estado inválido");
  if (estadoPago !== "pendiente" && estadoPago !== "pagado") throw new Error("Estado de pago inválido");

  const { error } = await supabase.from("ordenes").update({ estado, estado_pago: estadoPago, notas: notas || null }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/ordenes");
  revalidatePath(`/admin/ordenes/${id}`);
  revalidatePath("/admin");
}
