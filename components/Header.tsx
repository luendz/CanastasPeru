"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Brand from "@/components/Brand";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/cotizacion", label: "Empresas" },
  { href: "/checkout", label: "Checkout" },
];

export default function Header() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [count, setCount] = useState(2);
  const [bump, setBump] = useState(0);

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

  // Prototipo: el detalle avisa cuando se agrega una canasta y el contador salta.
  useEffect(() => {
    const onAdd = (e: Event) => {
      const qty = (e as CustomEvent<{ qty: number }>).detail?.qty ?? 1;
      setCount((c) => c + qty);
      setBump((b) => b + 1);
      setHidden(false);
    };
    window.addEventListener("mka:cart-add", onAdd);
    return () => window.removeEventListener("mka:cart-add", onAdd);
  }, []);

  return (
    <>
      <div className="topbar">
        <span>✦ Envíos programados en Lima</span>
        <span className="topbarHide">✦ Atención a empresas</span>
        <span className="topbarHide">✦ Cotizaciones en 24 h</span>
      </div>
      <div className="headerSticky" data-hidden={hidden || undefined} data-scrolled={scrolled || undefined}>
        <div className="headerWrap">
          <header className="header shell">
            <Brand />
            <nav className="nav">
              {links.map((l) => {
                const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                return <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>{l.label}</Link>;
              })}
            </nav>
            <div className="headerActions">
              <button className="iconBtn" aria-label="Buscar">⌕</button>
              <Link className="cartBtn" href="/carrito" aria-label={`Carrito, ${count} canastas`} data-bump={bump % 2 ? "a" : bump ? "b" : undefined}>
                Carrito <span key={bump}>{count}</span>
              </Link>
            </div>
          </header>
        </div>
        <div className="textileBand" aria-hidden="true" />
      </div>
    </>
  );
}
