# CANASTASPERU — INSTRUCCIONES MAESTRAS DEL PROYECTO

> Este archivo es la fuente principal de contexto del proyecto. Cualquier IA o desarrollador que continúe el trabajo debe leerlo completo antes de modificar código.

## 1. Objetivo

Construir una tienda web peruana de canastas navideñas y regalos corporativos, inspirada funcionalmente en comercios de canastas navideñas, pero con identidad y código propios.

El proyecto debe permitir, cuando esté terminado:

1. Mostrar catálogo de productos y categorías.
2. Ver detalle de cada canasta o box.
3. Agregar productos al carrito.
4. Realizar checkout.
5. Elegir boleta o factura.
6. Elegir método de pago.
7. Registrar pedido.
8. Integrar pasarela de pago.
9. Emitir comprobante electrónico mediante proveedor de facturación/SUNAT.
10. Mostrar estado del pedido y, cuando corresponda, PDF/XML.
11. Permitir cotizaciones empresariales por volumen.
12. Contar con administración de productos, pedidos y cotizaciones en una fase posterior.

## 2. Prioridad actual: SOLO VISTAS

### IMPORTANTE

La fase actual es exclusivamente FRONTEND / PROTOTIPO VISUAL.

NO implementar todavía:

- Supabase.
- PostgreSQL.
- autenticación real.
- API real.
- Edge Functions.
- pagos reales.
- webhooks.
- Culqi, Niubiz o Izipay.
- NubeFact ni otra facturación electrónica.
- llamadas a SUNAT.
- envío real de correos.
- persistencia de carrito.
- panel administrativo funcional.

Todo debe funcionar con datos mock/locales y navegación simulada hasta validar las vistas.

La regla es: **primero aprobar experiencia visual y flujo; después conectar backend**.

## 3. Repositorio

Repositorio GitHub:

`luendz/CanastasPeru`

Rama principal:

`main`

Durante la fase inicial se puede trabajar directamente en `main` si el cambio es pequeño. Para cambios grandes o nuevas fases, crear ramas descriptivas, por ejemplo:

- `feature/frontend-v2`
- `feature/supabase`
- `feature/payments`
- `feature/invoicing`
- `feature/admin`

## 4. Stack objetivo

### Fase actual

- Next.js App Router
- React
- TypeScript
- Tailwind CSS disponible
- CSS global propio para el prototipo
- datos mock en TypeScript

### Fase posterior

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions
- pasarela: Culqi, Niubiz o Izipay (se definirá posteriormente)
- facturación: NubeFact u otro proveedor compatible con SUNAT (se definirá posteriormente)
- hosting frontend: Vercel como opción principal

No añadir servicios externos antes de que el usuario lo solicite.

## 5. Identidad temporal

Nombre de proyecto/marca actual:

**CanastasPerú**

La identidad todavía puede cambiar. No acoplar lógica a este nombre.

Dirección visual actual:

- elegante y comercial.
- cálida, navideña y moderna.
- no recargar con elementos navideños infantiles.
- predominio de verdes naturales, crema, blanco y pequeños acentos dorados/rojos.
- tarjetas amplias y limpias.
- fotografías de producto reemplazarán posteriormente los placeholders/emoji.
- diseño responsive desde desktop hasta móvil.

Variables visuales actuales orientativas:

- verde principal: `#1f5b3b`
- verde oscuro: `#163e2b`
- crema: `#f6f1e6`
- dorado: `#c59645`
- rojo de acento: `#a84236`
- texto principal: `#182219`

No es obligatorio conservar exactamente estos colores si se rediseña la marca, pero mantener coherencia visual.

## 6. Estructura actual esperada

