import { mockProducts } from "@/entities/product/mockProducts";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.css";

// Node 728:3810 ("Product cards") + 677:4813 (trailing row).
export function ProductGrid() {
  return (
    <div className={styles.grid}>
      {mockProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
