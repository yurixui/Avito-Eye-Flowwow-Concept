import { SearchBar } from "./components/SearchBar";
import { AvitoEyePeeker } from "./components/AvitoEyePeeker";
import { CategoryGrid } from "./components/CategoryGrid";
import { ProductGrid } from "./components/ProductGrid";
import { TabBar } from "./components/TabBar";
import { useWidthScale } from "@/shared/hooks/useWidthScale";
import styles from "./HomeScreen.module.css";

const DESIGN_WIDTH = 375;

// Node 677:4811 ("Home"). Fixed: header (search + peeker) and tab bar.
// Scroll: categories + product grid (677:4812, taller than the viewport).
// scaleRoot scales the whole 375px-wide design uniformly for wider real
// devices (375 = 100% baseline, per spec) — see useWidthScale.
export function HomeScreen() {
  const scaleRef = useWidthScale<HTMLDivElement>(DESIGN_WIDTH);

  return (
    <div className={styles.screen}>
      <div className={styles.scaleRoot} ref={scaleRef}>
        <div className={styles.header}>
          <img className={styles.topSwoop} src="/images/home-screen/top-swoop.svg" alt="" />
          <SearchBar />
          <AvitoEyePeeker />
        </div>

        <div className={styles.scroll}>
          <CategoryGrid />
          <ProductGrid />
        </div>

        <div className={styles.tabBar}>
          <TabBar />
        </div>
      </div>
    </div>
  );
}