```text
CanastasPeru/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── catalogo/
│   │   └── page.tsx
│   ├── producto/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── carrito/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   ├── confirmacion/
│   │   └── page.tsx
│   └── cotizacion/
│       └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ProductCard.tsx
├── lib/
│   └── mock-data.ts
├── docs/
│   └── INSTRUCCIONES_PROYECTO.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

Mantener componentes reutilizables. No copiar el mismo header, footer o tarjeta en varias páginas.

## 7. Vistas obligatorias de la fase visual

### 7.1 Inicio `/`

Debe contener:

- barra superior informativa.
- header con logo/marca.
- navegación principal.
- acceso visible al carrito.
- hero principal.
- CTA `Ver catálogo`.
- CTA `Cotizar para empresa`.
- productos destacados.
- beneficios o pasos de compra.
- bloque corporativo.
- footer.

Objetivo: explicar rápidamente qué vende la web y llevar al usuario al catálogo o a cotización.

### 7.2 Catálogo `/catalogo`

Debe contener:

- título de catálogo.
- total de resultados.
- filtros visuales por categoría.
- filtro/presupuesto visual.
- selector de orden.
- grid responsive de productos.
- cada producto debe llevar a su detalle.

En esta fase los filtros pueden ser no funcionales.

### 7.3 Detalle `/producto/[slug]`

Debe contener:

- imagen/placeholder grande.
- categoría.
- nombre.
- precio.
- precio anterior si aplica.
- descripción.
- lista de productos incluidos.
- cantidad.
- botón `Agregar al carrito`.
- botón `Cotizar volumen`.
- información de delivery/comprobante/presentación.

En esta fase `Agregar al carrito` puede redirigir al carrito mock.

### 7.4 Carrito `/carrito`

Debe contener:

- productos agregados mock.
- miniatura.
- nombre y categoría.
- cantidad.
- eliminar visual.
- precio por producto.
- subtotal.
- delivery pendiente de cálculo.
- total.
- botón `Continuar compra`.
- botón/enlace `Seguir comprando`.

No implementar persistencia todavía.

### 7.5 Checkout `/checkout`

Debe representarse por secciones claras.

#### Paso 1 — Contacto

Campos:

- nombres.
- apellidos.
- correo.
- celular.

#### Paso 2 — Entrega

Campos:

- distrito.
- dirección.
- referencia.
- fecha de entrega.

#### Paso 3 — Comprobante

Opciones:

- Boleta.
- Factura.

Boleta contempla conceptualmente:

- DNI.
- nombres.

Factura contempla conceptualmente:

- RUC.
- razón social.
- dirección fiscal.

Durante la fase visual no es obligatorio hacer formularios dinámicos. Posteriormente sí deben mostrarse campos específicos según opción.

#### Paso 4 — Pago

Representar opciones visuales, por ejemplo:

- tarjeta.
- transferencia.

NO capturar ni enviar información bancaria real en esta fase.

Debe existir resumen lateral del pedido con subtotal, delivery y total.

El botón final puede navegar a `/confirmacion` para simular pago aprobado.

### 7.6 Confirmación `/confirmacion`

Debe mostrar:

- compra/pedido exitoso.
- número de pedido mock.
- estado de pago.
- estado de comprobante.
- total.
- botones PDF/XML deshabilitados o simulados.
- regreso al inicio.

Concepto futuro:

```text
Pago aprobado
   ↓
Pedido registrado
   ↓
Comprobante en proceso
   ↓
Facturación electrónica
   ↓
SUNAT / proveedor
   ↓
PDF + XML
```

No asumir que PDF/XML deben existir inmediatamente tras el pago.

### 7.7 Cotización empresarial `/cotizacion`

Debe contener:

- descripción de ventas corporativas.
- empresa.
- RUC.
- contacto.
- correo.
- celular.
- cantidad estimada.
- presupuesto por unidad.
- fecha requerida.
- detalle/requerimientos.
- botón de solicitud.

En esta fase no enviar datos.

## 8. Productos mock iniciales

Mantener los mock separados de los componentes, actualmente en `lib/mock-data.ts`.

Productos iniciales:

1. Canasta Clásica.
2. Canasta Premium.
3. Canasta Ejecutiva.
4. Box Navideño.

Cada producto mock debe tener como mínimo:

```ts
{
  slug,
  name,
  category,
  price,
  oldPrice?,
  badge?,
  emoji,
  description,
  items
}
```

Cuando existan fotografías reales, reemplazar `emoji` por modelo de imágenes; no modificar la lógica de página más de lo necesario.

## 9. Navegación esperada

Flujo principal simulado:

```text
Inicio
  ↓
