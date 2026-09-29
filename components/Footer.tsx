import Link from "next/link";
import Icono from "@/components/Icono";
import Suscripcion from "@/components/Suscripcion";
import type { Contenido } from "@/lib/contenido";
import { LINEAS } from "@/lib/lineas";
import { enlaceWhatsApp } from "@/lib/whatsapp";

type FooterProps = { marca: Contenido["marca"]; contacto: Contenido["contacto"]; pie: Contenido["pie"] };

const REDES = [
  { clave: "instagram", nombre: "Instagram", d: "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 7h.01" },
  { clave: "tiktok", nombre: "TikTok", d: "M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.5 2.2 4 5 4" },
  { clave: "facebook", nombre: "Facebook", d: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8Z" },
] as const;

/** Pie de página claro, como la referencia: logo, categorías, información, contacto y suscripción. */
export default function Footer({ marca, contacto, pie }: FooterProps) {
  const redes = REDES.filter((r) => contacto[r.clave]);
  return (
    <footer className="footer2">
      <div className="shell footer2Grid">
        <Link href="/" className="footer2Logo" aria-label={`${marca.nombre}, inicio`}>
          <img src={marca.logo} alt={`Logo de ${marca.nombre} · ${marca.lema}`} width={900} height={900} />
        </Link>
        <nav aria-label="Categorías">
          <h4>Categorías</h4>
          {LINEAS.map((l) => <Link key={l.id} href={l.id === "boxes" ? "/boxes" : `/canastas/${l.id}`}>{l.titulo.charAt(0).toUpperCase() + l.titulo.slice(1).replace(/ (\p{Ll})/gu, (_, c: string) => ` ${c.toUpperCase()}`)}</Link>)}
        </nav>
        <nav aria-label="Información">
          <h4>Información</h4>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/privacidad">Política de privacidad</Link>
        </nav>
        <div>
          <h4>Contacto</h4>
          <p className="footer2Dato"><Icono nombre="ubicacion" />{contacto.ciudad}</p>
          <a className="footer2Dato" href={`mailto:${contacto.correo}`}><Icono nombre="correo" />{contacto.correo}</a>
          {contacto.telefono && <a className="footer2Dato" href={enlaceWhatsApp(contacto.telefono)} target="_blank" rel="noopener noreferrer"><Icono nombre="chat" />{contacto.telefono}</a>}
          {redes.length > 0 && (
            <div className="footer2Redes">
              {redes.map((r) => (
                <a key={r.clave} href={contacto[r.clave]} target="_blank" rel="noopener noreferrer" aria-label={r.nombre}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={r.d} /></svg>
                </a>
              ))}
            </div>
          )}
        </div>
        <Suscripcion titulo={pie.suscribirTitulo} />
      </div>
      <div className="shell footer2Bottom">{pie.derechos}</div>
    </footer>
  );
}
