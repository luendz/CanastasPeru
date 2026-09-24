"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Brand from "@/components/Brand";

const links = [
  { href: "/catalogo", label: "Canastas" },
  { href: "/cotizacion", label: "Empresas" },
  { href: "/checkout", label: "Checkout" },
];

export default function Header() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [count, setCount] = useState(2);
  const [bump, setBump] = useState(0);

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

  // Se esconde al bajar y vuelve al subir; con fondo sólido apenas hay scroll.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 12);
        setHidden(y > 220 && y > last + 4 ? true : y < last - 4 ? false : (h) => h);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="siteHeader" data-hidden={hidden || undefined} data-scrolled={scrolled || undefined}>
      <div className="announce">
        <p>Pedidos de Navidad abiertos · entregas programadas en Lima</p>
      </div>
      <div className="shell header">
        <Brand />
        <nav className="nav" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined}>{l.label}</Link>
          ))}
        </nav>
        <div className="headerActions">
          <Link className="cartBtn" href="/carrito" aria-label={`Carrito, ${count} canastas`} data-bump={bump % 2 ? "a" : bump ? "b" : undefined}>
            <span className="cartIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h16l-1.6 9.2a1.5 1.5 0 0 1-1.5 1.3H7.1a1.5 1.5 0 0 1-1.5-1.3z" />
                <path d="M8.5 10 12 4l3.5 6" />
              </svg>
            </span>
            <span className="cartCount" key={bump}>{count}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
