"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Brand from "@/components/Brand";
import { unidades, useCarrito } from "@/lib/carrito";
import type { Contenido } from "@/lib/contenido";
import { LINEAS } from "@/lib/lineas";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/canastas", label: "Canastas", sub: LINEAS.filter((l) => l.id !== "boxes") },
  { href: "/boxes", label: "Boxes navideños" },
  { href: "/cotizacion", label: "Empresas" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header({ marca, anuncios, contacto }: { marca: Contenido["marca"]; anuncios: Contenido["anuncios"]; contacto: Contenido["contacto"] }) {
  const pathname = usePathname();
  const c = useCarrito();
  const count = unidades(c);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(0);
  const [menu, setMenu] = useState(false);

  // Se esconde al bajar, vuelve al subir y toma sombra apenas hay scroll.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        setHidden((h) => (y > 260 && y > last + 4 ? true : y < last - 4 ? false : h));
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Al agregar una canasta el contador salta y el header reaparece.
  useEffect(() => {
    const onAdd = () => {
      setBump((b) => b + 1);
      setHidden(false);
    };
    window.addEventListener("mka:cart-add", onAdd);
    return () => window.removeEventListener("mka:cart-add", onAdd);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  const activo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/canastas" && pathname.startsWith("/catalogo")));

  return (
    <>
      <div className="topbar">
        {anuncios.mensajes.map((m, i) => <span key={i} className={i > 0 ? "topbarHide" : undefined}>✦ {m}</span>)}
      </div>
      <div className="headerSticky" data-hidden={hidden || undefined} data-scrolled={scrolled || undefined}>
        <div className="headerWrap">
          <header className="header shell">
            <Brand marca={marca} />
            <nav className="nav" aria-label="Principal">
              {links.map((l) =>
                l.sub ? (
                  <div className="navGroup" key={l.href}>
                    <Link href={l.href} aria-current={activo(l.href) ? "page" : undefined}>{l.label} <span aria-hidden="true">▾</span></Link>
                    <div className="navMenu">
                      {l.sub.map((s) => <Link key={s.id} href={`/canastas/${s.id}`}>{s.titulo}</Link>)}
                      <Link href="/canastas">Ver todas las canastas</Link>
                    </div>
                  </div>
                ) : (
                  <Link key={l.href} href={l.href} aria-current={activo(l.href) ? "page" : undefined}>{l.label}</Link>
                ),
              )}
            </nav>
            <div className="headerActions">
              <Link className="cartBtn" href="/carrito" aria-label={`Carrito, ${count} ${count === 1 ? "canasta" : "canastas"}`} data-bump={bump % 2 ? "a" : bump ? "b" : undefined}>
                Carrito {count > 0 && <span key={bump}>{count}</span>}
              </Link>
              {contacto.telefono && (
                <a className="waBtn" href={enlaceWhatsApp(contacto.telefono)} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm4.6 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5-.3.4c-.1.1-.2.3-.1.5.2.3.7 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.2.1.4.1.5 0l.8-.9c.2-.2.3-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z" /></svg>
                  <span>WhatsApp</span>
                </a>
              )}
              <button type="button" className="menuBtn" aria-expanded={menu} aria-controls="menuMovil" onClick={() => setMenu((m) => !m)}>
                <span className="srOnly">Menú</span>
                <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
              </button>
            </div>
          </header>
          {menu && (
            <nav id="menuMovil" className="menuMovil shell" aria-label="Menú">
              {links.map((l) => (
                <div key={l.href}>
                  <Link href={l.href} aria-current={activo(l.href) ? "page" : undefined}>{l.label}</Link>
                  {l.sub && <div className="menuMovilSub">{l.sub.map((s) => <Link key={s.id} href={`/canastas/${s.id}`}>{s.titulo}</Link>)}</div>}
                </div>
              ))}
            </nav>
          )}
        </div>
        <div className="textileBand" aria-hidden="true" />
      </div>
    </>
  );
}
