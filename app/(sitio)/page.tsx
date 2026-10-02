import Link from "next/link";
import CarruselMarcas from "@/components/CarruselMarcas";
import Enfasis from "@/components/Enfasis";
import HeroArt from "@/components/HeroArt";
import HeroBanner from "@/components/HeroBanner";
import Icono, { type NombreIcono } from "@/components/Icono";
import ProductComposition from "@/components/ProductComposition";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { LINEAS, productosDe } from "@/lib/lineas";
import type { BasketType, Product } from "@/lib/mock-data";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

const ICONOS_HERO: NombreIcono[] = ["camion", "ubicacion", "regalo"];
const ICONOS_POR_QUE: NombreIcono[] = ["regalo", "lazo", "caja", "persona"];
const ICONOS_LINEA: NombreIcono[] = ["regalo", "diamante", "maletin", "caja"];
const ICONOS_COMPRA: NombreIcono[] = ["carrito", "documento", "tarjeta", "camion"];
const ICONOS_CORP: NombreIcono[] = ["caja", "grafico", "logo", "camion", "persona"];

/** Título centrado con líneas a los lados, en mayúsculas (como la referencia). */
function Titulo({ titulo, sub, etiqueta }: { titulo: string; sub?: string; etiqueta?: string }) {
  return (
    <div className="hmTitulo">
      {etiqueta && <span className="hmEtiqueta">{etiqueta}</span>}
      <h2><Enfasis text={titulo} /></h2>
      {sub && <p className="hmSub">{sub}</p>}
    </div>
  );
}

/** Canasta de muestra con su propio tipo de canasta. */
function Muestra({ producto, tipos }: { producto: Product; tipos: BasketType[] }) {
  return <ProductComposition product={producto} baseImage={tipos.find((b) => b.id === producto.baseType)?.image} />;
}

