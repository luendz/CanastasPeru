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
/** pasarela: "mercadopago" lleva al cliente a pagar en línea; vacío es un pago manual. */
/** pasarela: "" manual, "qr" manual con QR (Yape / Plin), "mercadopago" en línea. */
export type MetodoPago = { nombre: string; detalle: string; nota: string; pasarela: string };
export type Presupuesto = { etiqueta: string; min: number; max: number };
export type Marca = { nombre: string; imagen: string };
export type LineaTexto = { titulo: string; texto: string; imagen: string };

export type Contenido = {
  marca: { nombre: string; lema: string; logo: string; logoBlanco: string; icono: string };
  anuncios: { mensajes: string[]; franja: string };
  portada: {
    heroEtiqueta: string;
    heroTitulo: string;
    heroTexto: string;
    heroImagen: string;
    /** Más imágenes del banner: pasan solas y con puntos. */
    heroFondos: { imagen: string }[];
    heroBoton1: string;
    heroBoton2: string;
    heroPuntos: string[];
    /** Canasta que se muestra en el banner mientras no haya imagen. */
    canastaDestacada: string;
    porQueTitulo: string;
    porQue: Paso[];
    tiposEtiqueta: string;
    tiposTitulo: string;
    favoritosTitulo: string;
    favoritosTexto: string;
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
    canalesImagen: string;
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
    /** Pago con QR (métodos con Cobro «Manual con QR»): imagen del QR y nota importante. */
    qrImagen: string;
    qrNota: string;
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
  pie: {
    texto: string;
    derechos: string;
    suscribirTitulo: string;
    faq: Paso[];
    terminos: string;
    privacidad: string;
  };
  nosotros: { etiqueta: string; titulo: string; texto: string; imagen: string; historia: string; lema: string; valores: Paso[] };
};

export type SeccionContenido = keyof Contenido;

export const CONTENIDO_POR_DEFECTO: Contenido = {
  marca: {
    nombre: "MKA",
    lema: "Canastas Navideñas & Regalos",
    logo: "/marca/mka-logo-color.webp",
    logoBlanco: "/marca/mka-logo-blanco.webp",
    icono: "/marca/mka-icono-2026.png",
  },
  anuncios: { mensajes: ["Envíos programados en Lima", "Atención a empresas", "Cotizaciones en 24 h"], franja: "🎁 Delivery gratis en pedidos mayores a 100 unidades" },
  portada: {
    heroEtiqueta: "Canastas y boxes navideños",
    heroTitulo: "Esta Navidad, *regala momentos.*",
    heroTexto: "Canastas y boxes navideños preparados para celebrar, agradecer y compartir.",
    heroImagen: "/imgs_general/banner-1-v2.webp",
    heroFondos: [{ imagen: "" }],
    heroBoton1: "Ver canastas",
    heroBoton2: "Ver boxes",
    heroPuntos: ["Pedidos individuales y corporativos", "Lima y provincias", "Opciones para todos los presupuestos"],
    canastaDestacada: "canasta-economica-1",
    porQueTitulo: "¿Por qué elegir MKA?",
    porQue: [
      { titulo: "Productos seleccionados", texto: "Elegimos cuidadosamente cada producto." },
      { titulo: "Presentación especial", texto: "Cuidamos cada detalle para una experiencia única." },
      { titulo: "Opciones para cada presupuesto", texto: "Canastas económicas, premium y ejecutivas." },
      { titulo: "Atención personalizada", texto: "Te ayudamos a encontrar la opción ideal para tu pedido." },
    ],
    tiposEtiqueta: "Encuentra el regalo perfecto",
    tiposTitulo: "¿Qué estás buscando?",
    favoritosTitulo: "Nuestros favoritos",
    favoritosTexto: "Una selección de nuestras mejores opciones.",
    comprarTitulo: "Compra en 4 simples pasos",
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
    corpImagen: "/imgs_general/banner-3-v2.webp",
    marcasTitulo: "Marcas que forman parte de nuestras canastas",
    marcasTexto: "Trabajamos con marcas reconocidas que garantizan calidad y sabor en cada regalo.",
    marcas: [
      { nombre: "Molitalia", imagen: "/imgs_general/marcas/logo-molitalia.webp" },
      { nombre: "Sayón", imagen: "/imgs_general/marcas/logo-sayon.webp" },
      { nombre: "Costa", imagen: "/imgs_general/marcas/logo-costa.webp" },
      { nombre: "Gloria", imagen: "/imgs_general/marcas/logo-gloria.webp" },
      { nombre: "Alicorp", imagen: "/imgs_general/marcas/logo-alicorp.webp" },
      { nombre: "Nestlé", imagen: "/imgs_general/marcas/logo-nestle.webp" },
      { nombre: "Laive", imagen: "/imgs_general/marcas/logo-laive.webp" },
      { nombre: "Winter's", imagen: "/imgs_general/marcas/logo-winters.webp" },
      { nombre: "Primor", imagen: "/imgs_general/marcas/logo-primor.webp" },
      { nombre: "Sol del Cusco", imagen: "/imgs_general/marcas/logo-sol-del-cusco.webp" },
      { nombre: "Costeño", imagen: "/imgs_general/marcas/logo-costeno.webp" },
      { nombre: "Santis", imagen: "/imgs_general/marcas/logo-santis.webp" },
      { nombre: "Valle Norte", imagen: "/imgs_general/marcas/logo-valle-norte.webp" },
      { nombre: "Bimbo", imagen: "/imgs_general/marcas/logo-bimbo.webp" },
      { nombre: "Dulfina", imagen: "/imgs_general/marcas/logo-dulfina.webp" },
      { nombre: "Queirolo", imagen: "/imgs_general/marcas/logo-queirolo.webp" },
    ],
    canalesTitulo: "Haz que esta Navidad sea especial",
    canalesTexto: "Encuentra la canasta o box ideal para regalar.",
    canalesBoton: "Ver catálogo",
    canalesWhatsapp: "Hablar por WhatsApp",
    canalesImagen: "/imgs_general/banner-2.webp",
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
    telefono: "913 196 780",
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
      { nombre: "Tarjeta", detalle: "Visa, Mastercard, Amex", nota: "Al pagar te llevaremos a la pasarela segura. Aquí no se ingresan datos de tarjeta.", pasarela: "mercadopago" },
      { nombre: "Yape / Plin", detalle: "Pago con QR", nota: "Te mostraremos el QR y el monto exacto en el siguiente paso.", pasarela: "qr" },
      { nombre: "Transferencia", detalle: "BCP, Interbank, BBVA", nota: "Recibirás los datos bancarios por correo. El pedido se confirma al validar el abono.", pasarela: "" },
    ],
    notaImpuestos: "Precios incluyen IGV.",
    qrImagen: "/pagos/yape-qr.png",
    qrNota: "Tu pedido quedará pendiente de pago hasta que envíes tu comprobante y este sea verificado.",
    tarjetaPrecio: 2,
    tarjetaTitulo: "Tarjeta navideña de dedicatoria",
    tarjetaTexto: "Agrega una tarjeta con una dedicatoria personalizada para tu regalo.",
    tarjetaImagen: "/imgs_general/tarjeta-navidad.webp",
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
    ladoImagen: "/imgs_general/banner-4.webp",
    notaEntrega: "Cada pedido corporativo contempla una sola dirección de entrega.",
    pdfSubtitulo: "Navidad 2026",
    pdfFormaPago: "50 % adelantado, 50 % un día antes de la entrega",
    pdfHorarioEntrega: "Lunes a sábado de 1:00 p. m. a 7:30 p. m.",
    pdfCondiciones: [
      "Vigencia: La presente cotización será válida hasta la fecha indicada en el documento.",
      "Forma de pago: 50 % de adelanto y 50 % un día antes de la entrega, según lo acordado.",
      "Tiempo de preparación: De 5 a 7 días hábiles después de recibir la orden de pedido y el adelanto correspondiente, sujeto a disponibilidad y confirmación.",
      "Horarios de entrega: Martes, jueves y sábados, de 1:00 p. m. a 7:00 p. m., previa coordinación con el cliente.",
      "Disponibilidad: Los productos podrán reemplazarse por alternativas de igual o mayor valor únicamente previa coordinación y aprobación del cliente.",
      "Confirmación: La cotización no constituye una orden de pedido confirmada. La preparación comenzará una vez aceptada la propuesta y cumplidas las condiciones acordadas.",
    ],
    pdfCondicionesOrden: [
      "Cuenta corriente MN: Banco — N.º de cuenta.",
      "Horarios de entrega: Las entregas se realizan los martes, jueves y sábados, de 1:00 p. m. a 7:00 p. m., previa coordinación con el cliente.",
      "Coordinación: La entrega se realizará en la dirección acordada. Cualquier cambio deberá comunicarse con anticipación por WhatsApp.",
      "Recepción del pedido: Se recomienda verificar las cantidades y el estado de los productos al recibirlos. Cualquier observación deberá comunicarse a MKA dentro de las 24 horas siguientes a la entrega.",
      "Pago: El pago se realizará según las condiciones previamente acordadas con MKA.",
    ],
  },
  pie: {
    texto: "Canastas navideñas y regalos corporativos armados a mano, con atención personalizada.",
    derechos: "© 2026 MKA · Canastas Navideñas & Regalos",
    suscribirTitulo: "Suscríbete y recibe novedades",
    faq: [
      { titulo: "¿Hacen entregas en provincias?", texto: "Sí. Coordinamos envíos a provincias; el costo depende del destino. Escríbenos por WhatsApp para cotizarlo." },
      { titulo: "¿Con cuánta anticipación debo pedir?", texto: "Recomendamos hacer tu pedido con al menos 5 a 7 días hábiles de anticipación, sobre todo en diciembre." },
      { titulo: "¿Puedo personalizar mi canasta?", texto: "Sí. Puedes elegir otro tipo de canasta al comprar y, para empresas, armamos canastas a medida con tu logo." },
      { titulo: "¿Qué medios de pago aceptan?", texto: "Tarjeta, Yape / Plin y transferencia bancaria. Te confirmamos el pago antes de preparar tu pedido." },
      { titulo: "¿Emiten boleta o factura?", texto: "Sí, emitimos boleta o factura electrónica con los datos que indiques al comprar." },
    ],
    terminos: "MKA CANASTAS NAVIDEÑAS Y REGALOS\n\nÚltima actualización: Octubre del 2026\n\nBienvenido(a) a MKA CANASTAS NAVIDEÑAS Y REGALOS. Al navegar por nuestro sitio web, solicitar una cotización o realizar una compra, aceptas los presentes Términos y Condiciones.\n\nTe recomendamos leer este documento antes de confirmar cualquier pedido.\n\n## 1. INFORMACIÓN GENERAL\n\nMKA CANASTAS NAVIDEÑAS Y REGALOS es un negocio dedicado a la comercialización de canastas navideñas, boxes de regalo y productos para ocasiones especiales, dirigido a clientes particulares, empresas e instituciones.\n\nA través de nuestra página web ofrecemos información sobre nuestros productos, presentaciones y opciones de cotización.\n\n## 2. PRODUCTOS Y DISPONIBILIDAD\n\nLos productos publicados en nuestra página web están sujetos a disponibilidad de stock.\n\n- Las imágenes son referenciales y pueden presentar pequeñas variaciones en tonalidades, presentación o empaques.\n- Las características y contenido de cada canasta o box se detallan en su respectiva descripción.\n- En caso de que algún producto no se encuentre disponible, cualquier propuesta de sustitución será comunicada previamente al cliente.\n- Los pedidos personalizados estarán sujetos a disponibilidad y coordinación previa.\n\nMKA se compromete a respetar las características y condiciones ofrecidas y confirmadas en cada pedido.\n\n## 3. PRECIOS Y COTIZACIONES\n\n- Los precios publicados están expresados en soles (S/).\n- Los precios incluyen el Impuesto General a las Ventas (IGV).\n- El servicio de delivery se cotiza por separado, salvo que se indique expresamente lo contrario.\n- Los precios de los productos no incluyen gastos de transporte mediante agencias externas.\n- Las cotizaciones corporativas se elaboran considerando la cantidad solicitada, presentación, productos seleccionados y lugar de entrega.\n- Cada cotización tendrá una vigencia indicada en el documento correspondiente.\n\nLa solicitud de una cotización no representa una reserva ni garantiza la disponibilidad de los productos.\n\n## 4. PROCESO DE COMPRA Y CONFIRMACIÓN DE PEDIDOS\n\nMKA ofrece dos modalidades para realizar compras, según la preferencia y necesidad del cliente:\n\n### 4.1. Compras directamente desde la página web\n\nLos clientes podrán seleccionar los productos disponibles, agregarlos al carrito y completar su pedido directamente a través de nuestra plataforma.\n\nEl proceso comprende:\n\n- Seleccionar la canasta o box de preferencia.\n- Agregar los productos al carrito de compras.\n- Revisar el detalle del pedido, cantidades y precio total.\n- Completar los datos de contacto y entrega solicitados por la plataforma.\n- Seleccionar el medio de pago disponible y realizar el pago correspondiente.\n- Recibir la confirmación del pedido por los canales de comunicación registrados.\n\nLa compra quedará sujeta a la verificación del pago y disponibilidad de los productos.\n\n### 4.2. Compras mediante nuestros canales de atención\n\nLos clientes también podrán solicitar información y realizar pedidos mediante nuestros canales de comunicación, como WhatsApp o correo electrónico.\n\nEsta modalidad está especialmente dirigida a pedidos corporativos, compras por volumen y solicitudes personalizadas.\n\nEl proceso comprende:\n\n- El cliente se comunica con MKA y solicita información o una cotización.\n- Se recopilan los datos necesarios para elaborar la propuesta comercial.\n- MKA envía la cotización detallando productos, cantidades, precios, condiciones de pago y entrega.\n- El cliente revisa la propuesta y confirma su aceptación.\n- Se realiza el pago de acuerdo con las condiciones establecidas.\n- Una vez verificado el pago, MKA confirma el pedido e inicia su preparación.\n\n### 4.3. Confirmación de pedidos\n\nIndependientemente de la modalidad de compra seleccionada, los pedidos estarán sujetos a la disponibilidad de productos y al cumplimiento de las condiciones de pago establecidas.\n\nLa solicitud de información o el envío de una cotización no representa una reserva ni garantiza la disponibilidad de los productos.\n\nMKA comunicará la confirmación correspondiente una vez cumplidas las condiciones necesarias para procesar el pedido.\n\n## 5. FORMAS Y CONDICIONES DE PAGO\n\nLos medios de pago disponibles serán comunicados por nuestro equipo comercial durante el proceso de compra.\n\nPara pedidos corporativos o de grandes cantidades, las condiciones de pago, adelantos y saldos pendientes serán establecidas en la cotización correspondiente.\n\nLa preparación del pedido estará sujeta a la confirmación del pago acordado.\n\n## 6. ENTREGAS Y ENVÍOS\n\nMKA realiza entregas en Lima y envíos a provincias, previa coordinación con el cliente.\n\n### 6.1. Entregas en Lima\n\n- Las entregas se realizan previa coordinación.\n- Los días habituales de reparto son martes, jueves y sábados, de 1:00 p. m. a 7:00 p. m., sujetos a disponibilidad y confirmación.\n- El cliente deberá proporcionar una dirección completa y correcta.\n- El costo del delivery se informará durante la cotización.\n- Para pedidos superiores a 100 unidades, se ofrece delivery gratuito, sujeto a las condiciones de cobertura y coordinación previamente establecidas.\n- La entrega se coordinará en una única dirección por pedido, salvo acuerdo comercial diferente.\n\n### 6.2. Envíos a provincias\n\n- Los envíos podrán gestionarse mediante agencias de transporte, como Shalom.\n- El costo del transporte será asumido por el cliente, salvo acuerdo diferente.\n- El cliente deberá proporcionar correctamente los datos del destinatario y lugar de destino.\n- Una vez entregado el pedido a la agencia, se proporcionará la información disponible para el seguimiento del envío.\n- Los tiempos de traslado dependerán de la agencia de transporte y del destino.\n\nMKA brindará asistencia ante cualquier incidencia relacionada con la preparación y despacho del pedido.\n\n## 7. MODIFICACIONES DE PEDIDOS\n\nCualquier solicitud de modificación en cantidades, productos, presentación, personalización o dirección de entrega deberá comunicarse oportunamente.\n\nLas modificaciones estarán sujetas a la disponibilidad de productos, materiales y al estado de preparación del pedido.\n\nUna vez iniciado el armado o preparación de un pedido personalizado o corporativo, los cambios podrían no ser posibles o generar costos adicionales, los cuales serán comunicados previamente.\n\n## 8. CANCELACIONES\n\nLas solicitudes de cancelación deberán comunicarse directamente con nuestro equipo de atención.\n\nCada solicitud será evaluada considerando el estado del pedido, los gastos incurridos y los compromisos asumidos con proveedores.\n\nCuando corresponda una devolución de dinero, esta será coordinada con el cliente conforme a las condiciones aplicables y la normativa vigente.\n\nLo establecido en este apartado no limita los derechos reconocidos al consumidor por la legislación peruana.\n\n## 9. CAMBIOS, DEVOLUCIONES Y RECLAMOS\n\nMKA busca garantizar que todos los pedidos sean entregados de acuerdo con las características y condiciones confirmadas.\n\nEn caso de recibir un pedido incompleto, equivocado, dañado o diferente al solicitado, el cliente deberá comunicarse con nosotros y proporcionar fotografías o evidencias que permitan evaluar el inconveniente.\n\nLuego de revisar el caso, se coordinará la solución correspondiente, que podrá incluir reposición, cambio o devolución, según corresponda.\n\nLos derechos del consumidor establecidos en la legislación peruana serán respetados en todo momento.\n\n## 10. RESPONSABILIDADES DEL CLIENTE\n\nEl cliente se compromete a:\n\n- Proporcionar información veraz y actualizada.\n- Verificar las cantidades, productos y características indicadas en la cotización.\n- Cumplir con las condiciones de pago acordadas.\n- Proporcionar correctamente los datos de entrega.\n- Coordinar la recepción del pedido en la fecha establecida.\n- Revisar la información de su pedido antes de confirmarlo.\n\n## 11. PROTECCIÓN DE DATOS PERSONALES\n\nLos datos personales proporcionados por los clientes serán utilizados para gestionar cotizaciones, procesar pedidos, coordinar entregas, emitir comprobantes y brindar atención comercial.\n\nMKA se compromete a tratar la información personal de manera confidencial y conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento vigente.\n\nLos clientes podrán ejercer los derechos que les reconoce la normativa mediante los canales de atención correspondientes.\n\nPara mayor información, podrán consultar nuestra Política de Privacidad.\n\n## 12. PROPIEDAD INTELECTUAL\n\nEl contenido publicado en nuestra página web, incluyendo fotografías, diseños, logotipos, textos, imágenes y material gráfico, se encuentra protegido por las disposiciones aplicables sobre propiedad intelectual.\n\nQueda prohibida su reproducción, distribución o utilización comercial sin la autorización correspondiente de sus titulares.\n\n## 13. LIBRO DE RECLAMACIONES\n\nMKA pone a disposición de sus clientes un Libro de Reclamaciones Virtual, mediante el cual podrán registrar sus quejas o reclamos relacionados con los productos y servicios ofrecidos.\n\nEl acceso estará disponible mediante un enlace visible en nuestra página web.\n\nLos reclamos serán atendidos dentro de los plazos establecidos por la normativa peruana vigente.\n\n## 14. MODIFICACIONES DE LOS TÉRMINOS Y CONDICIONES\n\nMKA podrá actualizar o modificar los presentes Términos y Condiciones cuando resulte necesario para mejorar sus servicios o adecuarse a cambios comerciales y normativos.\n\nLas modificaciones serán publicadas en nuestra página web, indicando la fecha de actualización.\n\n## 15. LEGISLACIÓN APLICABLE\n\nLos presentes Términos y Condiciones se rigen por las leyes de la República del Perú, especialmente por:\n\n- Ley N.° 29571, Código de Protección y Defensa del Consumidor.\n- Ley N.° 29733, Ley de Protección de Datos Personales.\n- Decreto Supremo N.° 016-2024-JUS, Reglamento de la Ley de Protección de Datos Personales.\n- Demás disposiciones legales aplicables.\n\nMKA CANASTAS NAVIDEÑAS Y REGALOS\n\nLima, Perú.",
    privacidad: "MKA CANASTAS NAVIDEÑAS Y REGALOS\n\nÚltima actualización: Octubre del 2026\n\n## 1. MARCO LEGAL Y ÁMBITO DE APLICACIÓN\n\nLa presente Política de Privacidad se encuentra regulada por la legislación vigente de la República del Perú, especialmente por:\n\n- Ley N.° 29733, Ley de Protección de Datos Personales.\n- Decreto Supremo N.° 016-2024-JUS, Reglamento de la Ley de Protección de Datos Personales.\n- Demás disposiciones complementarias y modificatorias aplicables.\n\nMKA CANASTAS NAVIDEÑAS Y REGALOS se compromete a proteger la información personal de sus clientes y usuarios, garantizando que su recopilación, almacenamiento, uso y tratamiento se realicen conforme a la normativa vigente.\n\nEsta política se aplica a toda información personal recopilada mediante nuestra página web https://mkacanastas.com/ y nuestros canales de comunicación, incluyendo WhatsApp y correo electrónico.\n\n## 2. RESPONSABLE DEL TRATAMIENTO DE DATOS PERSONALES\n\nMKA CANASTAS NAVIDEÑAS Y REGALOS es responsable del tratamiento de los datos personales recopilados a través de su página web y canales de atención comercial.\n\nPara consultas relacionadas con el tratamiento de datos personales, los usuarios podrán comunicarse mediante nuestros canales de atención:\n\n- Página web: https://mkacanastas.com/\n- WhatsApp: 913 196 780\n- Correo electrónico: mkacanastas@gmail.com\n\n## 3. INFORMACIÓN PERSONAL QUE RECOPILAMOS\n\nDependiendo de la modalidad de compra o consulta, podremos recopilar los siguientes datos:\n\n### 3.1. Datos de identificación\n\n- Nombres y apellidos.\n- DNI o documento de identidad, cuando corresponda.\n- Razón social y RUC, en caso de compras empresariales.\n\n### 3.2. Datos de contacto\n\n- Número de teléfono o WhatsApp.\n- Dirección de correo electrónico.\n\n### 3.3. Datos de entrega\n\n- Dirección de entrega.\n- Distrito, provincia y departamento.\n- Nombre y teléfono de la persona que recibirá el pedido, cuando corresponda.\n\n### 3.4. Información comercial y de compra\n\n- Productos seleccionados.\n- Cantidades solicitadas.\n- Historial de pedidos y cotizaciones.\n- Información necesaria para gestionar pagos y comprobantes.\n- Consultas, solicitudes y reclamos realizados por los clientes.\n\nMKA recopilará únicamente los datos necesarios para las finalidades descritas en esta política.\n\n## 4. FINALIDAD DEL TRATAMIENTO DE DATOS PERSONALES\n\nLos datos personales recopilados podrán utilizarse para las siguientes finalidades:\n\n- Gestionar solicitudes de información y cotizaciones.\n- Procesar y confirmar pedidos realizados mediante nuestra página web.\n- Atender compras coordinadas por WhatsApp o correo electrónico.\n- Coordinar pagos y emisión de comprobantes.\n- Organizar la preparación y entrega de los pedidos.\n- Gestionar envíos mediante agencias de transporte.\n- Atender consultas, solicitudes, quejas y reclamos.\n- Mantener un registro de las operaciones comerciales.\n- Cumplir con las obligaciones legales y tributarias correspondientes.\n\nEl uso de datos personales para el envío de publicidad, promociones y comunicaciones comerciales requerirá el consentimiento correspondiente cuando sea exigible. La negativa a recibir publicidad no impedirá realizar una compra.\n\n## 5. RECOPILACIÓN DE INFORMACIÓN SEGÚN EL CANAL DE COMPRA\n\nMKA cuenta con dos modalidades principales para realizar compras:\n\n### 5.1. Compras mediante nuestra página web\n\nCuando el cliente realiza una compra directamente desde https://mkacanastas.com/, podremos recopilar los datos ingresados durante el proceso de compra, tales como información de contacto, productos seleccionados, dirección de entrega y datos necesarios para procesar el pedido.\n\nEsta información será utilizada para gestionar la operación, confirmar la compra y brindar seguimiento al pedido.\n\n### 5.2. Compras mediante WhatsApp o correo electrónico\n\nCuando el cliente solicita una cotización o realiza un pedido mediante nuestros canales de atención, podremos recopilar sus datos de identificación, contacto, información empresarial, cantidades solicitadas y lugar de entrega.\n\nEsta información permitirá elaborar cotizaciones, coordinar condiciones comerciales y gestionar los pedidos correspondientes.\n\n## 6. COMPARTICIÓN DE DATOS PERSONALES\n\nMKA CANASTAS NAVIDEÑAS Y REGALOS no comercializa ni vende los datos personales de sus clientes.\n\nSin embargo, podremos compartir la información estrictamente necesaria con terceros cuando resulte indispensable para prestar nuestros servicios, incluyendo:\n\n- Agencias de transporte: para gestionar los envíos y entregas de pedidos, como Shalom.\n- Proveedores de servicios de pago: para procesar y verificar las transacciones realizadas mediante la plataforma.\n- Proveedores tecnológicos: para el funcionamiento, alojamiento, mantenimiento y seguridad de nuestra página web.\n- Entidades públicas: cuando exista una obligación legal o requerimiento válido de autoridad competente.\n\nEn caso de transferencias nacionales o internacionales de datos personales, estas se realizarán conforme a las condiciones y garantías establecidas por la normativa vigente.\n\n## 7. SEGURIDAD DE LA INFORMACIÓN\n\nMKA adopta medidas de seguridad razonables para proteger los datos personales frente a accesos no autorizados, pérdida, alteración, divulgación o uso indebido.\n\nAsimismo, procuramos limitar el acceso a la información únicamente a las personas y proveedores que necesitan utilizarla para cumplir con las actividades comerciales y operativas correspondientes.\n\n## 8. CONSERVACIÓN DE LOS DATOS PERSONALES\n\nLos datos personales serán conservados durante el tiempo necesario para cumplir con las finalidades para las que fueron recopilados.\n\nLa información relacionada con operaciones comerciales podrá conservarse durante los plazos exigidos por las obligaciones legales, tributarias y contables aplicables.\n\nCuando los datos dejen de ser necesarios y no exista una obligación legal que justifique su conservación, se procederá a su eliminación o anonimización, según corresponda.\n\n## 9. USO DE COOKIES\n\nNuestra página web podrá utilizar cookies y tecnologías similares para facilitar la navegación, recordar determinadas preferencias y mejorar la experiencia del usuario.\n\nLas cookies podrán utilizarse para:\n\n- Permitir el correcto funcionamiento de la página web.\n- Recordar preferencias de navegación.\n- Analizar el funcionamiento y rendimiento del sitio.\n- Mejorar la experiencia de compra.\n\nCuando corresponda, las cookies no esenciales estarán sujetas a los mecanismos de información y consentimiento aplicables.\n\nEl usuario podrá gestionar las cookies mediante la configuración de su navegador o las herramientas de preferencias disponibles en la página web.\n\n## 10. DERECHOS DE LOS TITULARES DE DATOS PERSONALES\n\nDe acuerdo con la legislación peruana, los usuarios pueden ejercer los siguientes derechos respecto a sus datos personales:\n\n- Derecho de información: conocer cómo y para qué se utilizan sus datos.\n- Derecho de acceso: solicitar información sobre sus datos personales.\n- Derecho de rectificación: solicitar la corrección de información incorrecta o incompleta.\n- Derecho de cancelación: solicitar la eliminación de sus datos cuando corresponda legalmente.\n- Derecho de oposición: oponerse a determinados tratamientos de sus datos personales.\n- Derecho de revocación: retirar el consentimiento otorgado, cuando corresponda.\n\nPara ejercer estos derechos, el usuario podrá presentar una solicitud mediante nuestros canales de atención, indicando su nombre, el derecho que desea ejercer y la información necesaria para identificar su solicitud.\n\nMKA atenderá las solicitudes dentro de los plazos establecidos por la normativa vigente.\n\nEl ejercicio de estos derechos será gratuito, conforme a las disposiciones legales aplicables.\n\n## 11. CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES\n\nCuando el tratamiento de datos personales requiera consentimiento, MKA solicitará la autorización correspondiente de manera libre, previa, expresa, informada e inequívoca, conforme a la normativa vigente.\n\nEl consentimiento para recibir comunicaciones promocionales será independiente del tratamiento necesario para gestionar una compra o cotización.\n\nEl usuario podrá revocar su consentimiento conforme a los procedimientos establecidos por la normativa vigente, sin afectar la licitud del tratamiento realizado previamente.\n\nLa publicación de esta Política de Privacidad no sustituye la obtención del consentimiento cuando este sea necesario.\n\n## 12. ENLACES A TERCEROS\n\nNuestra página web podrá contener enlaces a plataformas o servicios externos.\n\nMKA no controla las políticas de privacidad ni las prácticas de tratamiento de datos de dichos sitios. Por ello, recomendamos revisar sus respectivas políticas antes de proporcionar información personal.\n\n## 13. MODIFICACIONES DE LA POLÍTICA DE PRIVACIDAD\n\nMKA podrá actualizar o modificar esta Política de Privacidad cuando resulte necesario debido a cambios en nuestros procesos comerciales, tecnológicos o normativos.\n\nLas modificaciones serán publicadas en nuestra página web, indicando la fecha de actualización correspondiente.\n\nMKA CANASTAS NAVIDEÑAS Y REGALOS\n\nhttps://mkacanastas.com/\n\nLima, Perú.",
  },
  nosotros: {
    etiqueta: "Nosotros",
    titulo: "Regalos que *conectan* personas.",
    texto: "En MKA Canastas Navideñas y Regalos somos una empresa dedicada a crear detalles que transmiten emociones y fortalecen vínculos.\n\nNos caracteriza la creatividad, la dedicación y el compromiso por brindar productos de calidad, cuidando cada detalle para convertir cada obsequio en una experiencia especial.",
    imagen: "",
    historia: "Trabajamos para que cada regalo represente mucho más que un presente: sea una muestra de agradecimiento, reconocimiento y aprecio.",
    lema: "En MKA, cada detalle tiene un propósito y cada regalo cuenta una historia.",
    valores: [
      {
        titulo: "Nuestro equipo",
        texto: "Profesionalismo y dedicación en cada servicio.\n\nContamos con un equipo de profesionales comprometidos y capacitados, que se encarga de cada etapa del proceso con responsabilidad, agilidad y atención al detalle. Trabajamos para ofrecer soluciones eficientes, optimizar recursos y garantizar que cada evento se desarrolle de manera exitosa, brindando una experiencia de calidad a nuestros clientes.",
      },
      {
        titulo: "Nuestra misión",
        texto: "Llevar alegría y crear momentos especiales a través de nuestras canastas navideñas y box navideños, brindando alternativas que se adapten a las necesidades de cada cliente y organización.",
      },
      {
        titulo: "Nuestra visión",
        texto: "Llegar a más hogares y empresas con productos que transmitan cariño, gratitud y el verdadero espíritu de compartir.",
      },
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
