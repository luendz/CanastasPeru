# Infraestructura MKA

Dónde vive cada parte de la web, cómo se publica y qué reglas seguir para no romper producción. Léelo antes de tocar despliegues, base de datos o el panel.

> Este archivo no contiene secretos. Nunca agregues aquí contraseñas, la `service_role` / secret key de Supabase ni tokens de Cloudflare.

## Resumen

| Pieza | Dónde | Notas |
|---|---|---|
| Código | GitHub `luendz/CanastasPeru` | Rama principal `main` |
| Web pública | Cloudflare Workers, Worker `mka-canastas` | https://mka-canastas.ledzenrique1896.workers.dev |
| Base de datos y login | Supabase, proyecto **MKA Canastas** | Cuenta/organización **`mkacanastas`** |
| Panel de gestión | Ruta `/admin`, rama `panel-admin` | Solo local por ahora; **no está publicado** |

## Publicación (Cloudflare Workers)

- **Publicación automática:** cada push o merge a **`main`** se publica solo, mediante Workers Builds con el adaptador oficial `@opennextjs/cloudflare`.
- **Comandos configurados en Cloudflare:**
  - build: `npx opennextjs-cloudflare build`
  - deploy: `npx opennextjs-cloudflare deploy`
  - preview (ramas que no son `main`): `npx opennextjs-cloudflare upload`
- **Nombre del Worker:** `mka-canastas`. Debe coincidir con `name` en `wrangler.jsonc`, o el build falla.
- **Configuración mínima:** sin caché en R2 ni optimización de imágenes, porque el sitio no usa ISR ni `next/image`. Así funciona en el plan gratuito.
- **Tamaño:** el Worker pesa ~1,1 MB comprimido. El límite del plan gratuito es de 3 MB.
- **Probar localmente en el runtime de Workers:** `npm run preview`.
- **Dominio propio:** todavía no hay. Se conecta en el panel del Worker → Settings → Domains & Routes.

## Supabase

- **Proyecto:** "MKA Canastas".
  - ref: `zwksehgjansnpkqtzfmz`;
  - región: `sa-east-1` (São Paulo);
  - plan gratuito;
  - panel: https://supabase.com/dashboard/project/zwksehgjansnpkqtzfmz
- **Cuenta:** el proyecto está en la organización **`mkacanastas`**. **No** es la cuenta anterior del usuario (organización "Proyectos", con Centralia y Finanzas); esa ya no tiene cupo gratuito.
- **URL de la API:** `https://zwksehgjansnpkqtzfmz.supabase.co`.
- **Variables de entorno** (ver `.env.example`; en local van en `.env.local`, que git ignora):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, que es pública por diseño; la seguridad la dan las políticas RLS.
- **Sin estas variables:** la tienda funciona en modo demostración y el panel muestra un aviso.
- **Migraciones:** en `supabase/migrations/`, aplicadas en orden.
  - `20260924000001_panel_admin.sql`: tablas, RLS, funciones, vistas y catálogo inicial.
  - `20260924000002_endurecer_funciones.sql`: `es_admin` y `precio_canasta` pasan a `SECURITY INVOKER`.
- **Administradores:** tabla `public.admins`. Para dar acceso a alguien:
  1. Crear el usuario en Supabase → Authentication → Add user, con "Auto Confirm".
  2. Insertarlo en `admins`:
     ```sql
     insert into public.admins (user_id, nombre)
     select id, 'Nombre' from auth.users where lower(email) = lower('correo@ejemplo.com');
     ```
  - Administrador actual: `ledzenrique1896@gmail.com`.

### Cómo está protegida la base

- **RLS:** todas las tablas la tienen. Solo los administradores leen y escriben los datos de gestión. Lo público es el catálogo activo (productos, tipos de canasta, zonas de delivery).
- **Tienda:** la web **no escribe directo** en las tablas; usa dos funciones.
  - `crear_orden_web`: valida todo y **recalcula precios y delivery en el servidor**; se ignora cualquier precio que mande el navegador.
  - `crear_cotizacion_web`.
- **Aprobación de cotizaciones:** `aprobar_cotizacion` rechaza a quien no sea administrador y no permite aprobar dos veces.
- **Stock, costo por canasta y lista de producción:** son **vistas** calculadas a partir de compras y pedidos, así nunca se desincronizan.
- **Avisos del linter de Supabase:** los que quedan sobre `crear_orden_web` y `crear_cotizacion_web` son **intencionales**, porque tienen que ser públicas.
- **Numeración:** los números (`OP-0001`, `COT-0001`) salen de secuencias. Si se borran datos de prueba, reiniciar con `setval('public.ordenes_numero_seq', 1, false)` y `setval('public.cotizaciones_numero_seq', 1, false)`.

## Panel de gestión (`/admin`)

**Módulos:** inicio, órdenes, cotizaciones (al aprobar se crea la orden), compras y costos (producción y marketing), costeo por canasta, producción e inventario, y reportes en Excel.

**Cómo protege el acceso:**
- `proxy.ts` refresca la sesión y manda al login a quien no la tiene.
- Cada página y acción llama a `requireAdmin()` (`lib/admin/auth.ts`), que verifica el token y la tabla `admins`.
- RLS vuelve a exigirlo en la base.
- `requireAdmin()` también llama a `connection()` para que el panel nunca se prerenderice.

### Reglas

1. **No mergear el panel a `main` sin confirmarlo con el usuario.** `main` se publica sola y es pública.
2. **Antes de publicar el panel:** definir en Cloudflare (Settings → Variables) `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y revisar qué rutas internas quedan expuestas (por ejemplo `/dev/composicion`).
3. **Precios duplicados:** el catálogo que muestra la web sale de `lib/mock-data.ts` y los pedidos se cobran con la tabla `productos`. Si cambias un precio, cámbialo **en ambos** hasta que la web lea el catálogo desde la base.

## Otras ramas

- **`rediseno-animado`:** rediseño alternativo del sitio, con otra identidad visual. No está mergeado.
