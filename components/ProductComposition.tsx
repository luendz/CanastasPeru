"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/mock-data";
import styles from "./ProductComposition.module.css";

type ProductCompositionProps = {
  product: Product;
  variant?: "card" | "detail";
  /** Sustituye la canasta propia del producto por otro tipo elegido. */
  baseImage?: string;
  /** Los productos caen uno a uno dentro de la canasta al montarse. */
  assemble?: boolean;
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
function hitsVisiblePixel(layer: HTMLElement, rotate: number, clientX: number, clientY: number) {
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

export default function ProductComposition({ product, variant = "card", baseImage, assemble = false }: ProductCompositionProps) {
  const isDetail = variant === "detail";
  const sizeMultiplier = isDetail ? 1.65 : 1;
  const base = baseImage ?? product.baseImage;

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

  const activeItem = active !== null ? product.visualItems[active] : undefined;
  // Orden de caída: primero lo que va al fondo, al final lo que queda delante.
  const dropOrder = [...stacking].reverse().map(({ index }) => index);

  return (
    <div
      className={`${styles.composition} ${isDetail ? styles.detail : styles.card} ${activeItem ? styles.hasActive : ""} ${assemble ? styles.assemble : ""}`}
      aria-label={`Composición de ${product.name}`}
      title={activeItem?.name}
      onPointerMove={isDetail ? onPointerMove : undefined}
      onPointerLeave={isDetail ? () => setActive(null) : undefined}
    >
      <div className={styles.baseLayer}>
        {base ? (
          <img key={base} className={styles.baseImage} src={base} alt={`Base de ${product.name}`} />
        ) : (
          <span className={styles.baseEmoji} aria-hidden="true">{product.emoji}</span>
        )}
      </div>

      {product.visualItems.map((item, index) => (
        <div
          className={`${styles.itemLayer} ${index === active ? styles.itemActive : ""}`}
          key={item.name}
          ref={(node) => { layerRefs.current[index] = node; }}
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            zIndex: item.zIndex ?? 5,
            transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
            // Hacia dónde se abre cada producto al pasar el mouse por la tarjeta.
            "--ex": `${(item.left - 50) * 2.4}px`,
            "--ey": `${(item.top - 70) * 2 - 14}px`,
            "--order": dropOrder.indexOf(index),
          } as React.CSSProperties}
        >
          {item.image ? (
            <img
              className={styles.itemImage}
              src={item.image}
              alt={item.name}
              style={{ width: `${item.size * sizeMultiplier}px` }}
            />
          ) : (
            <span
              className={styles.itemEmoji}
              aria-label={item.name}
              role="img"
              style={{ fontSize: `${item.size * sizeMultiplier}px` }}
            >
              {item.emoji}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
