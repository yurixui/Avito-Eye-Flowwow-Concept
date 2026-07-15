import type { Product } from "@/entities/product/types";
import styles from "./ProductCard.module.css";

// Node 677:4858 pattern (repeated for every card in 677:4812).
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <img className={styles.image} src={product.image} alt={product.title} loading="lazy" />
      </div>
      <div className={styles.body}>
        <div className={styles.info}>
          <p className={styles.title}>{product.title}</p>
          <p className={styles.price}>{product.price}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.actionButton} aria-label="В избранное">
            <img className={styles.actionIcon} src="/images/home-screen/icon-heart.svg" alt="" />
          </button>
          <button className={styles.actionButton} aria-label="Ещё">
            <img className={styles.actionIcon} src="/images/home-screen/icon-more.svg" alt="" />
          </button>
        </div>
      </div>
    </div>
  );
}
