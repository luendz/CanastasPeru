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
export type Marca = { nombre: string; imagen: string };
export type LineaTexto = { titulo: string; texto: string; imagen: string };

export type Contenido = {
  marca: { nombre: string; lema: string; logo: string; icono: string };
  anuncios: { mensajes: string[] };
  portada: {
    heroEtiqueta: string;
    heroTitulo: string;
    heroTexto: string;
    heroImagen: string;
    heroBoton1: string;
    heroBoton2: string;
    heroPuntos: string[];
    /** Canasta que se muestra en el banner mientras no haya imagen. */
    canastaDestacada: string;
    porQueTitulo: string;
    porQue: Paso[];
    tiposEtiqueta: string;
    tiposTitulo: string;
    comprarTitulo: string;
    comprarPasos: Paso[];
    corpEtiqueta: string;
    corpTitulo: string;
    corpTexto: string;
    corpPuntos: string[];
    corpBoton: string;
    corpImagen: string;
    marcasTitulo: string;
    marcasTexto: string;
    marcas: Marca[];
    canalesTitulo: string;
    canalesTexto: string;
    canalesBoton: string;
    canalesWhatsapp: string;
  };
  catalogo: {
    etiqueta: string;
    titulo: string;
    texto: string;
    /** Económicas, Premium, Ejecutivas y Boxes, en ese orden. */
    lineas: LineaTexto[];
    boxesEtiqueta: string;
    boxesTitulo: string;
    boxesTexto: string;
    ctaTitulo: string;
    ctaTexto: string;
    ctaBoton: string;
  };
  producto: { beneficios: Paso[] };
  contacto: { ciudad: string; correo: string; telefono: string; horario: string; instagram: string; facebook: string; tiktok: string };
  checkout: {
    horarios: Horario[];
    metodosPago: MetodoPago[];
    notaImpuestos: string;
    /** Tarjeta navideña que se ofrece en el carrito. */
    tarjetaPrecio: number;
    tarjetaTitulo: string;
    tarjetaTexto: string;
    tarjetaImagen: string;
  };
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
    /** Columna decorativa del formulario. */
    ladoTitulo: string;
    ladoPuntos: string[];
    ladoFrase: string;
    ladoImagen: string;
    notaEntrega: string;
    /** PDF de cotización comercial. */
    pdfSubtitulo: string;
    pdfFormaPago: string;
    pdfHorarioEntrega: string;
    pdfCondiciones: string[];
    pdfCondicionesOrden: string[];
  };
  pie: { texto: string; derechos: string };
  nosotros: { etiqueta: string; titulo: string; texto: string; imagen: string; historia: string; valores: Paso[] };
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
    heroEtiqueta: "Canastas y boxes navideños",
    heroTitulo: "Esta Navidad, *regala momentos.*",
    heroTexto: "Canastas y boxes navideños preparados para celebrar, agradecer y compartir.",
    heroImagen: "",
    heroBoton1: "Ver canastas",
    heroBoton2: "Ver boxes",
    heroPuntos: ["Pedidos individuales y corporativos", "Lima y provincias", "Opciones para todos los presupuestos"],
    canastaDestacada: "canasta-clasica",
    porQueTitulo: "¿Por qué elegir MKA?",
    porQue: [
      { titulo: "Productos seleccionados", texto: "Elegimos cuidadosamente cada producto." },
      { titulo: "Presentación especial", texto: "Cuidamos cada detalle para una experiencia única." },
      { titulo: "Opciones para cada presupuesto", texto: "Económicas, Premium, Ejecutivas y Boxes Navideños." },
      { titulo: "Atención personalizada", texto: "Te ayudamos a encontrar la opción ideal para tu pedido." },
    ],
    tiposEtiqueta: "Encuentra el regalo perfecto",
    tiposTitulo: "¿Qué estás buscando?",
    comprarTitulo: "¿Cómo comprar?",
    comprarPasos: [
      { titulo: "Elige", texto: "Selecciona tu canasta o box." },
      { titulo: "Confirma", texto: "Indícanos la cantidad y los datos de entrega." },
      { titulo: "Realiza tu pago", texto: "Te indicamos los medios de pago disponibles." },
      { titulo: "Recibe", texto: "Coordinamos la entrega de tu pedido." },
    ],
    corpEtiqueta: "Pedidos corporativos",
    corpTitulo: "Navidad para tu *empresa*",
    corpTexto: "Sorprende a tus colaboradores, clientes y socios con canastas y boxes navideños pensados para cada presupuesto.",
    corpPuntos: ["Pedidos por volumen", "Opciones para diferentes presupuestos", "Personalización corporativa", "Entregas coordinadas", "Atención personalizada"],
    corpBoton: "Solicitar cotización",
    corpImagen: "",
    marcasTitulo: "Marcas que forman parte de nuestras canastas",
    marcasTexto: "Trabajamos con marcas reconocidas que garantizan calidad y sabor en cada regalo.",
    marcas: [
      { nombre: "Molitalia", imagen: "" },
      { nombre: "Sayón", imagen: "" },
      { nombre: "Costa", imagen: "" },
      { nombre: "Gloria", imagen: "" },
      { nombre: "Alicorp", imagen: "" },
      { nombre: "Vallealto", imagen: "" },
      { nombre: "Nestlé", imagen: "" },
      { nombre: "Laive", imagen: "" },
    ],
    canalesTitulo: "Haz que esta Navidad sea especial",
    canalesTexto: "Encuentra la canasta o box ideal para regalar.",
    canalesBoton: "Ver catálogo",
    canalesWhatsapp: "Hablar por WhatsApp",
  },
  catalogo: {
    etiqueta: "Catálogo Navidad 2026",
    titulo: "Canastas para *cada* mesa.",
    texto: "Elige la línea que mejor va con tu regalo. Todas se pueden armar con otro tipo de canasta al elegirlas.",
    lineas: [
      { titulo: "Canastas económicas", texto: "Detalles que celebran sin exceder tu presupuesto.", imagen: "" },
      { titulo: "Canastas premium", texto: "Una selección especial para una experiencia más completa.", imagen: "" },
      { titulo: "Canastas ejecutivas", texto: "Elegancia para clientes, colaboradores y socios.", imagen: "" },
      { titulo: "Boxes navideños", texto: "Pequeños detalles, grandes momentos.", imagen: "" },
    ],
    boxesEtiqueta: "Boxes navideños",
    boxesTitulo: "Pequeños detalles, *grandes* momentos.",
    boxesTexto: "Boxes listos para regalar a quien quieras, en casa o en la oficina.",
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
  contacto: {
    ciudad: "Lima, Perú",
    correo: "ventas@canastasperu.pe",
    telefono: "+51 999 999 999",
    horario: "Lunes a sábado de 9:00 a. m. a 7:30 p. m.",
    instagram: "",
    facebook: "",
    tiktok: "",
  },
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
    tarjetaPrecio: 2,
    tarjetaTitulo: "Tarjeta navideña de dedicatoria",
    tarjetaTexto: "Agrega una tarjeta con una dedicatoria personalizada para tu regalo.",
    tarjetaImagen: "",
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
    ladoTitulo: "Regalos corporativos que conectan",
    ladoPuntos: ["Productos de calidad", "Entregas seguras y puntuales", "Presentaciones personalizadas"],
    ladoFrase: "Detalles que fortalecen grandes relaciones",
    ladoImagen: "",
    notaEntrega: "Cada pedido corporativo contempla una sola dirección de entrega.",
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
    pdfCondicionesOrden: [
      "Cuenta corriente MN: Banco — N.º de cuenta.",
      "La entrega se realiza en la dirección, fecha y horario indicados; cualquier cambio se coordina por WhatsApp.",
      "Revisa las canastas al recibirlas: las observaciones se atienden dentro de las 24 horas siguientes.",
    ],
  },
  pie: {
    texto: "Canastas navideñas y regalos corporativos armados a mano, con atención personalizada.",
    derechos: "© 2026 MKA · Canastas Navideñas & Regalos",
  },
  nosotros: {
    etiqueta: "Nosotros",
    titulo: "Regalos que *conectan* personas.",
    texto: "En MKA preparamos canastas y boxes navideños con productos seleccionados, pensados para celebrar, agradecer y compartir.",
    imagen: "",
    historia: "Aquí va la historia de MKA: cómo empezó, qué nos mueve y cómo trabajamos cada pedido. Edita este texto en Panel → Contenido web → Nosotros.",
    valores: [
      { titulo: "Calidad", texto: "Elegimos marcas y productos que sí se disfrutan." },
      { titulo: "Detalle", texto: "Cada canasta se arma y presenta a mano." },
      { titulo: "Cumplimiento", texto: "Entregamos en la fecha y el lugar acordados." },
    ],
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
    if (typeof plantilla === "string") return typeof v === "string" ? v.trim().slice(0, 3000) : plantilla;
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
