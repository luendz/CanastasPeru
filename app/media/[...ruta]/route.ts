import { urlStorageMedio } from "@/lib/medios";

/*
 * /media/<archivo>: imágenes subidas desde el panel (bucket "media" de Supabase),
 * servidas desde el propio dominio.
 *
 * El plan gratuito de Supabase permite 5 GB al mes de transferencia de Storage, y
 * cada visita descargaba las fotos directo de Supabase. Aquí la primera petición
 * trae la imagen de Supabase y la guarda en la caché de Cloudflare (Cache API del
 * Worker); las siguientes se responden desde esa caché sin tocar Supabase. Además,
 * el navegador la guarda un año: los nombres de archivo son únicos, así que una
 * imagen nunca cambia de contenido con la misma dirección.
 */

const UN_ANO = "public, max-age=31536000, immutable";
// Nombres que genera rutaParaSubir() (y los antiguos con guiones y UUID). Nada de "/" ni "..".
const NOMBRE_VALIDO = /^[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/;

/** Caché del centro de datos de Cloudflare; no existe en `next dev`. */
function cacheCloudflare(): Cache | undefined {
  return (globalThis.caches as (CacheStorage & { default?: Cache }) | undefined)?.default;
}

export async function GET(request: Request, ctx: RouteContext<"/media/[...ruta]">) {
  const { ruta } = await ctx.params;
  const nombre = ruta.join("/");
  if (!NOMBRE_VALIDO.test(nombre) || nombre.includes("..")) return new Response("No encontrado", { status: 404 });

  // La clave de caché ignora la query (?v=…) para que nadie pueda saltarse la caché.
  const clave = new Request(new URL(`/media/${nombre}`, request.url));
  const cache = cacheCloudflare();
  const guardada = await cache?.match(clave);
  if (guardada) return guardada;

  const origen = await fetch(urlStorageMedio(nombre));
  if (!origen.ok || !origen.body) {
    // 404 real o Supabase caído/restringido: no se guarda en caché para reintentar luego.
    return new Response(origen.status === 404 || origen.status === 400 ? "No encontrado" : "Imagen no disponible", {
      status: origen.status === 404 || origen.status === 400 ? 404 : 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const cabeceras = new Headers({ "Cache-Control": UN_ANO });
  for (const h of ["Content-Type", "Content-Length", "ETag", "Last-Modified"]) {
    const v = origen.headers.get(h);
    if (v) cabeceras.set(h, v);
  }
  const respuesta = new Response(origen.body, { status: 200, headers: cabeceras });
  if (cache) await cache.put(clave, respuesta.clone());
  return respuesta;
}
