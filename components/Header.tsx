import Link from "next/link";

export default function Header() {
  return (
    <>
      <div className="topbar">
        <span>✦ Envíos programados en Lima</span>
        <span className="topbarHide">✦ Atención a empresas</span>
        <span className="topbarHide">✦ Cotizaciones en 24 h</span>
      </div>
      <div className="headerWrap">
        <header className="header shell">
          <Link className="brand" href="/">
            <span className="brandMark" aria-hidden="true">✦</span>
            <span>Canastas<em>Perú</em></span>
          </Link>
          <nav className="nav">
            <Link href="/">Inicio</Link>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/cotizacion">Empresas</Link>
            <Link href="/checkout">Checkout</Link>
          </nav>
          <div className="headerActions">
            <button className="iconBtn" aria-label="Buscar">⌕</button>
            <Link className="cartBtn" href="/carrito">Carrito <span>2</span></Link>
          </div>
        </header>
      </div>
      <div className="textileBand" aria-hidden="true" />
    </>
  );
}
