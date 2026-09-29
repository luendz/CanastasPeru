import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { combinarContenido, type SeccionContenido } from "@/lib/contenido";
import EditorSeccion, { type Campo } from "./EditorSeccion";

export const metadata = { title: "Contenido de la web" };

const PASOS = [{ clave: "titulo", etiqueta: "Título" }, { clave: "texto", etiqueta: "Texto", largo: true }];
const ENFASIS = "Encierra una palabra entre *asteriscos* para resaltarla.";

const SECCIONES: { id: SeccionContenido; titulo: string; donde: string; ver: string; campos: Campo[] }[] = [
  {
    id: "marca", titulo: "Marca", donde: "Logo, nombre e ícono de la pestaña del navegador.", ver: "/",
    campos: [
      { tipo: "texto", clave: "nombre", etiqueta: "Nombre de la marca" },
      { tipo: "texto", clave: "lema", etiqueta: "Lema" },
      { tipo: "imagen", clave: "logo", etiqueta: "Logo", ayuda: "Se muestra en la cabecera y el pie. Mejor con fondo transparente." },
      { tipo: "imagen", clave: "icono", etiqueta: "Ícono (favicon)", ayuda: "Imagen cuadrada, idealmente PNG de 512×512." },
    ],
  },
  {
    id: "portada", titulo: "Portada", donde: "La página de inicio, de arriba hacia abajo.", ver: "/",
    campos: [
      { tipo: "texto", clave: "heroEtiqueta", etiqueta: "Banner: etiqueta" },
      { tipo: "canasta", clave: "canastaDestacada", etiqueta: "Banner: canasta de muestra", ayuda: "Se ve mientras no subas una imagen del banner." },
      { tipo: "texto", clave: "heroTitulo", etiqueta: "Banner: título", ayuda: ENFASIS, largo: true },
      { tipo: "texto", clave: "heroTexto", etiqueta: "Banner: texto", largo: true },
      { tipo: "imagen", clave: "heroImagen", etiqueta: "Banner: imagen principal", ayuda: "Foto horizontal a todo el ancho. El texto va sobre el lado izquierdo." },
      { tipo: "filas", clave: "heroFondos", etiqueta: "Banner: más imágenes (opcional)", ayuda: "Si agregas más, el banner las va pasando solo.", columnas: [{ clave: "imagen", etiqueta: "Imagen", tipo: "imagen" }] },
      { tipo: "texto", clave: "heroBoton1", etiqueta: "Banner: botón a canastas" },
      { tipo: "texto", clave: "heroBoton2", etiqueta: "Banner: botón a boxes" },
      { tipo: "lineas", clave: "heroPuntos", etiqueta: "Banner: puntos (3)" },
      { tipo: "texto", clave: "porQueTitulo", etiqueta: "¿Por qué elegir MKA?: título" },
      { tipo: "filas", clave: "porQue", etiqueta: "¿Por qué elegir MKA?: razones", columnas: PASOS },
      { tipo: "texto", clave: "tiposEtiqueta", etiqueta: "Tipos de canasta: texto sobre el título" },
      { tipo: "texto", clave: "tiposTitulo", etiqueta: "Tipos de canasta: título", ayuda: "Los textos e imágenes de cada tipo se editan en la sección Catálogo." },
      { tipo: "texto", clave: "comprarTitulo", etiqueta: "¿Cómo comprar?: título" },
      { tipo: "filas", clave: "comprarPasos", etiqueta: "¿Cómo comprar?: pasos", columnas: PASOS },
      { tipo: "texto", clave: "corpEtiqueta", etiqueta: "Banner empresas: etiqueta" },
      { tipo: "texto", clave: "corpTitulo", etiqueta: "Banner empresas: título", ayuda: ENFASIS },
      { tipo: "texto", clave: "corpTexto", etiqueta: "Banner empresas: texto", largo: true },
      { tipo: "lineas", clave: "corpPuntos", etiqueta: "Banner empresas: puntos" },
      { tipo: "texto", clave: "corpBoton", etiqueta: "Banner empresas: botón" },
      { tipo: "imagen", clave: "corpImagen", etiqueta: "Banner empresas: imagen de fondo", ayuda: "Horizontal, con el lado izquierdo despejado: el texto va encima a la izquierda." },
      { tipo: "texto", clave: "marcasTitulo", etiqueta: "Marcas: título" },
      { tipo: "texto", clave: "marcasTexto", etiqueta: "Marcas: texto", largo: true },
      { tipo: "filas", clave: "marcas", etiqueta: "Marcas", ayuda: "La sección aparece en la portada cuando al menos una marca tiene logo.", columnas: [{ clave: "imagen", etiqueta: "Logo", tipo: "imagen" }, { clave: "nombre", etiqueta: "Nombre" }] },
      { tipo: "texto", clave: "canalesTitulo", etiqueta: "Canales de atención: título" },
      { tipo: "texto", clave: "canalesTexto", etiqueta: "Canales de atención: texto" },
      { tipo: "texto", clave: "canalesBoton", etiqueta: "Canales: botón al catálogo" },
      { tipo: "texto", clave: "canalesWhatsapp", etiqueta: "Canales: botón de WhatsApp" },
      { tipo: "imagen", clave: "canalesImagen", etiqueta: "Canales: imagen de fondo", ayuda: "Franja horizontal con el centro despejado (el texto va al medio)." },
    ],
  },
  {
    id: "catalogo", titulo: "Catálogo", donde: "Páginas Canastas y Boxes navideños, y los tipos de canasta de la portada.", ver: "/canastas",
    campos: [
      { tipo: "texto", clave: "etiqueta", etiqueta: "Canastas: etiqueta" },
      { tipo: "texto", clave: "titulo", etiqueta: "Canastas: título", ayuda: ENFASIS },
      { tipo: "texto", clave: "texto", etiqueta: "Canastas: texto", largo: true },
      { tipo: "filas", clave: "lineas", etiqueta: "Líneas (en orden: Económicas, Premium, Ejecutivas, Boxes)", columnas: [{ clave: "imagen", etiqueta: "Imagen", tipo: "imagen" }, { clave: "titulo", etiqueta: "Título" }, { clave: "texto", etiqueta: "Texto", largo: true }] },
      { tipo: "texto", clave: "boxesEtiqueta", etiqueta: "Boxes: etiqueta" },
      { tipo: "texto", clave: "boxesTitulo", etiqueta: "Boxes: título", ayuda: ENFASIS },
      { tipo: "texto", clave: "boxesTexto", etiqueta: "Boxes: texto", largo: true },
      { tipo: "texto", clave: "ctaTitulo", etiqueta: "Llamado final: título", ayuda: ENFASIS },
      { tipo: "texto", clave: "ctaBoton", etiqueta: "Llamado final: botón" },
      { tipo: "texto", clave: "ctaTexto", etiqueta: "Llamado final: texto", largo: true },
    ],
  },
  {
    id: "producto", titulo: "Página de producto", donde: "Beneficios bajo el botón de compra.", ver: "/catalogo",
    campos: [{ tipo: "filas", clave: "beneficios", etiqueta: "Beneficios", columnas: PASOS }],
  },
  {
    id: "contacto", titulo: "Contacto", donde: "Pie de página, botón de WhatsApp y página Contacto.", ver: "/contacto",
    campos: [
      { tipo: "texto", clave: "telefono", etiqueta: "Teléfono / WhatsApp" },
      { tipo: "texto", clave: "correo", etiqueta: "Correo" },
      { tipo: "texto", clave: "ciudad", etiqueta: "Ciudad" },
      { tipo: "texto", clave: "horario", etiqueta: "Horario de atención" },
      { tipo: "texto", clave: "instagram", etiqueta: "Instagram (enlace)", ayuda: "Ej. https://instagram.com/mka. Vacío = no se muestra." },
      { tipo: "texto", clave: "facebook", etiqueta: "Facebook (enlace)" },
      { tipo: "texto", clave: "tiktok", etiqueta: "TikTok (enlace)" },
    ],
  },
  {
    id: "checkout", titulo: "Pago y entrega", donde: "Horarios de entrega y métodos de pago del checkout.", ver: "/checkout",
    campos: [
      { tipo: "filas", clave: "horarios", etiqueta: "Horarios de entrega", columnas: [{ clave: "nombre", etiqueta: "Nombre" }, { clave: "rango", etiqueta: "Horario" }] },
      { tipo: "filas", clave: "metodosPago", etiqueta: "Métodos de pago", columnas: [{ clave: "nombre", etiqueta: "Nombre" }, { clave: "detalle", etiqueta: "Detalle" }, { clave: "nota", etiqueta: "Nota al elegirlo", largo: true }] },
      { tipo: "texto", clave: "notaImpuestos", etiqueta: "Nota de impuestos", ayuda: "Aparece bajo los totales del carrito y el checkout." },
      { tipo: "numero", clave: "tarjetaPrecio", etiqueta: "Tarjeta navideña: precio (S/)", ayuda: "Se suma al pedido por cada tarjeta." },
      { tipo: "texto", clave: "tarjetaTitulo", etiqueta: "Tarjeta navideña: título" },
      { tipo: "texto", clave: "tarjetaTexto", etiqueta: "Tarjeta navideña: texto", largo: true },
      { tipo: "imagen", clave: "tarjetaImagen", etiqueta: "Tarjeta navideña: imagen", ayuda: "Foto de la tarjeta que se ve en el carrito." },
    ],
  },
  {
    id: "cotizacion", titulo: "Cotización empresas", donde: "La página de cotización corporativa y su formulario.", ver: "/cotizacion",
    campos: [
      { tipo: "texto", clave: "etiqueta", etiqueta: "Etiqueta" },
      { tipo: "texto", clave: "titulo", etiqueta: "Título", ayuda: ENFASIS },
      { tipo: "texto", clave: "texto", etiqueta: "Texto", largo: true },
      { tipo: "filas", clave: "pasos", etiqueta: "Pasos", columnas: PASOS },
      { tipo: "texto", clave: "beneficiosTitulo", etiqueta: "Beneficios: título", ayuda: ENFASIS },
      { tipo: "numeros", clave: "cantidades", etiqueta: "Cantidades sugeridas", ayuda: "Botones rápidos del formulario." },
      { tipo: "lineas", clave: "beneficios", etiqueta: "Beneficios" },
      { tipo: "filas", clave: "presupuestos", etiqueta: "Rangos de presupuesto por canasta", ayuda: "Máximo 0 = sin tope.", columnas: [{ clave: "etiqueta", etiqueta: "Etiqueta", largo: true }, { clave: "min", etiqueta: "Mín. S/", tipo: "numero" }, { clave: "max", etiqueta: "Máx. S/", tipo: "numero" }] },
      { tipo: "lineas", clave: "personalizacion", etiqueta: "Opciones de personalización" },
      { tipo: "texto", clave: "ladoTitulo", etiqueta: "Columna izquierda: título" },
      { tipo: "lineas", clave: "ladoPuntos", etiqueta: "Columna izquierda: puntos" },
      { tipo: "texto", clave: "ladoFrase", etiqueta: "Columna izquierda: frase final" },
      { tipo: "imagen", clave: "ladoImagen", etiqueta: "Columna izquierda: imagen" },
      { tipo: "texto", clave: "notaEntrega", etiqueta: "Nota bajo la dirección de entrega" },
      { tipo: "texto", clave: "pdfSubtitulo", etiqueta: "PDF: subtítulo del encabezado", ayuda: "Ej. Navidad 2026. Sale en la cotización y en la orden de pedido." },
      { tipo: "texto", clave: "pdfFormaPago", etiqueta: "PDF: forma de pago por defecto" },
      { tipo: "texto", clave: "pdfHorarioEntrega", etiqueta: "PDF: horario de entrega por defecto" },
      { tipo: "lineas", clave: "pdfCondiciones", etiqueta: "PDF de cotización: condiciones y observaciones", ayuda: "Incluye aquí la cuenta bancaria." },
      { tipo: "lineas", clave: "pdfCondicionesOrden", etiqueta: "PDF de orden de pedido: condiciones y observaciones" },
    ],
  },
  {
    id: "nosotros", titulo: "Nosotros", donde: "La página Nosotros.", ver: "/nosotros",
    campos: [
      { tipo: "texto", clave: "etiqueta", etiqueta: "Etiqueta" },
      { tipo: "texto", clave: "titulo", etiqueta: "Título", ayuda: ENFASIS },
      { tipo: "texto", clave: "texto", etiqueta: "Texto de presentación", largo: true },
      { tipo: "imagen", clave: "imagen", etiqueta: "Imagen" },
      { tipo: "texto", clave: "historia", etiqueta: "Historia", largo: true, ayuda: "Deja una línea en blanco entre párrafos." },
      { tipo: "filas", clave: "valores", etiqueta: "Valores", columnas: PASOS },
    ],
  },
  {
    id: "pie", titulo: "Pie de página", donde: "Pie de todas las páginas, preguntas frecuentes, términos y privacidad.", ver: "/",
    campos: [
      { tipo: "texto", clave: "texto", etiqueta: "Texto", largo: true },
      { tipo: "texto", clave: "derechos", etiqueta: "Derechos" },
      { tipo: "texto", clave: "suscribirTitulo", etiqueta: "Suscripción: título" },
      { tipo: "filas", clave: "faq", etiqueta: "Preguntas frecuentes", columnas: [{ clave: "titulo", etiqueta: "Pregunta" }, { clave: "texto", etiqueta: "Respuesta", largo: true }] },
      { tipo: "texto", clave: "terminos", etiqueta: "Términos y condiciones", largo: true, ayuda: "Deja una línea en blanco entre párrafos." },
      { tipo: "texto", clave: "privacidad", etiqueta: "Política de privacidad", largo: true, ayuda: "Deja una línea en blanco entre párrafos." },
    ],
  },
];

