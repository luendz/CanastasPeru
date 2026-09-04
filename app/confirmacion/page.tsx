import Link from "next/link";

export default function ConfirmacionPage() {
  return (
    <section className="section shell successWrap">
      <div className="successIcon">✓</div>
      <span className="eyebrow">Pedido registrado</span>
      <h1>¡Gracias por tu compra!</h1>
      <p>Este es un prototipo visual del estado final de compra. Más adelante aquí se mostrarán el pedido real, el pago y el comprobante.</p>
      <div className="successCard">
        <div><span>Pedido</span><strong>#CP-000123</strong></div>
        <div><span>Estado</span><strong>Pago aprobado</strong></div>
        <div><span>Comprobante</span><strong>Procesando</strong></div>
        <div><span>Total</span><strong>S/ 294.80</strong></div>
      </div>
      <div className="heroActions centerActions">
        <button className="btn btnGhost" disabled>Descargar PDF</button>
        <button className="btn btnGhost" disabled>Descargar XML</button>
        <Link className="btn btnPrimary" href="/">Volver al inicio</Link>
      </div>
      <p className="muted">Los botones PDF/XML permanecerán deshabilitados hasta implementar facturación electrónica.</p>
    </section>
  );
}
