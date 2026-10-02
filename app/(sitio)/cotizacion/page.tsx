import Brand from "@/components/Brand";
import Icono, { type NombreIcono } from "@/components/Icono";
import QuoteForm from "@/components/QuoteForm";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { fechasReparto } from "@/lib/entrega";

export const metadata = { title: "Cotización para empresas" };

const ICONOS_LADO: NombreIcono[] = ["regalo", "camion", "estrella"];

/** Ícono según lo que dice cada punto (los textos se editan en el panel). */
function iconoLado(texto: string, n: number): NombreIcono {
  const t = texto.toLowerCase();
  if (t.includes("presupuesto") || t.includes("precio")) return "grafico";
  if (t.includes("atención") || t.includes("atencion") || t.includes("asesor")) return "persona";
  if (t.includes("personaliz") || t.includes("logo") || t.includes("marca")) return "logo";
  if (t.includes("propuesta") || t.includes("medida") || t.includes("cotiza")) return "documento";
  if (t.includes("entrega") || t.includes("envío") || t.includes("delivery")) return "camion";
  if (t.includes("calidad") || t.includes("producto")) return "regalo";
  return ICONOS_LADO[n % ICONOS_LADO.length];
}
const ICONOS_PASO: NombreIcono[] = ["documento", "documento", "camion"];

export default async function CotizacionPage() {
  const [{ deliveryZones }, { cotizacion: t, catalogo, marca }] = await Promise.all([getCatalogo(), getContenido()]);
  return (
    <section className="cotPagina">
      <div className="shell cotLayout">
        <aside
          className={t.ladoImagen ? "cotLado cotLadoConFondo" : "cotLado"}
          style={t.ladoImagen ? { backgroundImage: `url("${t.ladoImagen}")` } : undefined}
        >
          <Brand marca={marca} />
          <p className="cotLadoTitulo">{t.ladoTitulo}</p>
          <ul>
            {t.ladoPuntos.map((p, n) => <li key={n}><span><Icono nombre={iconoLado(p, n)} /></span>{p}</li>)}
          </ul>
          {/* Con imagen, la frase va dentro de la imagen de fondo. */}
          {t.ladoImagen ? (
            <p className="srOnly">{t.ladoFrase}</p>
          ) : (
            <>
              <div className="cotLadoImg"><span className="cotLadoFallback" aria-hidden="true">✦</span></div>
              <p className="cotLadoFrase">{t.ladoFrase}</p>
            </>
          )}
        </aside>

        <div className="cotCuerpo">
          <header className="cotCabecera">
            <span className="hmEtiqueta">{t.etiqueta}</span>
            <h1><SplitWords text={t.titulo} immediate /></h1>
            <p>{t.texto}</p>
            <ol className="cotPasos">
              {t.pasos.map((s, n) => (
                <li key={n}>
                  <span className="cotNum">{String(n + 1).padStart(2, "0")}</span>
                  <Icono nombre={ICONOS_PASO[n % ICONOS_PASO.length]} className="cotPasoIcono" />
                  <div><strong>{s.titulo}</strong><small>{s.texto}</small></div>
                </li>
              ))}
            </ol>
          </header>
          <QuoteForm opciones={t} lineas={catalogo.lineas} distritos={deliveryZones.map((z) => z.district)} fechas={fechasReparto(40)} />
        </div>
      </div>
    </section>
  );
}
