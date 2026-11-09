import type { MetadataRoute } from "next";
import { RUTAS_PRIVADAS, SITIO } from "@/lib/seo";

/** robots.txt: Google puede recorrer la tienda, menos el panel, el carrito y el pago. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: RUTAS_PRIVADAS },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