export default async function HomePage() {
  const [{ products, basketTypes }, { portada: t, catalogo, contacto }] = await Promise.all([getCatalogo(), getContenido()]);
  const destacada = products.find((p) => p.slug === t.canastaDestacada) ?? products[0];
  const desde = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const fondos = [t.heroImagen, ...t.heroFondos.map((f) => f.imagen)].filter(Boolean);

  return (
    <>
      {/* Banner principal */}
      <HeroBanner imagenes={fondos}>
        <div className="shell hbGrid">
          <div className="hbTexto">
            <h1><SplitWords text={t.heroTitulo} immediate /></h1>
            <p>{t.heroTexto}</p>
            <div className="hmBotones">
              <Link className="btn btnPrimary hmBtnMayus" href="/canastas">{t.heroBoton1} <Icono nombre="flecha" /></Link>
              <Link className="btn hmBtnBlanco hmBtnMayus" href="/boxes">{t.heroBoton2} <Icono nombre="flecha" /></Link>
            </div>
            <ul className="hmPuntos">
              {t.heroPuntos.map((p, n) => <li key={n}><Icono nombre={ICONOS_HERO[n % ICONOS_HERO.length]} />{p}</li>)}
            </ul>
          </div>
          {fondos.length === 0 && destacada && (
            <div className="hbArte"><HeroArt product={destacada} fromPrice={desde} /></div>
          )}
        </div>
      </HeroBanner>

      {/* Pilares de MKA (sin título, pegados al banner) */}
      <section className="hmSeccion hmSeccionPilares shell">
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

      {/* Encuentra el regalo perfecto */}
      <section className="hmSeccion shell">
        <Titulo titulo={t.tiposEtiqueta} />
        <Reveal className="hmTipos" threshold={0.1}>
          {LINEAS.map((l, n) => {
            const texto = catalogo.lineas[n] ?? { titulo: l.titulo, texto: "", imagen: "" };
            const muestra = productosDe(products, l.id)[0];
            const href = l.id === "boxes" ? "/boxes" : `/canastas/${l.id}`;
            return (
              <article key={l.id} className="hmTipo" data-reveal-item style={i(n)}>
                <Link href={href} className="hmTipoImg" tabIndex={-1} aria-hidden="true">
                  {texto.imagen ? <img src={texto.imagen} alt="" /> : muestra ? <Muestra producto={muestra} tipos={basketTypes} /> : <span className="hmVacio">Imagen pendiente</span>}
                </Link>
                <div className="hmTipoCuerpo">
                  <h3><Icono nombre={ICONOS_LINEA[n]} /><span>{texto.titulo.split(" ")[0]}<br />{texto.titulo.split(" ").slice(1).join(" ")}</span></h3>
                  <p>{texto.texto}</p>
                  <Link className="btn hmBtnPino" href={href}>{l.id === "boxes" ? "Ver boxes" : "Ver canastas"} <Icono nombre="flecha" /></Link>
                </div>
              </article>
            );
          })}
        </Reveal>
      </section>

      {/* Compra en 4 simples pasos: cada paso en un círculo, primero el texto y luego el ícono */}
      <section className="hmSeccion shell">
        <Titulo titulo={t.comprarTitulo} />
        <Reveal as="ol" className="hmPasos hmPasosCirculos" threshold={0.15}>
          {t.comprarPasos.map((p, n) => (
            <li key={n} data-reveal-item style={i(n)}>
              <div className="hmPasoCirculo">
                <span className="hmPasoNum">{n + 1}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
                <Icono nombre={ICONOS_COMPRA[n % ICONOS_COMPRA.length]} className="hmPasoIcono" />
              </div>
            </li>
          ))}
        </Reveal>
      </section>

      {/* Navidad para tu empresa: con imagen, banner a todo el ancho y texto a la izquierda */}
      {t.corpImagen ? (
        <section className="hmCorp3" style={{ backgroundImage: `url("${t.corpImagen}")` }}>
          <div className="shell">
            <Reveal className="hmCorp3Texto">
              <span className="hmEtiqueta" data-reveal-item style={i(0)}>{t.corpEtiqueta}</span>
              <h2><SplitWords text={t.corpTitulo} /></h2>
              <p data-reveal-item style={i(3)}>{t.corpTexto}</p>
              <ul className="hmCorpPuntos">
                {t.corpPuntos.map((p, n) => <li key={n}><Icono nombre={ICONOS_CORP[n % ICONOS_CORP.length]} />{p}</li>)}
              </ul>
              <Link className="btn hmBtnMayus hmBtnPildora hmBtnRojo" data-reveal-item style={i(5)} href="/cotizacion">{t.corpBoton} <Icono nombre="flecha" /></Link>
            </Reveal>
          </div>
        </section>
      ) : (
        <section className="hmCorp2">
          <div className="hmCorp2Img">
            <div className="hmVacio hmVacioGrande">Espacio para la foto de boxes corporativos<small>Súbela en Panel → Contenido web → Portada</small></div>
          </div>
          <Reveal className="hmCorp2Texto">
            <h2><SplitWords text={t.corpTitulo} /></h2>
            <p data-reveal-item style={i(3)}>{t.corpTexto}</p>
            <ul className="hmCorpPuntos">
              {t.corpPuntos.map((p, n) => <li key={n}><Icono nombre={ICONOS_CORP[n % ICONOS_CORP.length]} />{p}</li>)}
            </ul>
            <Link className="btn btnPrimary hmBtnMayus" data-reveal-item style={i(5)} href="/cotizacion">{t.corpBoton} <Icono nombre="flecha" /></Link>
          </Reveal>
        </section>
      )}

      {/* Marcas que forman parte de nuestras canastas */}
      {t.marcas.length > 0 && (
        <section className="hmSeccion shell hmMarcasSeccion">
          <div className="hmTitulo hmTituloMarcas">
            <h2>{t.marcasTitulo}</h2>
            <p className="hmSub">{t.marcasTexto}</p>
          </div>
          <CarruselMarcas marcas={t.marcas} />
        </section>
      )}

      {/* Canales de atención */}
      <section className="hmCanales2" data-con-imagen={t.canalesImagen ? true : undefined} style={t.canalesImagen ? { backgroundImage: `url("${t.canalesImagen}")` } : undefined}>
        <div className="shell hmCanales2Grid">
          <div>
            <h2>{t.canalesTitulo}</h2>
            <p>{t.canalesTexto}</p>
          </div>
          <div className="hmBotones">
            <Link className="btn hmBtnMayus hmBtnPildora hmBtnRojo" href="/canastas">{t.canalesBoton} <Icono nombre="flecha" /></Link>
            {contacto.telefono && (
              <a className="btn hmBtnClaro hmBtnMayus hmBtnPildora" href={enlaceWhatsApp(contacto.telefono)} target="_blank" rel="noopener noreferrer"><svg className="icono hmIconoWa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9.2 7.8c.2-.3.4-.3.6-.3h.4c.2 0 .3 0 .5.4l.7 1.7c0 .2 0 .3-.1.4l-.4.5c-.1.1-.2.3 0 .5.5.9 1.3 1.7 2.3 2.2.2.1.3.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.3 0 .5-.2 1-.6 1.3-.4.3-1 .5-1.6.4-2.9-.6-5.2-3-5.6-5.8-.1-.6.1-1.2.4-1.6Z" fill="currentColor" /></svg>{t.canalesWhatsapp} <Icono nombre="flecha" /></a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
