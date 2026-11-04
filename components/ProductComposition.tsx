"use client";

import { useRef, useState } from "react";
import type { AjusteEnvase, Product, ProductVisualItem } from "@/lib/mock-data";
import styles from "./ProductComposition.module.css";

/**
 * Todas las vistas usan el mismo lienzo proporcional: el tamaño guardado de cada
 * producto es relativo al ancho del lienzo, igual que su posición. Así lo que se
 * arma en el editor se ve igual en la tarjeta o el carrito, solo a otra escala.
 */
const anchoProducto = (size: number) => `${size * 0.2}cqw`;

const LIENZO = 0.75; // Alto del lienzo respecto a su ancho (4:3).

export const AJUSTE_NEUTRO: AjusteEnvase = { x: 0, y: 0, escala: 100, giro: 0 };

/**
 * Encuadre fijo de la tienda: qué parte del lienzo se ve en cada recuadro.
 * Es el mismo para todas las canastas, así todas salen a la misma escala, y el
 * editor dibuja estos marcos para que se vea qué queda dentro. Va en unidades
 * del ancho del lienzo (el lienzo mide 100 × 75).
 */
export type Marco = { izquierda: number; arriba: number; ancho: number; alto: number };

export function marco(proporcion: number): Marco {
  // Cuadrado (tarjeta, detalle, carrito) o apaisado (inicio, 4:3).
  const ancho = proporcion >= 0.9 ? 75 : 86;
  const alto = ancho * proporcion;
  const centroY = 39;
  return { izquierda: 50 - ancho / 2, arriba: centroY - alto / 2, ancho, alto };
}

function encuadre(proporcion: number) {
  const m = marco(proporcion);
  return {
    width: `${(100 / m.ancho) * 100}%`,
    left: `${(-m.izquierda / m.ancho) * 100}%`,
    top: `${(-m.arriba / m.alto) * 100}%`,
  };
}

type ProductCompositionProps = {
  product: Product;
  variant?: "card" | "detail";
  /** Sustituye la canasta propia del producto por otro tipo elegido. */
  baseImage?: string;
  /** Envase que se muestra (su id), para tomar su ajuste. Por defecto, el principal. */
  envaseId?: string;
  /** Los productos caen uno a uno dentro de la canasta al montarse. */
  assemble?: boolean;
  /** Alto del recuadro respecto a su ancho. */
  proporcion?: number;
  /** En el editor se muestra el lienzo completo, con margen para mover productos. */
  encuadrar?: boolean;
  /** En el editor: producto que se marca con su silueta (lo elige el editor, no el puntero). */
  resaltado?: number | null;
  /** Sin el movimiento de la tarjeta al pasar el mouse (canasta y productos se quedan en su sitio). */
  quieta?: boolean;
};

// Máscara de transparencia de cada imagen, calculada una sola vez por archivo.
type AlphaMask = { width: number; height: number; data: Uint8ClampedArray };
const MASK_SIZE = 160;
const ALPHA_THRESHOLD = 24;
const masks = new Map<string, AlphaMask | null>();

