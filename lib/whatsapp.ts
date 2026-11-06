/** Mensaje con el que se abre WhatsApp desde los botones de la web. *texto* sale en negrita en WhatsApp. */
export const MENSAJE_WHATSAPP = "¡Hola! 🎄 Nos interesa conocer su catálogo de Canastas Navideñas 🎅 para este año.";

/** Enlace de WhatsApp con el número de contacto de la web (Contenido → Contacto). */
export function enlaceWhatsApp(telefono: string, texto = MENSAJE_WHATSAPP) {
  let d = telefono.replace(/\D/g, "");
  if (d.length === 9) d = `51${d}`;
  // wa.me rompe los emojis al redirigir a WhatsApp Web; api.whatsapp.com/send los conserva.
  return `https://api.whatsapp.com/send?phone=${d}&text=${encodeURIComponent(texto)}`;
}
