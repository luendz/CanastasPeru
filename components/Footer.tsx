import Link from "next/link";
import Icono from "@/components/Icono";
import Reveal from "@/components/motion/Reveal";
import type { Contenido } from "@/lib/contenido";
import { LINEAS } from "@/lib/lineas";
import { enlaceWhatsApp } from "@/lib/whatsapp";

type FooterProps = { marca: Contenido["marca"]; contacto: Contenido["contacto"]; pie: Contenido["pie"] };

const REDES = [
  { clave: "instagram", nombre: "Instagram", d: "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 7h.01" },
  { clave: "tiktok", nombre: "TikTok", d: "M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.5 2.2 4 5 4" },
  { clave: "facebook", nombre: "Facebook", d: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8Z" },
] as const;

export default function Footer({ marca, contacto, pie }: FooterProps) {
  const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
  return (
    <footer className="footer">
      <div className="textileBand" aria-hidden="true" />
      <Reveal className="shell footerGrid" threshold={0.15}>
        <div className="footerAbout" data-reveal-item style={i(0)}>
          <img className="footerLogo" src={marca.logo} alt={`Logo de ${marca.nombre} · ${marca.lema}`} width={900} height={900} />
          <div>
            <p>{pie.texto}</p>
            <div className="footerRedes">
              {REDES.filter((r) => contacto[r.clave]).map((r) => (
                <a key={r.clave} href={contacto[r.clave]} target="_blank" rel="noopener noreferrer" aria-label={r.nombre}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={r.d} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div data-reveal-item style={i(1)}>
          <h4>Categorías</h4>
          {LINEAS.map((l) => <Link key={l.id} href={l.id === "boxes" ? "/boxes" : `/canastas/${l.id}`}>{l.titulo}</Link>)}
        </div>
        <div data-reveal-item style={i(2)}>
          <h4>Información</h4>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/cotizacion">Empresas y cotizaciones</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/carrito">Tu carrito</Link>
        </div>
        <div data-reveal-item style={i(3)}>
          <h4>Contacto</h4>
          <p className="footerDato"><Icono nombre="ubicacion" />{contacto.ciudad}</p>
          <a className="footerDato" href={`mailto:${contacto.correo}`}><Icono nombre="correo" />{contacto.correo}</a>
          {contacto.telefono && <a className="footerDato" href={enlaceWhatsApp(contacto.telefono)} target="_blank" rel="noopener noreferrer"><Icono nombre="chat" />{contacto.telefono}</a>}
        </div>
      </Reveal>
      <div className="shell footerBottom">{pie.derechos}</div>
    </footer>
  );
}