export default async function ContenidoPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { supabase } = await requireAdmin();
  const { s } = await searchParams;
  const actual = SECCIONES.find((x) => x.id === s) ?? SECCIONES[0];

  const [{ data: filas, error }, { data: productos }] = await Promise.all([
    supabase.from("contenido").select("clave, valor, updated_at"),
    supabase.from("productos").select("slug, nombre").order("orden"),
  ]);
  const guardado = Object.fromEntries((filas ?? []).map((f) => [f.clave, f.valor]));
  const contenido = combinarContenido(guardado);
  const fila = filas?.find((f) => f.clave === actual.id);
  const editado = !!fila && Object.keys(fila.valor ?? {}).length > 0;

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Contenido de la web</h1>
          <p className="admMuted">Textos, marca y datos de contacto. Al guardar, el cambio se ve en la web al instante.</p>
        </div>
      </header>

      {error && <p className="admError">No se pudo leer el contenido: {error.message}</p>}

      <nav className="admTabs admTabsWrap" aria-label="Secciones">
        {SECCIONES.map((x) => (
          <Link key={x.id} href={`/admin/contenido?s=${x.id}`} className="admTabBtn" aria-current={x.id === actual.id ? "page" : undefined}>{x.titulo}</Link>
        ))}
      </nav>

      <section className="admCard">
        <div className="admCardHead">
          <div>
            <h2>{actual.titulo}</h2>
            <p className="admMuted admSmall">{actual.donde}</p>
          </div>
          <a className="admLinkMuted" href={actual.ver} target="_blank" rel="noreferrer">Ver en la web ↗</a>
        </div>
        <EditorSeccion
          key={`${actual.id}-${fila?.updated_at ?? ""}`}
          seccion={actual.id}
          campos={actual.campos}
          valor={contenido[actual.id] as Record<string, unknown>}
          canastas={productos ?? []}
          editado={editado}
        />
      </section>
    </>
  );
}
