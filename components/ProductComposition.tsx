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
 * Lo que ocupa a la vista el envase, en % del lienzo. Sin ajuste va de 18.5 a 81.5
 * de ancho y de 15 a 90 de alto; la forma real depende de cada foto, así que el alto
 * es aproximado y gira alrededor de un centro también aproximado.
 */
function limitesEnvase({ x, y, escala, giro }: AjusteEnvase) {
  const e = escala / 100;
  const coseno = Math.abs(Math.cos((giro * Math.PI) / 180));
  const seno = Math.abs(Math.sin((giro * Math.PI) / 180));
  const centro = 57;
  const [ancho, arriba, abajo] = [31.5 * e, (centro - 15) * e, (90 - centro) * e];
  const lado = ancho * coseno + Math.max(arriba, abajo) * LIENZO * seno;
  return {
    izquierda: 50 + x - lado,
    derecha: 50 + x + lado,
    arriba: centro + y - (arriba * coseno + (ancho / LIENZO) * seno),
    abajo: centro + y + (abajo * coseno + (ancho / LIENZO) * seno),
  };
}

/**
 * Encuadre de la tienda: amplía el lienzo y lo centra en lo que ocupa la canasta
 * con sus productos, para aprovechar el recuadro sin cortar nada. Las proporciones
 * no cambian. Todo va en % del lienzo.
 */
function encuadre(items: ProductVisualItem[], proporcion: number, ajuste: AjusteEnvase) {
  const envase = limitesEnvase(ajuste);
  const izquierda = Math.min(envase.izquierda, ...items.map((i) => i.left - i.size * 0.1));
  const derecha = Math.max(envase.derecha, ...items.map((i) => i.left + i.size * 0.1));
  const arriba = envase.arriba;
  const abajo = Math.max(envase.abajo, ...items.map((i) => i.top + i.size * 0.133));

  const escala = Math.min(1.45, 96 / (derecha - izquierda), (proporcion * 96) / (LIENZO * (abajo - arriba)));
  const altoRelativo = (LIENZO * escala) / proporcion;
  return {
    width: `${escala * 100}%`,
    left: `${50 - ((izquierda + derecha) / 2) * escala}%`,
    top: `${(100 - (abajo - arriba) * altoRelativo) / 2 - arriba * altoRelativo}%`,
  };
}

type ProductCompositionProps = {
  product: Product;
  variant?: "card" | "detail";
  /** Sustituye la canasta propia del producto por otro tipo elegido. */
  baseImage?: string;
  /** Los productos caen uno a uno dentro de la canasta al montarse. */
  assemble?: boolean;
  /** Alto del recuadro respecto a su ancho. */
  proporcion?: number;
  /** En el editor se muestra el lienzo completo, con margen para mover productos. */
  encuadrar?: boolean;
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

export { anchoProducto };

export default function ProductComposition({ product, variant = "card", baseImage, assemble = false, proporcion = 1, encuadrar = true }: ProductCompositionProps) {
  const isDetail = variant === "detail";
  const base = baseImage ?? product.baseImage;
  const ajuste = (base && product.ajustesEnvase?.[base]) || AJUSTE_NEUTRO;

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
      style={encuadrar ? { aspectRatio: `1 / ${proporcion}` } : undefined}
    >
      <div className={encuadrar ? `${styles.lienzo} ${styles.lienzoEncuadrado}` : styles.lienzo} style={encuadrar ? encuadre(product.visualItems, proporcion, ajuste) : undefined}>
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
          className={`${styles.itemLayer} ${index === active ? styles.itemActive : ""}`}
          key={item.name}
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
