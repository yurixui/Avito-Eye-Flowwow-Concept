import styles from "./SearchBar.module.css";

// Node 677:4976 ("Search Container").
export function SearchBar() {
  return (
    <div className={styles.bar}>
      <img className={styles.searchIcon} src="/images/home-screen/icon-search.svg" alt="" />
      <span className={styles.placeholder}>Поиск во всех регионах</span>
      <img className={styles.filterIcon} src="/images/home-screen/icon-filter.svg" alt="Фильтры" />
    </div>
  );
}
