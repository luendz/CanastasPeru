import Link from "next/link";
import Enfasis from "@/components/Enfasis";
import HeroArt from "@/components/HeroArt";
import Icono, { type NombreIcono } from "@/components/Icono";
import ProductComposition from "@/components/ProductComposition";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { LINEAS, productosDe } from "@/lib/lineas";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

const ICONOS_HERO: NombreIcono[] = ["camion", "ubicacion", "regalo"];
const ICONOS_POR_QUE: NombreIcono[] = ["regalo", "lazo", "grafico", "persona"];
const ICONOS_LINEA: NombreIcono[] = ["regalo", "diamante", "maletin", "caja"];
const ICONOS_COMPRA: NombreIcono[] = ["carrito", "documento", "tarjeta", "camion"];
const ICONOS_CORP: NombreIcono[] = ["caja", "grafico", "lazo", "camion", "persona"];

/** Separador de título con líneas a los lados, como en la referencia. */
function TituloCentrado({ etiqueta, titulo }: { etiqueta?: string; titulo: string }) {
  return (
    <div className="hmTitulo">
      {etiqueta && <span className="hmEtiqueta">{etiqueta}</span>}
      <h2><Enfasis text={titulo} /></h2>
    </div>
  );
}

export default async function HomePage() {
  const [{ products, basketTypes }, { portada: t, catalogo, contacto }] = await Promise.all([getCatalogo(), getContenido()]);
  const destacada = products.find((p) => p.slug === t.canastaDestacada) ?? products[0];
  const desde = products.length ? Math.min(...products.map((p) => p.price)) : 0;

  return (
    <>
      {/* a) Banner principal */}
      <section className="hmHero">
        <div className="shell hmHeroGrid">
          <div className="hmHeroCopy">
            <span className="hmEtiqueta">{t.heroEtiqueta}</span>
            <h1><SplitWords text={t.heroTitulo} immediate /></h1>
            <p>{t.heroTexto}</p>
            <div className="hmBotones">
              <Link className="btn btnPrimary" href="/canastas">{t.heroBoton1} <Icono nombre="flecha" /></Link>
              <Link className="btn btnGhost hmBtnContorno" href="/boxes">{t.heroBoton2} <Icono nombre="flecha" /></Link>
            </div>
            <ul className="hmPuntos">
              {t.heroPuntos.map((p, n) => <li key={n}><Icono nombre={ICONOS_HERO[n % ICONOS_HERO.length]} />{p}</li>)}
            </ul>
          </div>
          <div className="hmHeroArte">
            {t.heroImagen ? <img className="hmHeroImg" src={t.heroImagen} alt="" /> : destacada && <HeroArt product={destacada} fromPrice={desde} />}
          </div>
        </div>
      </section>

      {/* b) ¿Por qué elegir MKA? */}
      <section className="hmSeccion shell">
        <TituloCentrado titulo={t.porQueTitulo} />
        <Reveal as="ul" className="hmPorQue" threshold={0.15}>
          {t.porQue.map((x, n) => (
            <li key={n} data-reveal-item style={i(n)}>
              <span className="hmIconoCirculo"><Icono nombre={ICONOS_POR_QUE[n % ICONOS_POR_QUE.length]} /></span>
              <h3>{x.titulo}</h3>
              <p>{x.texto}</p>
            </li>
          ))}
        </Reveal>
      </section>

      {/* c) Tipos de canasta */}
      <section className="hmSeccion shell">
        <TituloCentrado etiqueta={t.tiposEtiqueta} titulo={t.tiposTitulo} />
        <Reveal className="hmTipos" threshold={0.1}>
          {LINEAS.map((l, n) => {
            const texto = catalogo.lineas[n] ?? { titulo: l.titulo, texto: "", imagen: "" };
            const muestra = productosDe(products, l.id)[0];
            const href = l.id === "boxes" ? "/boxes" : `/canastas/${l.id}`;
            return (
              <article key={l.id} className="hmTipo" data-reveal-item style={i(n)}>
                <Link href={href} className="hmTipoImg" tabIndex={-1} aria-hidden="true">
                  {texto.imagen ? <img src={texto.imagen} alt="" /> : muestra ? <ProductComposition product={muestra} baseImage={basketTypes.find((b) => b.id === muestra.baseType)?.image} /> : <span className="hmVacio">Imagen pendiente</span>}
                </Link>
                <div className="hmTipoCuerpo">
                  <h3><Icono nombre={ICONOS_LINEA[n]} />{texto.titulo}</h3>
                  <p>{texto.texto}</p>
                  <Link className="btn hmBtnPino" href={href}>{l.id === "boxes" ? "Ver boxes" : "Ver canastas"} <Icono nombre="flecha" /></Link>
                </div>
              </article>
            );
          })}
        </Reveal>
      </section>

      {/* d) Cómo comprar */}
      <section className="hmSeccion shell">
        <TituloCentrado titulo={t.comprarTitulo} />
        <Reveal as="ol" className="hmPasos" threshold={0.15}>
          {t.comprarPasos.map((p, n) => (
            <li key={n} data-reveal-item style={i(n)}>
              <span className="hmPasoNum">{n + 1}</span>
              <Icono nombre={ICONOS_COMPRA[n % ICONOS_COMPRA.length]} className="hmPasoIcono" />
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </Reveal>
      </section>

      {/* e) Banner para solicitar una cotización */}
      <section className="hmCorp">
        <div className="shell hmCorpGrid">
          <Reveal className="hmCorpCopy">
            <span className="hmEtiqueta" data-reveal-item style={i(0)}>{t.corpEtiqueta}</span>
            <h2><SplitWords text={t.corpTitulo} /></h2>
            <p data-reveal-item style={i(3)}>{t.corpTexto}</p>
            <ul className="hmCorpPuntos">
              {t.corpPuntos.map((p, n) => <li key={n}><Icono nombre={ICONOS_CORP[n % ICONOS_CORP.length]} />{p}</li>)}
            </ul>
            <Link className="btn btnPrimary" data-reveal-item style={i(5)} href="/cotizacion">{t.corpBoton} <Icono nombre="flecha" /></Link>
          </Reveal>
          <div className="hmCorpArte">
            {t.corpImagen ? <img src={t.corpImagen} alt="" /> : <div className="hmVacio hmVacioGrande">Espacio para la foto de boxes corporativos<small>Súbela en Panel → Contenido web → Portada</small></div>}
          </div>
        </div>
      </section>

      {/* f) Marcas que forman parte de nuestras canastas */}
      <section className="hmSeccion shell hmMarcasSeccion">
        <div className="hmTitulo">
          <h2 className="hmMarcasTitulo">{t.marcasTitulo}</h2>
          <p className="hmSub">{t.marcasTexto}</p>
        </div>
        <ul className="hmMarcas">
          {t.marcas.map((m, n) => (
            <li key={`${m.nombre}-${n}`}>{m.imagen ? <img src={m.imagen} alt={m.nombre} /> : <span>{m.nombre}</span>}</li>
          ))}
        </ul>
      </section>

      {/* g) Canales de atención */}
      <section className="shell">
        <div className="hmCanales">
          <div>
            <h2>{t.canalesTitulo}</h2>
            <p>{t.canalesTexto}</p>
          </div>
          <div className="hmBotones">
            <Link className="btn btnPrimary" href="/canastas">{t.canalesBoton} <Icono nombre="flecha" /></Link>
            {contacto.telefono && (
              <a className="btn hmBtnClaro" href={enlaceWhatsApp(contacto.telefono)} target="_blank" rel="noopener noreferrer"><Icono nombre="chat" /> {t.canalesWhatsapp}</a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
