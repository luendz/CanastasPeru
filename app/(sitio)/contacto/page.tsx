import Link from "next/link";
import Icono from "@/components/Icono";
import SplitWords from "@/components/motion/SplitWords";
import { getContenido } from "@/lib/contenido";
import { enlaceWhatsApp } from "@/lib/whatsapp";

export const metadata = { title: "Contacto" };

export default async function ContactoPage() {
  const { contacto } = await getContenido();
  const canales = [
    contacto.telefono && { icono: "chat" as const, titulo: "WhatsApp", texto: contacto.telefono, href: enlaceWhatsApp(contacto.telefono), accion: "Escribir por WhatsApp" },
    contacto.correo && { icono: "correo" as const, titulo: "Correo", texto: contacto.correo, href: `mailto:${contacto.correo}`, accion: "Enviar un correo" },
    { icono: "documento" as const, titulo: "Cotización para empresas", texto: "Pedidos por volumen con tu marca", href: "/cotizacion", accion: "Solicitar cotización" },
  ].filter(Boolean) as { icono: "chat" | "correo" | "documento"; titulo: string; texto: string; href: string; accion: string }[];

  return (
    <>
      <section className="catalogHero">
        <div className="shell catalogHeroInner">
          <div>
            <span className="eyebrow">Contacto</span>
            <h1><SplitWords text="Estamos para *ayudarte*" immediate /></h1>
          </div>
          <p>Escríbenos por el canal que prefieras y te ayudamos a elegir la canasta o el box ideal.{contacto.horario ? ` Atendemos ${contacto.horario.charAt(0).toLowerCase()}${contacto.horario.slice(1)}.` : ""}</p>
        </div>
      </section>

      <section className="shell section contactoGrid">
        {canales.map((c) => (
          <article key={c.titulo} className="contactoCard">
            <span className="hmIconoCirculo"><Icono nombre={c.icono} /></span>
            <h3>{c.titulo}</h3>
            <p>{c.texto}</p>
            {c.href.startsWith("/") ? (
              <Link className="btn btnPrimary" href={c.href}>{c.accion}</Link>
            ) : (
              <a className="btn btnPrimary" href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{c.accion}</a>
            )}
          </article>
        ))}
        <article className="contactoCard">
          <span className="hmIconoCirculo"><Icono nombre="ubicacion" /></span>
          <h3>Dónde estamos</h3>
          <p>{contacto.ciudad}</p>
          <p className="muted">Entregas programadas en Lima y envíos a provincias.</p>
        </article>
      </section>
    </>
  );
}