Catálogo
  ↓
Detalle producto
  ↓
Carrito
  ↓
Checkout
  ↓
Confirmación
```

Flujo empresarial:

```text
Inicio / Detalle
  ↓
Cotización empresarial
```

Todas las vistas deben ser accesibles mediante navegación normal y no depender de URLs escritas manualmente.

## 10. Responsive

Verificar al menos:

- desktop grande.
- laptop/tablet horizontal.
- tablet/móvil.

Reglas:

- grids pasan de 4/3 columnas a 2 y luego 1.
- header móvil puede ocultar temporalmente el menú completo durante el prototipo, pero no debe romper layout.
- formularios de dos columnas pasan a una.
- carrito no debe desbordar horizontalmente.
- botones importantes deben conservar tamaños táctiles cómodos.
- textos grandes deben usar `clamp()` o equivalentes.

## 11. Accesibilidad mínima

- usar `label` para formularios.
- botones deben ser botones y enlaces deben ser enlaces.
- mantener contraste suficiente.
- imágenes reales futuras deben tener `alt`.
- no usar solo color para comunicar estados.
- inputs deben mostrar focus visible.

## 12. Reglas de código

1. TypeScript estricto.
2. App Router de Next.js.
3. Preferir Server Components cuando no se necesite interacción de cliente.
4. Añadir `"use client"` únicamente cuando haga falta estado/eventos del navegador.
5. Evitar dependencias innecesarias.
6. No crear abstracciones prematuras.
7. Componentes reutilizables para patrones repetidos.
8. Datos mock fuera de las vistas cuando sean compartidos.
9. No guardar claves ni secretos en el repositorio.
10. No crear lógica runtime invisible cuando pueda quedar explícita en archivos/componentes.
11. Mantener nombres de archivos y componentes claros.
12. No modificar funcionalidades aprobadas sin una razón concreta.
13. Antes de añadir backend, conservar el contrato visual existente.

## 13. Fases del proyecto

### FASE 1 — Vistas y UX (ACTUAL)

Entregables:

- todas las vistas descritas.
- navegación.
- responsive.
- componentes reutilizables.
- mock data.
- flujo de compra simulado.

Criterio de cierre:

El usuario aprueba diseño, campos, navegación y flujo.

### FASE 2 — Supabase y datos reales

Solo iniciar cuando el usuario lo indique.

Arquitectura prevista:

```text
Next.js
   ↓
Supabase
├── PostgreSQL
├── Auth
├── Storage
└── Edge Functions
```

Tablas candidatas:

- categories
- products
- product_images
- customers
- addresses
- carts
- cart_items
- orders
- order_items
- payments
- invoices
- coupons
- shipping_rates
- corporate_quotes

No crear estas tablas durante Fase 1.

### FASE 3 — Carrito y checkout reales

- persistencia.
- stock.
- cálculo de totales.
- delivery.
- validaciones.
- datos de comprobante.
- creación real del pedido.

### FASE 4 — Pago

Elegir una pasarela antes de programar.

Flujo esperado:

```text
Checkout
   ↓
Crear intención/operación de pago
   ↓
Pasarela
   ↓
Confirmación segura del servidor/webhook
   ↓
Actualizar payment/order
```

Nunca marcar un pedido como pagado basándose únicamente en una redirección del navegador.

### FASE 5 — Facturación electrónica

Elegir proveedor antes de programar.

Flujo conceptual:

```text
Pedido pagado
   ↓
Preparar comprobante
   ↓
Proveedor de facturación
   ↓
SUNAT
   ↓
