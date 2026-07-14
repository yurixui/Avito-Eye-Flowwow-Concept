import styles from "./TabBar.module.css";

// Node 677:5026 ("TabBar" / "Deprecated_TabBar").
export function TabBar() {
  return (
    <nav className={styles.bar}>
      <div className={styles.item}>
        <img className={styles.logo} src="/images/home-screen/tabbar-logo.svg" alt="Avito" />
      </div>
      <button className={styles.item} aria-label="Избранное">
        <img className={styles.icon} src="/images/home-screen/tabbar-favourites.svg" alt="" />
      </button>
      <button className={styles.item} aria-label="Разместить объявление">
        <img className={styles.icon} src="/images/home-screen/tabbar-post.svg" alt="" />
      </button>
      <button className={styles.item} aria-label="Сообщения">
        <img className={styles.icon} src="/images/home-screen/tabbar-messages.svg" alt="" />
        <span className={styles.badge}>9</span>
      </button>
      <button className={styles.item} aria-label="Ассистент">
        <img className={styles.icon} src="/images/home-screen/tabbar-assistant.svg" alt="" />
      </button>
      <button className={styles.item} aria-label="Профиль">
        <img className={styles.avatar} src="/images/home-screen/tabbar-avatar.svg" alt="" />
      </button>
    </nav>
  );
}
