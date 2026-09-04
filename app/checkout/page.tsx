import Link from "next/link";

export default function CheckoutPage() {
  return (
    <section className="section shell">
      <div className="pageIntro"><span className="eyebrow">Finalizar compra</span><h1>Checkout</h1><p>Prototipo visual. Ningún dato se envía todavía.</p></div>
      <div className="checkoutLayout">
        <div className="checkoutForm">
          <section className="formCard">
            <div className="stepTitle"><span>1</span><div><h3>Datos de contacto</h3><p>Información para confirmar tu pedido.</p></div></div>
            <div className="formGrid"><label>Nombres<input className="input" placeholder="Luis" /></label><label>Apellidos<input className="input" placeholder="Díaz" /></label><label>Correo<input className="input" placeholder="correo@ejemplo.com" /></label><label>Celular<input className="input" placeholder="999 999 999" /></label></div>
          </section>

          <section className="formCard">
            <div className="stepTitle"><span>2</span><div><h3>Datos de entrega</h3><p>Indica dónde debemos entregar el pedido.</p></div></div>
            <div className="formGrid"><label>Distrito<select className="select"><option>Selecciona distrito</option><option>Miraflores</option><option>San Isidro</option><option>Surco</option></select></label><label>Fecha de entrega<input className="input" type="date" /></label><label className="wide">Dirección<input className="input" placeholder="Av. / Jr. / Calle, número" /></label><label className="wide">Referencia<input className="input" placeholder="Referencia de entrega" /></label></div>
          </section>

          <section className="formCard">
            <div className="stepTitle"><span>3</span><div><h3>Comprobante</h3><p>Selecciona boleta o factura.</p></div></div>
            <div className="choiceGrid"><label className="choice"><input type="radio" name="doc" defaultChecked /><span><strong>Boleta</strong><small>DNI + nombres</small></span></label><label className="choice"><input type="radio" name="doc" /><span><strong>Factura</strong><small>RUC + razón social</small></span></label></div>
            <div className="formGrid topSpace"><label>Documento<input className="input" placeholder="DNI o RUC" /></label><label>Nombre / Razón social<input className="input" placeholder="Nombre para comprobante" /></label></div>
          </section>

          <section className="formCard">
            <div className="stepTitle"><span>4</span><div><h3>Método de pago</h3><p>Solo representación visual por ahora.</p></div></div>
            <div className="choiceGrid"><label className="choice"><input type="radio" name="pay" defaultChecked /><span><strong>Tarjeta</strong><small>Visa / Mastercard</small></span></label><label className="choice"><input type="radio" name="pay" /><span><strong>Transferencia</strong><small>Validación posterior</small></span></label></div>
          </section>
        </div>

        <aside className="summaryCard sticky">
          <h3>Resumen del pedido</h3>
          <div><span>2 productos</span><strong>S/ 279.80</strong></div>
          <div><span>Delivery</span><strong>S/ 15.00</strong></div>
          <hr />
          <div className="summaryTotal"><span>Total</span><strong>S/ 294.80</strong></div>
          <Link className="btn btnPrimary full" href="/confirmacion">Pagar S/ 294.80</Link>
          <small className="muted">Botón simulado para validar el flujo visual.</small>
        </aside>
      </div>
    </section>
  );
}