Respuesta
   ↓
Guardar estado
   ↓
PDF/XML/CDR cuando corresponda
```

El pago y la facturación deben ser procesos separados. Un fallo temporal de facturación no debe perder un pago aprobado.

### FASE 6 — Administración

Panel para:

- categorías.
- productos.
- imágenes.
- precios.
- stock.
- pedidos.
- estados.
- cotizaciones.
- descuentos/cupones.
- tarifas de delivery.
- comprobantes.

No construirlo antes de cerrar el flujo de compra principal salvo solicitud expresa.

## 14. Modelo conceptual de pedido futuro

Sin implementar todavía, el pedido deberá contemplar al menos:

```text
Order
- id
- order_number
- customer_id
- status
- subtotal
- shipping
- discount
- total
- payment_status
- payment_method
- document_type
- document_number
- business_name
- fiscal_address
- shipping_address
- district
- delivery_date
- created_at
```

Comprobante futuro:

```text
Invoice
- id
- order_id
- type
- series
- number
- document_number
- business_name
- subtotal
- igv
- total
- provider_status
- sunat_status
- pdf_url
- xml_url
- cdr_url
- created_at
```

Estos nombres son guía, no esquema aprobado definitivo.

## 15. Estados conceptuales futuros

Pedido:

- CREATED
- PENDING_PAYMENT
- PAID
- PREPARING
- READY
- SHIPPED
- DELIVERED
- CANCELLED

Pago:

- PENDING
- APPROVED
- REJECTED
- REFUNDED

Comprobante:

- NOT_REQUESTED
- PENDING
- ISSUED
- ACCEPTED
- REJECTED
- ERROR

No convertir estos valores en implementación real hasta definir backend.

## 16. Regla crítica sobre comprobantes

Boleta y factura son tipos de comprobante, no métodos de pago.

El checkout debe tratar por separado:

```text
Datos del pedido
   ↓
Tipo de comprobante
   ↓
Método de pago
   ↓
Pago
   ↓
Pedido pagado
   ↓
Emisión posterior del comprobante
```

El PDF/XML no necesita ser devuelto dentro de la misma operación de pago. Puede mostrarse `Comprobante: Procesando` y habilitar descargas después.

## 17. Qué debe hacer una IA al recibir este repositorio

Antes de programar:

1. Leer este archivo completo.
2. Revisar el estado actual del repositorio.
3. Ejecutar/compilar el proyecto.
4. No asumir que una fase futura ya fue autorizada.
5. Identificar exactamente qué pantalla o fase pidió modificar el usuario.
6. Mantener lo aprobado que no esté relacionado con el cambio.
7. Probar navegación y responsive tras modificar vistas.
8. No insertar secretos, credenciales ni claves ficticias como si fueran reales.
9. Documentar cambios importantes.

Si el usuario solo pide cambios visuales, NO introducir base de datos o servicios externos.

## 18. Criterios de aceptación de Fase 1

La fase de vistas se considera lista cuando:

- `/` carga correctamente.
- `/catalogo` carga correctamente.
- `/producto/canasta-premium` y demás slugs funcionan.
- `/carrito` carga correctamente.
- `/checkout` carga correctamente.
- `/confirmacion` carga correctamente.
- `/cotizacion` carga correctamente.
- navegación principal funciona.
- el flujo simulado puede recorrerse de inicio a confirmación.
- no hay dependencias de Supabase.
- no se requieren variables de entorno para ver el prototipo.
- diseño es usable en desktop y móvil.
- `npm run build` no presenta errores.

## 19. Comandos básicos

```bash
npm install
npm run dev
```

Abrir normalmente:

```text
http://localhost:3000
```

Validación antes de entregar cambios:

```bash
npm run build
```

## 20. Siguiente acción recomendada

Continuar iterando únicamente las vistas con feedback del usuario: colores, imágenes, posiciones, textos, formularios y experiencia del checkout.

**No avanzar a Supabase hasta recibir instrucción explícita.**
