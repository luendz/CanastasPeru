/** Como en la tienda: con más de 100 canastas el delivery es gratis. */
export const DELIVERY_GRATIS_DESDE = 100;

/** Delivery que se cobra en una cotización: su tarifa, o 0 si pasa de 100 canastas. */
export const deliveryCotizacion = (tarifa: number | string | null | undefined, unidades: number) =>
  unidades > DELIVERY_GRATIS_DESDE ? 0 : Math.max(0, Number(tarifa ?? 0) || 0);

/** Envío a provincia: solo en cotizaciones (nunca en la compra web). El flete lo paga el cliente a la agencia. */
export const PROVINCIA = "Provincia";
export const esProvincia = (distrito: string | null | undefined) => /^\s*provincia/i.test(distrito ?? "");
export const NOTA_PROVINCIA =
  "El costo de envío a provincia no está incluido en la presente cotización. El cliente deberá asumir el costo del flete y realizar el pago directamente a la agencia de transporte o empresa de envío externa.";
export const NOTA_PROVINCIA_ORDEN =
  "El flete a provincia no está incluido en el importe cotizado: será asumido y pagado directamente por el cliente a la agencia de transporte o empresa de envío externa.";
