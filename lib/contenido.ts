import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { cache } from "react";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

/*
 * Contenido editable de la web. Cada sección vive en una fila de la tabla
 * `contenido` (Supabase) y se edita en Panel → Contenido. Estos valores por
 * defecto se usan mientras un campo no se haya editado, o si falta Supabase.
 */

export type Paso = { titulo: string; texto: string };
export type Cifra = { valor: string; texto: string };
export type Horario = { nombre: string; rango: string };
export type MetodoPago = { nombre: string; detalle: string; nota: string };
export type Presupuesto = { etiqueta: string; min: number; max: number };

export type Contenido = {
  marca: { nombre: string; lema: string; logo: string; icono: string };
  anuncios: { mensajes: string[] };
  portada: {
    etiqueta: string;
    titulo: string;
    texto: string;
    botonPrincipal: string;
    botonSecundario: string;
    cifras: Cifra[];
    cinta: string[];
    canastaDestacada: string;
    destacadosEtiqueta: string;
    destacadosTitulo: string;
    pasosEtiqueta: string;
    pasosTitulo: string;
    pasos: Paso[];
    empresasEtiqueta: string;
    empresasTitulo: string;
    empresasTexto: string;
    empresasBoton: string;
  };
  catalogo: { etiqueta: string; titulo: string; texto: string; ctaTitulo: string; ctaTexto: string; ctaBoton: string };
  producto: { beneficios: Paso[] };
  contacto: { ciudad: string; correo: string; telefono: string };
  checkout: { horarios: Horario[]; metodosPago: MetodoPago[]; notaImpuestos: string };
  cotizacion: {
    etiqueta: string;
    titulo: string;
    texto: string;
    pasos: Paso[];
    beneficiosTitulo: string;
    beneficios: string[];
    cantidades: number[];
    presupuestos: Presupuesto[];
    personalizacion: string[];
    /** PDF de cotización comercial. */
    pdfSubtitulo: string;
    pdfFormaPago: string;
    pdfHorarioEntrega: string;
    pdfCondiciones: string[];
  };
  pie: { texto: string; derechos: string };
};

export type SeccionContenido = keyof Contenido;

export const CONTENIDO_POR_DEFECTO: Contenido = {
  marca: {
    nombre: "MKA",
    lema: "Canastas Navideñas & Regalos",
    logo: "/marca/mka-logo.webp",
    icono: "/marca/mka-icono.png",
  },
  anuncios: { mensajes: ["Envíos programados en Lima", "Atención a empresas", "Cotizaciones en 24 h"] },
  portada: {
    etiqueta: "Campaña Navidad 2026",
    titulo: "Regalos que llegan *llenos* de Navidad.",
    texto: "Canastas armadas a mano con productos que sí se disfrutan. Para la familia, el equipo o ese cliente que quieres conservar.",
    botonPrincipal: "Ver catálogo",
    botonSecundario: "Cotizar para empresa",
    cifras: [
      { valor: "+1 200", texto: "canastas entregadas" },
      { valor: "48 h", texto: "entrega en Lima" },
      { valor: "4.9 ★", texto: "valoración promedio" },
    ],
    cinta: ["Panetón", "Champagne", "Chocolates", "Galletas navideñas", "Duraznos", "Canastas de mimbre", "Boxes corporativos", "Tarjeta personalizada"],
    canastaDestacada: "canasta-ejecutiva",
    destacadosEtiqueta: "Destacados",
    destacadosTitulo: "Encuentra la *canasta* ideal",
    pasosEtiqueta: "Cómo funciona",
    pasosTitulo: "Tres pasos, *cero* estrés",
    pasos: [
      { titulo: "Elige tu canasta", texto: "Explora opciones por presupuesto, categoría o tipo de regalo." },
      { titulo: "Personalízala", texto: "Cambia la canasta, indica cantidades, dedicatoria y comprobante." },
      { titulo: "Nosotros la llevamos", texto: "Programa la entrega y recibe confirmación en cada paso." },
    ],
    empresasEtiqueta: "Ventas corporativas",
    empresasTitulo: "¿20, 100 o *500* canastas?",
    empresasTexto: "Precios por volumen, tarjeta con tu logo y entregas coordinadas a cada colaborador.",
    empresasBoton: "Solicitar cotización",
  },
  catalogo: {
    etiqueta: "Catálogo Navidad 2026",
    titulo: "Canastas para *cada* mesa.",
    texto: "Desde la clásica familiar hasta la ejecutiva para tus clientes. Todas se pueden personalizar con otro tipo de canasta al elegirlas.",
    ctaTitulo: "¿No encuentras la *ideal*?",
    ctaTexto: "Armamos canastas a medida desde 20 unidades, con tu logo y tu presupuesto.",
    ctaBoton: "Armar una a medida",
  },
  producto: {
    beneficios: [
      { titulo: "Delivery programado", texto: "Eliges fecha y hora en Lima" },
      { titulo: "Boleta o factura", texto: "Comprobante electrónico" },
      { titulo: "Lista para regalar", texto: "Con lazo y tarjeta" },
    ],
  },
  contacto: { ciudad: "Lima, Perú", correo: "ventas@canastasperu.pe", telefono: "+51 999 999 999" },
  checkout: {
    horarios: [
      { nombre: "Mañana", rango: "9:00 – 13:00" },
      { nombre: "Tarde", rango: "14:00 – 18:00" },
      { nombre: "Noche", rango: "18:00 – 21:00" },
    ],
    metodosPago: [
      { nombre: "Tarjeta", detalle: "Visa, Mastercard, Amex", nota: "Al pagar te llevaremos a la pasarela segura. Aquí no se ingresan datos de tarjeta." },
      { nombre: "Yape / Plin", detalle: "Pago con QR", nota: "Te mostraremos el QR y el monto exacto en el siguiente paso." },
      { nombre: "Transferencia", detalle: "BCP, Interbank, BBVA", nota: "Recibirás los datos bancarios por correo. El pedido se confirma al validar el abono." },
    ],
    notaImpuestos: "Precios incluyen IGV.",
  },
  cotizacion: {
    etiqueta: "Ventas corporativas",
    titulo: "Regalos que *tu equipo* va a recordar.",
    texto: "Canastas navideñas para colaboradores, clientes y aliados, armadas con tu marca y entregadas donde las necesites.",
    pasos: [
      { titulo: "Nos cuentas qué necesitas", texto: "Cantidad, presupuesto, fecha y el estilo de tu marca." },
      { titulo: "Recibes una propuesta", texto: "Opciones de canastas, precios por volumen y muestras." },
      { titulo: "Coordinamos la entrega", texto: "En tu oficina, en varias sedes o en cada domicilio." },
    ],
    beneficiosTitulo: "Todo lo que tu campaña *necesita*",
    beneficios: ["Precios por volumen", "Tarjeta y cinta con tu marca", "Factura electrónica", "Un asesor dedicado", "Entregas en varias sedes", "Canastas sin alcohol"],
    cantidades: [20, 50, 100, 200],
    presupuestos: [
      { etiqueta: "Hasta S/ 100", min: 60, max: 100 },
      { etiqueta: "S/ 100 – 180", min: 100, max: 180 },
      { etiqueta: "S/ 180 – 250", min: 180, max: 250 },
      { etiqueta: "Más de S/ 250", min: 250, max: 0 },
    ],
    personalizacion: ["Tarjeta con tu logo", "Cinta con colores de marca", "Entrega a cada colaborador", "Producto propio de tu empresa"],
    pdfSubtitulo: "Navidad 2026",
    pdfFormaPago: "50 % adelantado, 50 % un día antes de la entrega",
    pdfHorarioEntrega: "Lunes a sábado de 1:00 p. m. a 7:30 p. m.",
    pdfCondiciones: [
      "Forma de pago: 50 % adelantado, 50 % un día antes de la entrega.",
      "Cuenta corriente MN: Banco — N.º de cuenta.",
      "Horario de entrega: lunes a sábado de 1:00 p. m. a 7:30 p. m.",
      "Tiempo de entrega: mínimo de 5 a 7 días hábiles luego de recibida la orden de pedido.",
      "Los productos pueden reemplazarse por otros de igual o mayor valor según disponibilidad.",
    ],
  },
  pie: {
    texto: "Canastas navideñas y regalos corporativos armados a mano, con atención personalizada.",
    derechos: "© 2026 MKA · Canastas Navideñas & Regalos",
  },
};