function maskFor(img: HTMLImageElement): AlphaMask | null {
  const cached = masks.get(img.currentSrc);
  if (cached !== undefined) return cached;
  if (!img.complete || !img.naturalWidth) return null;

  const scale = Math.min(1, MASK_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let mask: AlphaMask | null = null;
  if (ctx) {
    ctx.drawImage(img, 0, 0, width, height);
    try {
      mask = { width, height, data: ctx.getImageData(0, 0, width, height).data };
    } catch {
      mask = null; // Imagen de otro origen: se usa la caja completa como respaldo.
    }
  }
  masks.set(img.currentSrc, mask);
  return mask;
}

/** ¿El punto de pantalla cae sobre un píxel visible del producto? */
export function hitsVisiblePixel(layer: HTMLElement, rotate: number, clientX: number, clientY: number) {
  const rect = layer.getBoundingClientRect();
  const w = layer.offsetWidth;
  const h = layer.offsetHeight;
  if (!w || !h) return false;

  // Deshace la rotación alrededor del centro para obtener coordenadas locales.
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  const rad = (-rotate * Math.PI) / 180;
  const u = dx * Math.cos(rad) - dy * Math.sin(rad) + w / 2;
  const v = dx * Math.sin(rad) + dy * Math.cos(rad) + h / 2;
  if (u < 0 || v < 0 || u >= w || v >= h) return false;

  const img = layer.querySelector("img");
  if (!img) return true; // Emoji: basta con la caja.
  const mask = maskFor(img);
  if (!mask) return true;
  const x = Math.floor((u / w) * mask.width);
  const y = Math.floor((v / h) * mask.height);
  return mask.data[(y * mask.width + x) * 4 + 3] > ALPHA_THRESHOLD;
}

export { anchoProducto };

export default function ProductComposition({ product, variant = "card", baseImage, envaseId, assemble = false, proporcion = 1, encuadrar = true, resaltado, quieta = false }: ProductCompositionProps) {
  const isDetail = variant === "detail";
  const base = baseImage ?? product.baseImage;
  // El ajuste va por envase y no por foto: dos envases pueden compartir la misma foto.
  const ajuste = product.ajustesEnvase?.[envaseId ?? product.baseType ?? ""] ?? AJUSTE_NEUTRO;

  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState<number | null>(null);

  // De la capa más alta a la más baja; a igual zIndex manda el que va después en el DOM.
  const stacking = product.visualItems
    .map((item, index) => ({ index, z: item.zIndex ?? 5, rotate: item.rotate ?? 0 }))
    .sort((a, b) => b.z - a.z || b.index - a.index);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const hit = stacking.find(({ index, rotate }) => {
      const layer = layerRefs.current[index];
      return layer ? hitsVisiblePixel(layer, rotate, event.clientX, event.clientY) : false;
    });
    const next = hit ? hit.index : null;
    if (next !== active) setActive(next);
  }

  const editor = resaltado !== undefined;
  const activeItem = !editor && active !== null ? product.visualItems[active] : undefined;
  // Orden de caída: primero lo que va al fondo, al final lo que queda delante.
  const dropOrder = [...stacking].reverse().map(({ index }) => index);

  return (
    <div
      className={`${styles.composition} ${isDetail ? styles.detail : styles.card} ${activeItem ? styles.hasActive : ""} ${assemble ? styles.assemble : ""} ${quieta ? styles.quieta : ""}`}
      aria-label={`Composición de ${product.name}`}
      title={activeItem?.name}
      onPointerMove={isDetail && !editor ? onPointerMove : undefined}
      onPointerLeave={isDetail && !editor ? () => setActive(null) : undefined}
      style={encuadrar ? { aspectRatio: `1 / ${proporcion}` } : undefined}
    >
      <div className={encuadrar ? `${styles.lienzo} ${styles.lienzoEncuadrado}` : styles.lienzo} style={encuadrar ? encuadre(proporcion) : undefined}>
      <div className={styles.baseLayer}>
        {base ? (
          <img
            key={base}
            className={styles.baseImage}
            src={base}
            alt={`Base de ${product.name}`}
            style={{ transform: `translate(${ajuste.x}cqw, ${ajuste.y * LIENZO}cqw) rotate(${ajuste.giro}deg) scale(${ajuste.escala / 100})` }}
          />
        ) : (
          <span className={styles.baseEmoji} aria-hidden="true">{product.emoji}</span>
        )}
      </div>

      {product.visualItems.map((item, index) => (
        <div
          className={`${styles.itemLayer} ${editor ? (index === resaltado ? styles.itemResaltado : "") : index === active ? styles.itemActive : ""}`}
          data-indice={index}
          key={`${item.name}-${index}`}
          ref={(node) => { layerRefs.current[index] = node; }}
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            zIndex: item.zIndex ?? 5,
            transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
            // Hacia dónde se abre cada producto al pasar el mouse por la tarjeta.
            "--ex": `${(item.left - 50) * 0.78}cqw`,
            "--ey": `${(item.top - 70) * 0.65 - 4.6}cqw`,
            "--order": dropOrder.indexOf(index),
          } as React.CSSProperties}
        >
          {item.image ? (
            <img
              className={styles.itemImage}
              // Con CORS se puede leer la transparencia de la foto y responder solo sobre la silueta.
              crossOrigin="anonymous"
              src={item.image}
              alt={item.name}
              style={{ width: anchoProducto(item.size) }}
            />
          ) : (
            <span
              className={styles.itemEmoji}
              aria-label={item.name}
              role="img"
              style={{ fontSize: anchoProducto(item.size) }}
            >
              {item.emoji}
            </span>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
