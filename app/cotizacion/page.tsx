export default function CotizacionPage() {
  return (
    <section className="section shell quotePage">
      <div className="quoteIntro"><span className="eyebrow">Empresas</span><h1>Cotización corporativa</h1><p>Cuéntanos qué necesitas y prepararemos una propuesta. Esta vista es solo de diseño por ahora.</p><ul><li>✓ Pedidos por volumen</li><li>✓ Presentaciones personalizadas</li><li>✓ Entregas coordinadas</li><li>✓ Boleta o factura</li></ul></div>
      <form className="formCard quoteForm">
        <div className="formGrid">
          <label>Empresa<input className="input" placeholder="Nombre de empresa" /></label>
          <label>RUC<input className="input" placeholder="20XXXXXXXXX" /></label>
          <label>Nombre de contacto<input className="input" placeholder="Nombre completo" /></label>
          <label>Correo<input className="input" placeholder="correo@empresa.com" /></label>
          <label>Celular<input className="input" placeholder="999 999 999" /></label>
          <label>Cantidad estimada<input className="input" type="number" placeholder="50" /></label>
          <label>Presupuesto por unidad<select className="select"><option>Selecciona un rango</option><option>Hasta S/ 100</option><option>S/ 100 - S/ 180</option><option>S/ 180 - S/ 250</option><option>Más de S/ 250</option></select></label>
          <label>Fecha requerida<input className="input" type="date" /></label>
          <label className="wide">Detalle<textarea className="textarea" placeholder="Cuéntanos qué tipo de canasta, presentación o personalización necesitas." /></label>
        </div>
        <button className="btn btnPrimary full" type="button">Solicitar cotización</button>
        <small className="muted">El formulario no envía información todavía.</small>
      </form>
    </section>
  );
}
