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
  - `20260925000003_catalogo_web.sql`: el catálogo de la web (descripción, precio tachado, insignia, composición, imágenes de tipos de canasta, orden) y la función pública `catalogo_web()`.
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

**Módulos:** inicio, órdenes, cotizaciones (al aprobar se crea la orden), **catálogo** (canastas, tipos de canasta y delivery), compras y costos (producción y marketing), costeo por canasta, producción e inventario, y reportes en Excel.

**Cómo protege el acceso:**
- `proxy.ts` refresca la sesión y manda al login a quien no la tiene.
- Cada página y acción llama a `requireAdmin()` (`lib/admin/auth.ts`), que verifica el token y la tabla `admins`.
- RLS vuelve a exigirlo en la base.
- `requireAdmin()` también llama a `connection()` para que el panel nunca se prerenderice.

### Reglas

1. **No mergear el panel a `main` sin confirmarlo con el usuario.** `main` se publica sola y es pública.
2. **Antes de publicar el panel:** definir en Cloudflare (Settings → Variables) `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Ya no hay rutas internas públicas: el editor de composición vive dentro del panel.
3. **El catálogo vive en la base.** La tienda lee canastas, precios, tipos de canasta y distritos con `catalogo_web()` en cada visita (`lib/catalogo.ts`), y cobra con los mismos datos. Precios, descripciones, insignias, visibilidad, tipos de canasta y tarifas se editan en **Panel → Catálogo** y se ven al instante, sin redeploy. Las canastas nuevas se crean ocultas: primero se arma su receta (Costeo) y su composición (editor), y después se activan.
   - "Lo que trae" cada canasta sale de su **receta** (insumos de tipo producto), la misma del costeo.
   - La posición de cada producto sobre la canasta está en `productos.composicion`. Se ajusta en **Panel → Catálogo → (canasta) → Composición visual** (`/admin/catalogo/[id]/composicion`).
   - La **foto y el emoji** de cada producto son del insumo (`insumos.imagen`, `insumos.emoji`), en **Catálogo → Fotos de productos**: `catalogo_web()` los aplica a todas las canastas que lo llevan.
   - `lib/mock-data.ts` solo se usa como **modo demostración** si faltan las variables de Supabase; ya no es la fuente de verdad.

4. **Todo el contenido se administra desde el panel.**
   - **Imágenes** (`/admin/medios`): bucket público `media` de Supabase Storage (5 MB, PNG/JPG/WebP/GIF, sin SVG). Se sube directo desde el navegador con la sesión del admin (`lib/supabase/client.ts`); las políticas de Storage solo dejan subir/borrar a admins. No se puede borrar una imagen en uso. Las imágenes de `public/` aparecen como "De la web" (solo lectura).
   - **Textos** (`/admin/contenido`): tabla `contenido`, una fila por sección (marca, anuncios, portada, catálogo, producto, contacto, checkout, cotización, pie). `lib/contenido.ts` tiene los textos por defecto y los combina campo a campo con lo guardado; `sanearSeccion()` valida lo que llega del panel. "Restaurar textos originales" deja la fila en `{}`.
   - La marca (logo e ícono de pestaña) también es contenido: `app/layout.tsx` arma el título y el favicon desde `contenido.marca`.

## Otras ramas

- **`rediseno-animado`:** rediseño alternativo del sitio, con otra identidad visual. No está mergeado.
