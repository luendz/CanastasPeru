// Recomprime las imágenes ya subidas al bucket "media" y deja el SQL para apuntar la web a las nuevas.
//
// Se ejecuta DESPUÉS del backup (backup-media/descargar.ps1): toma los originales de
// backup-media/imagenes, así no vuelve a descargarlos de Supabase.
//
//   node scripts/recomprimir-medios.mjs           → solo comprime en backup-media/comprimidas y muestra el ahorro
//   node scripts/recomprimir-medios.mjs --subir   → además sube las WebP al bucket y escribe backup-media/actualizar-urls.sql
//
// --subir necesita SUPABASE_URL y SUPABASE_SECRET_KEY (las lee de .env.local). Los originales
// NO se borran del bucket: quedan como respaldo hasta comprobar que la web se ve bien.
// El SQL generado cambia las direcciones guardadas en la base (directas a Supabase o /media/…)
// por /media/<nueva>.webp; se aplica a mano en el SQL Editor de Supabase o desde Claude.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const LADO_MAXIMO = 1600; // igual que LADO_MAXIMO_IMAGEN en lib/medios.ts
const CALIDAD = 82;
const AHORRO_MINIMO = 0.2; // si no baja al menos 20 %, se deja el original

const RAIZ = join(import.meta.dirname, "..");
const ORIGEN = join(RAIZ, "backup-media", "imagenes");
const DESTINO = join(RAIZ, "backup-media", "comprimidas");
const SQL = join(RAIZ, "backup-media", "actualizar-urls.sql");
const subir = process.argv.includes("--subir");

if (!existsSync(ORIGEN) || readdirSync(ORIGEN).length === 0) {
  console.error(`No hay originales en ${ORIGEN}. Primero ejecuta backup-media/descargar.ps1.`);
  process.exit(1);
}
mkdirSync(DESTINO, { recursive: true });

const mb = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
const cambios = []; // { viejo, nuevo }
let antes = 0;
let despues = 0;

for (const nombre of readdirSync(ORIGEN).sort()) {
  const ruta = join(ORIGEN, nombre);
  const peso = statSync(ruta).size;
  antes += peso;
  const { name, ext } = parse(nombre);
  if (ext.toLowerCase() === ".gif") { despues += peso; continue; }

  const salida = await sharp(readFileSync(ruta))
    .rotate() // respeta la orientación EXIF de fotos de celular
    .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: "inside", withoutEnlargement: true })
    .webp({ quality: CALIDAD, alphaQuality: 90, effort: 6 })
    .toBuffer();

  if (salida.length > peso * (1 - AHORRO_MINIMO)) {
    despues += peso;
    console.log(`= ${nombre} (${mb(peso)}): ya es liviana, se deja igual`);
    continue;
  }
  const nuevo = `${name}.webp`;
  writeFileSync(join(DESTINO, nuevo), salida);
  despues += salida.length;
  cambios.push({ viejo: nombre, nuevo });
  console.log(`✓ ${nombre} ${mb(peso)} → ${nuevo} ${mb(salida.length)}`);
}

console.log(`\nTotal: ${mb(antes)} → ${mb(despues)} (${Math.round((1 - despues / antes) * 100)} % menos). ${cambios.length} imágenes a reemplazar.`);
if (!subir) {
  console.log("Revisa backup-media/comprimidas. Para subirlas: node scripts/recomprimir-medios.mjs --subir");
  process.exit(0);
}

try { process.loadEnvFile(join(RAIZ, ".env.local")); } catch { /* también pueden venir del entorno */ }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SECRET_KEY;
if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SECRET_KEY (en .env.local o en el entorno).");
  process.exit(1);
}
const supabase = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });

const subidos = [];
for (const c of cambios) {
  const { error } = await supabase.storage.from("media").upload(c.nuevo, readFileSync(join(DESTINO, c.nuevo)), {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) { console.error(`✗ No se pudo subir ${c.nuevo}: ${error.message}`); continue; }
  subidos.push(c);
  console.log(`↑ ${c.nuevo}`);
}

// SQL: primero todas las direcciones directas a Supabase pasan a /media/…, luego cada
// imagen reemplazada apunta a su WebP. Solo se renombran las que se subieron bien.
const prefijo = `${url}/storage/v1/object/public/media/`;
const q = (s) => `'${s.replaceAll("'", "''")}'`;
const texto = [["articulos", "imagen"], ["envases", "imagen"], ["canastas", "imagen"]];
const json = [["canastas", "composicion"], ["canastas", "incluye"], ["contenido", "valor"], ["orden_items", "contenido"], ["cotizacion_items", "contenido"]];
const reemplazar = (de, a) => [
  ...texto.map(([t, c]) => `update public.${t} set ${c} = replace(${c}, ${q(de)}, ${q(a)}) where ${c} like ${q(`%${de}%`)};`),
  ...json.map(([t, c]) => `update public.${t} set ${c} = replace(${c}::text, ${q(de)}, ${q(a)})::jsonb where ${c}::text like ${q(`%${de}%`)};`),
];
const lineas = [
  "-- Generado por scripts/recomprimir-medios.mjs. Aplica todo junto.",
  "begin;",
  ...reemplazar(prefijo, "/media/"),
  ...subidos.flatMap((c) => reemplazar(`/media/${c.viejo}`, `/media/${c.nuevo}`)),
  "commit;",
];
writeFileSync(SQL, lineas.join("\n") + "\n");
console.log(`\n${subidos.length} de ${cambios.length} subidas. SQL listo en ${SQL}`);
