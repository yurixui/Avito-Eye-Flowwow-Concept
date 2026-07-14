import { mockCategories } from "@/entities/product/mockProducts";
import styles from "./CategoryGrid.module.css";

// Nodes 677:4901–677:4930 (category chip rows). Both rows overflow the
// 375px frame in Figma (cards run off the right edge), so they're
// horizontally scrollable chip strips rather than a wrapping grid.
export function CategoryGrid() {
  const [row1, row2] = [mockCategories.slice(0, 4), mockCategories.slice(4)];

  return (
    <div className={styles.grid}>
      {[row1, row2].map((row, i) => (
        <div className={styles.row} key={i}>
          {row.map((category) => (
            <div className={styles.card} style={{ width: category.width }} key={category.id}>
              <img className={styles.image} src={category.image} alt="" />
              <p className={styles.title}>
                {category.title.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
