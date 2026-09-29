import Brand from "@/components/Brand";
import Icono, { type NombreIcono } from "@/components/Icono";
import QuoteForm from "@/components/QuoteForm";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Cotización para empresas" };

const ICONOS_LADO: NombreIcono[] = ["regalo", "camion", "estrella"];
const ICONOS_PASO: NombreIcono[] = ["documento", "documento", "camion"];

export default async function CotizacionPage() {
  const [{ deliveryZones }, { cotizacion: t, catalogo, marca }] = await Promise.all([getCatalogo(), getContenido()]);
  return (
    <section className="cotPagina">
      <div className="shell cotLayout">
        <aside className="cotLado">
          <Brand marca={marca} />
          <p className="cotLadoTitulo">{t.ladoTitulo}</p>
          <ul>
            {t.ladoPuntos.map((p, n) => <li key={n}><span><Icono nombre={ICONOS_LADO[n % ICONOS_LADO.length]} /></span>{p}</li>)}
          </ul>
          <div className="cotLadoImg">
            {t.ladoImagen ? <img src={t.ladoImagen} alt="" /> : <span className="cotLadoFallback" aria-hidden="true">✦</span>}
          </div>
          <p className="cotLadoFrase">{t.ladoFrase}</p>
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
          <QuoteForm opciones={t} lineas={catalogo.lineas} distritos={deliveryZones.map((z) => z.district)} />
        </div>
      </div>
    </section>
  );
}