/** Combina lo guardado con los valores por defecto, campo por campo. */
export function combinarContenido(guardado: Partial<Record<SeccionContenido, Record<string, unknown>>>): Contenido {
  const res = structuredClone(CONTENIDO_POR_DEFECTO) as Record<SeccionContenido, Record<string, unknown>>;
  for (const seccion of Object.keys(res) as SeccionContenido[]) {
    const valor = guardado[seccion];
    if (!valor) continue;
    for (const [campo, v] of Object.entries(valor)) {
      // Solo se aceptan campos conocidos y con el mismo tipo que el valor por defecto.
      const def = res[seccion][campo];
      if (def === undefined || v === null || v === undefined) continue;
      if (Array.isArray(def) ? Array.isArray(v) : typeof def === typeof v) res[seccion][campo] = v;
    }
  }
  return res as unknown as Contenido;
}

/**
 * Limpia lo que llega del panel usando el valor por defecto como plantilla:
 * mismos campos, mismos tipos y textos acotados. Las listas de objetos toman
 * como plantilla su primer elemento por defecto.
 */
export function sanearSeccion<S extends SeccionContenido>(seccion: S, valor: unknown): Contenido[S] {
  const limpiar = (plantilla: unknown, v: unknown): unknown => {
    if (typeof plantilla === "string") return typeof v === "string" ? v.trim().slice(0, 600) : plantilla;
    if (typeof plantilla === "number") {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : plantilla;
    }
    if (Array.isArray(plantilla)) {
      if (!Array.isArray(v)) return plantilla;
      const modelo = plantilla[0];
      return v
        .slice(0, 40)
        .map((x) => limpiar(modelo, x))
        .filter((x) => (typeof x === "string" ? x !== "" : typeof x === "object" ? Object.values(x as object).some((y) => y !== "") : true));
    }
    if (plantilla && typeof plantilla === "object") {
      const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
      return Object.fromEntries(Object.entries(plantilla).map(([k, p]) => [k, limpiar(p, o[k])]));
    }
    return plantilla;
  };
  return limpiar(CONTENIDO_POR_DEFECTO[seccion], valor) as Contenido[S];
}

/** Contenido de la web leído de Supabase en cada visita (con valores por defecto de respaldo). */
export const getContenido = cache(async (): Promise<Contenido> => {
  await connection();
  if (!supabaseConfigurado) return CONTENIDO_POR_DEFECTO;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("contenido").select("clave, valor");
  if (error || !data) {
    console.error("No se pudo leer el contenido de Supabase; se usan los textos por defecto.", error?.message);
    return CONTENIDO_POR_DEFECTO;
  }
  return combinarContenido(Object.fromEntries(data.map((r) => [r.clave, r.valor])));
});
