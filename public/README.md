# Imágenes del prototipo

Next.js sirve todo lo que está en `public/` desde la raíz del sitio.
Un archivo en `public/incluye/paneton.png` se referencia como `/incluye/paneton.png`.

## Dónde va cada cosa

| Carpeta | Para qué | Ruta a usar en el código |
|---|---|---|
| `public/incluye/` | Productos incluidos en cada canasta (panetón, vino, café…) | `/incluye/<archivo>` |
| `public/presentaciones/` | Empaques: bolsa, caja de cartón, cesta de plástico, cesta de mimbre | `/presentaciones/<archivo>` |

## Cómo activarlas

Hoy todo se dibuja con emojis. Para pasar a imagen basta añadir el campo
`image` en `lib/mock-data.ts`; si está presente se usa la imagen y si no,
el emoji sigue funcionando como respaldo:

```ts
{ name: "Panetón", emoji: "🍞", image: "/incluye/paneton.png" }
```

## Recomendaciones

- PNG con fondo transparente, cuadradas, 256×256 px (se muestran a 56×56).
- Nombres en minúscula, sin tildes ni espacios: `paneton.png`, `vino-reserva.png`.
- Peso por archivo por debajo de ~80 KB.
