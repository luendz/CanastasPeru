/** Como en la tienda: con más de 100 canastas el delivery es gratis. */
export const DELIVERY_GRATIS_DESDE = 100;

/** Delivery que se cobra en una cotización: su tarifa, o 0 si pasa de 100 canastas. */
export const deliveryCotizacion = (tarifa: number | string | null | undefined, unidades: number) =>
  unidades > DELIVERY_GRATIS_DESDE ? 0 : Math.max(0, Number(tarifa ?? 0) || 0);
