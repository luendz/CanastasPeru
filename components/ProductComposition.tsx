import type { Product } from "@/lib/mock-data";
import styles from "./ProductComposition.module.css";

type ProductCompositionProps = {
  product: Product;
  variant?: "card" | "detail";
  /** Sustituye la canasta propia del producto por otro tipo elegido. */
  baseImage?: string;
};

export default function ProductComposition({ product, variant = "card", baseImage }: ProductCompositionProps) {
  const sizeMultiplier = variant === "detail" ? 1.65 : 1;
  const base = baseImage ?? product.baseImage;

  return (
    <div className={`${styles.composition} ${variant === "detail" ? styles.detail : styles.card}`} aria-label={`Composición de ${product.name}`}>
      <div className={styles.baseLayer}>
        {base ? (
          <img className={styles.baseImage} src={base} alt={`Base de ${product.name}`} />
        ) : (
          <span className={styles.baseEmoji} aria-hidden="true">{product.emoji}</span>
        )}
      </div>

      {product.visualItems.map((item) => (
        <div
          className={styles.itemLayer}
          key={item.name}
          title={variant === "detail" ? item.name : undefined}
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            zIndex: item.zIndex ?? 5,
            transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
          }}
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
