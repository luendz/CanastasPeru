import AdornoNavidad from "@/components/AdornoNavidad";
import Icono from "@/components/Icono";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Nosotros" };

export default async function NosotrosPage() {
  const { nosotros: t } = await getContenido();
  return (
    <>
      <section className="catalogHero">
        <div className="shell catalogHeroInner">
          <div>
            <span className="eyebrow">{t.etiqueta}</span>
            <h1><SplitWords text={t.titulo} immediate /></h1>
          </div>
          {/* Varios párrafos: se separan con una línea en blanco. */}
          <div className="nosotrosIntro">{t.texto.split(/\n+/).map((p, n) => <p key={n}>{p}</p>)}</div>
        </div>
      </section>

      <section className="shell section nosotrosGrid">
        <div className="nosotrosImg">
          {t.imagen ? <img src={t.imagen} alt="" /> : <div className="hmVacio hmVacioGrande">Espacio para una foto del equipo o del taller<small>Súbela en Panel → Contenido web → Nosotros</small></div>}
        </div>
        <div className="nosotrosTexto">
          <span className="nosotrosEstrella nosotrosEstrella1" aria-hidden="true">★</span>
          <span className="nosotrosEstrella nosotrosEstrella2" aria-hidden="true">★</span>
          {t.historia.split(/\n+/).map((p, n) => <p key={n}>{p}</p>)}
          {t.lema && <><span className="nosotrosRaya" aria-hidden="true" /><p className="nosotrosLema">{t.lema}</p></>}
          <AdornoNavidad className="nosotrosRama" estrella={false} />
        </div>
      </section>

      {t.valores.length > 0 && (
        <section className="shell">
          <Reveal as="ul" className="nosotrosValores" threshold={0.15}>
            {t.valores.map((v, n) => (
              <li key={n} data-reveal-item style={{ "--i": n } as React.CSSProperties}>
                <span className="nosotrosIcono"><Icono nombre={(["equipo", "diana", "ojo", "estrella"] as const)[n % 4]} /></span>
                <h3>{v.titulo}</h3>
                {/* Con varios párrafos, el primero se destaca como subtítulo; el texto de uno solo va en cursiva. */}
                {(() => {
                  const partes = v.texto.split(/\n+/);
                  const [primero, ...resto] = partes;
                  return resto.length ? (
                    <>
                      <p className="nosotrosSubtitulo">{primero}</p>
                      <span className="nosotrosRaya" aria-hidden="true" />
                      {resto.map((p, k) => <p key={k}>{p}</p>)}
                    </>
                  ) : (
                    <>
                      <span className="nosotrosRaya" aria-hidden="true" />
                      <p className="nosotrosCursiva">{primero}</p>
                    </>
                  );
                })()}
                <AdornoNavidad className="nosotrosAdorno" />
              </li>
            ))}
          </Reveal>
        </section>
      )}
    </>
  );
}
