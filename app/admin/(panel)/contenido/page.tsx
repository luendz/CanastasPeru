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
    id: "anuncios", titulo: "Barra de anuncios", donde: "La franja superior en todas las páginas.", ver: "/",
    campos: [{ tipo: "lineas", clave: "mensajes", etiqueta: "Mensajes" }],
  },
  {
    id: "portada", titulo: "Portada", donde: "La página de inicio.", ver: "/",
    campos: [
      { tipo: "texto", clave: "etiqueta", etiqueta: "Etiqueta superior" },
      { tipo: "canasta", clave: "canastaDestacada", etiqueta: "Canasta de la portada", ayuda: "La que aparece en grande junto al título." },
      { tipo: "texto", clave: "titulo", etiqueta: "Título", ayuda: ENFASIS, largo: true },
      { tipo: "texto", clave: "texto", etiqueta: "Texto", largo: true },
      { tipo: "texto", clave: "botonPrincipal", etiqueta: "Botón principal" },
      { tipo: "texto", clave: "botonSecundario", etiqueta: "Botón secundario" },
      { tipo: "filas", clave: "cifras", etiqueta: "Cifras", ayuda: "Si el valor tiene números, se animan al aparecer.", columnas: [{ clave: "valor", etiqueta: "Valor" }, { clave: "texto", etiqueta: "Texto", largo: true }] },
      { tipo: "lineas", clave: "cinta", etiqueta: "Cinta de productos (texto que se desliza)" },
      { tipo: "texto", clave: "destacadosEtiqueta", etiqueta: "Destacados: etiqueta" },
      { tipo: "texto", clave: "destacadosTitulo", etiqueta: "Destacados: título", ayuda: ENFASIS },
      { tipo: "texto", clave: "pasosEtiqueta", etiqueta: "Cómo funciona: etiqueta" },
      { tipo: "texto", clave: "pasosTitulo", etiqueta: "Cómo funciona: título", ayuda: ENFASIS },
      { tipo: "filas", clave: "pasos", etiqueta: "Cómo funciona: pasos", columnas: PASOS },
      { tipo: "texto", clave: "empresasEtiqueta", etiqueta: "Empresas: etiqueta" },
      { tipo: "texto", clave: "empresasTitulo", etiqueta: "Empresas: título", ayuda: ENFASIS },
      { tipo: "texto", clave: "empresasTexto", etiqueta: "Empresas: texto", largo: true },
      { tipo: "texto", clave: "empresasBoton", etiqueta: "Empresas: botón" },
    ],
  },
  {
    id: "catalogo", titulo: "Catálogo", donde: "Encabezado y llamado final de la página Catálogo.", ver: "/catalogo",
    campos: [
      { tipo: "texto", clave: "etiqueta", etiqueta: "Etiqueta" },
      { tipo: "texto", clave: "titulo", etiqueta: "Título", ayuda: ENFASIS },
      { tipo: "texto", clave: "texto", etiqueta: "Texto", largo: true },
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
    id: "contacto", titulo: "Contacto", donde: "Datos del pie de página y de la página de cotización.", ver: "/cotizacion",
    campos: [
      { tipo: "texto", clave: "telefono", etiqueta: "Teléfono / WhatsApp" },
      { tipo: "texto", clave: "correo", etiqueta: "Correo" },
      { tipo: "texto", clave: "ciudad", etiqueta: "Ciudad" },
    ],
  },
  {
    id: "checkout", titulo: "Pago y entrega", donde: "Horarios de entrega y métodos de pago del checkout.", ver: "/checkout",
    campos: [
      { tipo: "filas", clave: "horarios", etiqueta: "Horarios de entrega", columnas: [{ clave: "nombre", etiqueta: "Nombre" }, { clave: "rango", etiqueta: "Horario" }] },
      { tipo: "filas", clave: "metodosPago", etiqueta: "Métodos de pago", columnas: [{ clave: "nombre", etiqueta: "Nombre" }, { clave: "detalle", etiqueta: "Detalle" }, { clave: "nota", etiqueta: "Nota al elegirlo", largo: true }] },
      { tipo: "texto", clave: "notaImpuestos", etiqueta: "Nota de impuestos", ayuda: "Aparece bajo los totales del carrito y el checkout." },
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
    ],
  },
  {
    id: "pie", titulo: "Pie de página", donde: "Texto y derechos al final de todas las páginas.", ver: "/",
    campos: [
      { tipo: "texto", clave: "texto", etiqueta: "Texto", largo: true },
      { tipo: "texto", clave: "derechos", etiqueta: "Derechos" },
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
