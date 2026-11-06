import type { Cotizacion, Orden } from "@/lib/admin/types";

/** Una fila del reporte de clientes (formato "DATOS DE CLIENTES"). */
export type ClienteReporte = {
  nombre: string;
  documento: string;
  direccion: string;
  distrito: string;
  departamento: string;
  correo: string;
  contacto: string;
  telefono: string;
};

const limpio = (s: string | null | undefined) => (s ?? "").trim();
const soloDigitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

/**
 * Clientes del período: los de las órdenes y los de las cotizaciones, sin
 * repetir (mismo DNI/RUC, correo o celular). Si un cliente aparece varias
 * veces, se queda la información más reciente y se completan los datos vacíos.
 */
export function juntarClientes(ordenes: Orden[], cotizaciones: Cotizacion[], distritosLima: Set<string>): ClienteReporte[] {
  const departamento = (distrito: string) => (distritosLima.has(distrito) ? "Lima" : "");
  const filas: (ClienteReporte & { fecha: string })[] = [
    ...ordenes.map((o) => ({
      fecha: o.created_at,
      nombre: limpio(o.comprobante_nombre) || limpio(o.cliente_nombre),
      documento: limpio(o.comprobante_documento),
      direccion: o.comprobante_tipo === "factura" ? limpio(o.direccion_fiscal) || limpio(o.direccion) : limpio(o.direccion),
      distrito: limpio(o.distrito),
      departamento: departamento(limpio(o.distrito)),
      correo: limpio(o.cliente_email).toLowerCase(),
      contacto: limpio(o.cliente_nombre),
      telefono: limpio(o.cliente_telefono),
    })),
    ...cotizaciones.map((c) => ({
      fecha: c.created_at,
      nombre: limpio(c.empresa),
      documento: limpio(c.ruc),
      direccion: limpio(c.lugar_entrega),
      distrito: limpio(c.distrito),
      departamento: departamento(limpio(c.distrito)),
      correo: limpio(c.email).toLowerCase(),
      contacto: limpio(c.contacto),
      telefono: limpio(c.telefono),
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const clientes: ClienteReporte[] = [];
  const indice = new Map<string, ClienteReporte>();
  for (const { fecha: _fecha, ...f } of filas) {
    const claves = [soloDigitos(f.documento) && `doc:${soloDigitos(f.documento)}`, f.correo && `mail:${f.correo}`, soloDigitos(f.telefono).slice(-9).length >= 7 && `tel:${soloDigitos(f.telefono).slice(-9)}`].filter(Boolean) as string[];
    const existente = claves.map((k) => indice.get(k)).find(Boolean);
    if (existente) {
      // Ya está (con datos más recientes): solo se completan los campos vacíos.
      (Object.keys(f) as (keyof ClienteReporte)[]).forEach((k) => { if (!existente[k] && f[k]) existente[k] = f[k]; });
      claves.forEach((k) => indice.set(k, existente));
      continue;
    }
    clientes.push(f);
    claves.forEach((k) => indice.set(k, f));
  }
  return clientes.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
