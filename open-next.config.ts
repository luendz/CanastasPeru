// Configuración de OpenNext para desplegar en Cloudflare Workers.
// Sin caché incremental (R2): el sitio no usa ISR ni revalidación, así que
// no hace falta y el despliegue funciona en el plan gratuito.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
