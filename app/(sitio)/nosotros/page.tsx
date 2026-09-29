import Link from "next/link";
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
          <p>{t.texto}</p>
        </div>
      </section>

      <section className="shell section nosotrosGrid">
        <div className="nosotrosImg">
          {t.imagen ? <img src={t.imagen} alt="" /> : <div className="hmVacio hmVacioGrande">Espacio para una foto del equipo o del taller<small>Súbela en Panel → Contenido web → Nosotros</small></div>}
        </div>
        <div className="nosotrosTexto">
          {t.historia.split(/\n+/).map((p, n) => <p key={n}>{p}</p>)}
          <Link className="btn btnPrimary" href="/canastas">Ver canastas <Icono nombre="flecha" /></Link>
        </div>
      </section>

      {t.valores.length > 0 && (
        <section className="shell">
          <Reveal as="ul" className="hmPorQue nosotrosValores" threshold={0.15}>
            {t.valores.map((v, n) => (
              <li key={n} data-reveal-item style={{ "--i": n } as React.CSSProperties}>
                <span className="hmIconoCirculo"><Icono nombre={(["estrella", "lazo", "camion", "persona"] as const)[n % 4]} /></span>
                <h3>{v.titulo}</h3>
                <p>{v.texto}</p>
              </li>
            ))}
          </Reveal>
        </section>
      )}
    </>
  );
}
