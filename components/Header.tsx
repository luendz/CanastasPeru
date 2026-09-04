import Link from "next/link";

export default function Header() {
  return (
    <>
      <div className="topbar">Envíos en Lima · Atención a empresas · Cotizaciones personalizadas</div>
      <header className="header shell">
        <Link className="brand" href="/">
          <span className="brandMark">CP</span>
          <span><strong>Canastas</strong>Perú</span>
        </Link>
        <nav className="nav">
          <Link href="/">Inicio</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/cotizacion">Empresas</Link>
          <Link href="/checkout">Checkout</Link>
        </nav>
        <div className="headerActions">
          <button className="iconBtn" aria-label="Buscar">⌕</button>
          <Link className="cartBtn" href="/carrito">🛒 <span>2</span></Link>
        </div>
      </header>
    </>
  );
}
