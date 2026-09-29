import Link from "next/link";
import Enfasis from "@/components/Enfasis";
import HeroArt from "@/components/HeroArt";
import HeroBanner from "@/components/HeroBanner";
import Icono, { type NombreIcono } from "@/components/Icono";
import ProductComposition from "@/components/ProductComposition";
import Reveal from "@/components/motion/Reveal";
import SplitWords from "@/components/motion/SplitWords";
import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import { LINEAS, lineaDe, productosDe } from "@/lib/lineas";
import { formatPrice, type BasketType, type Product } from "@/lib/mock-data";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

const ICONOS_HERO: NombreIcono[] = ["camion", "ubicacion", "regalo"];
const ICONOS_POR_QUE: NombreIcono[] = ["regalo", "lazo", "caja", "persona"];
const ICONOS_LINEA: NombreIcono[] = ["regalo", "diamante", "maletin", "caja"];
const ICONOS_COMPRA: NombreIcono[] = ["carrito", "documento", "tarjeta", "camion"];
const ICONOS_CORP: NombreIcono[] = ["caja", "grafico", "logo", "camion", "persona"];

/** Título centrado con líneas a los lados, en mayúsculas (como la referencia). */
function Titulo({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div className="hmTitulo">
      <h2><Enfasis text={titulo} /></h2>
      {sub && <p className="hmSub">{sub}</p>}
    </div>
  );
}

/** Canasta de muestra con su propio tipo de canasta. */
function Muestra({ producto, tipos }: { producto: Product; tipos: BasketType[] }) {
  return <ProductComposition product={producto} baseImage={tipos.find((b) => b.id === producto.baseType)?.image} />;
}

/** Favoritos: la primera canasta visible de cada línea; si alguna falta, se completa con otras. */
function favoritos(products: Product[]) {
  const primeros = LINEAS.map((l) => productosDe(products, l.id)[0]).filter(Boolean) as Product[];
  const resto = products.filter((p) => !primeros.includes(p));
  return [...primeros, ...resto].slice(0, 4);
}

export default async function HomePage() {
  const [{ products, basketTypes }, { portada: t, catalogo, contacto }] = await Promise.all([getCatalogo(), getContenido()]);
  const destacada = products.find((p) => p.slug === t.canastaDestacada) ?? products[0];
  const desde = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const fondos = [t.heroImagen, ...t.heroFondos.map((f) => f.imagen)].filter(Boolean);
  const marcas = t.marcas.filter((m) => m.imagen);

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

      {/* ¿Qué estás buscando? */}
      <section className="hmSeccion shell">
        <Titulo titulo={t.tiposTitulo} sub={t.tiposEtiqueta} />
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
                  <h3><Icono nombre={ICONOS_LINEA[n]} />{texto.titulo}</h3>
                  <p>{texto.texto}</p>
                  <Link className="btn hmBtnPino" href={href}>{l.id === "boxes" ? "Ver boxes" : "Ver canastas"} <Icono nombre="flecha" /></Link>
                </div>
              </article>
            );
          })}
        </Reveal>
      </section>

      {/* Nuestros favoritos */}
      {products.length > 0 && (
        <section className="hmSeccion shell">
          <div className="hmFavHead">
            <Titulo titulo={t.favoritosTitulo} sub={t.favoritosTexto} />
            <Link className="hmVerTodo" href="/canastas">Ver todo el catálogo <Icono nombre="flecha" /></Link>
          </div>
          <Reveal className="hmFavoritos" threshold={0.1}>
            {favoritos(products).map((p, n) => {
              const linea = lineaDe(p);
              return (
                <article key={p.slug} className="hmFav" data-reveal-item style={i(n)}>
                  <Link href={`/producto/${p.slug}`} className="hmFavImg" tabIndex={-1} aria-hidden="true">
                    <Muestra producto={p} tipos={basketTypes} />
                    <span className="hmFavLinea">{linea?.id === "boxes" ? "Box" : linea?.categoria ?? p.category}</span>
                  </Link>
                  <div className="hmFavCuerpo">
                    <Link className="hmFavNombre" href={`/producto/${p.slug}`}>{p.name}</Link>
                    <div className="hmFavPie">
                      <strong>{formatPrice(p.price)}</strong>
                      <Link className="btn hmBtnDetalle" href={`/producto/${p.slug}`}>Ver detalle</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </Reveal>
        </section>
      )}

      {/* Navidad para tu empresa */}
      <section className="hmCorp2">
        <div className="hmCorp2Img">
          {t.corpImagen ? <img src={t.corpImagen} alt="" /> : <div className="hmVacio hmVacioGrande">Espacio para la foto de boxes corporativos<small>Súbela en Panel → Contenido web → Portada</small></div>}
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

      {/* ¿Por qué elegir MKA? */}
      <section className="hmSeccion shell">
        <Titulo titulo={t.porQueTitulo} />
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

      {/* ¿Cómo comprar? */}
      <section className="hmSeccion shell">
        <Titulo titulo={t.comprarTitulo} />
        <Reveal as="ol" className="hmPasos" threshold={0.15}>
          {t.comprarPasos.map((p, n) => (
            <li key={n} data-reveal-item style={i(n)}>
              <div className="hmPasoCabeza">
                <span className="hmPasoNum">{n + 1}</span>
                <Icono nombre={ICONOS_COMPRA[n % ICONOS_COMPRA.length]} className="hmPasoIcono" />
              </div>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </Reveal>
      </section>

      {/* Marcas: aparece cuando al menos una tiene logo */}
      {marcas.length > 0 && (
        <section className="hmSeccion shell">
          <Titulo titulo={t.marcasTitulo} sub={t.marcasTexto} />
          <ul className="hmMarcas">
            {marcas.map((m, n) => <li key={`${m.nombre}-${n}`}><img src={m.imagen} alt={m.nombre} /></li>)}
          </ul>
        </section>
      )}

      {/* Canales de atención */}
      <section className="hmCanales2">
        <div className="shell hmCanales2Grid">
          <div>
            <h2>{t.canalesTitulo}</h2>
            <p>{t.canalesTexto}</p>
          </div>
          <div className="hmBotones">
            <Link className="btn btnPrimary hmBtnMayus" href="/canastas">{t.canalesBoton} <Icono nombre="flecha" /></Link>
            {contacto.telefono && (
              <a className="btn hmBtnClaro hmBtnMayus" href={enlaceWhatsApp(contacto.telefono)} target="_blank" rel="noopener noreferrer">{t.canalesWhatsapp} <Icono nombre="flecha" /></a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
