/** Enlace de WhatsApp con el número de contacto de la web (Contenido → Contacto). */
export function enlaceWhatsApp(telefono: string, texto = "Hola, quiero información sobre sus canastas navideñas.") {
  let d = telefono.replace(/\D/g, "");
  if (d.length === 9) d = `51${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}
