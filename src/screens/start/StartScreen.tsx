import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/router";
import styles from "./StartScreen.module.css";

// Pixel-parity implementation of node 677:9283 ("Start").
export function StartScreen() {
  const navigate = useNavigate();

  return (
    <div className={styles.screen}>
      <img className={styles.gradient} src="/images/0-screen/0-gradient.avif" alt="" />

      <div className={styles.content}>
        <img className={styles.logo} src="/images/0-screen/0-avitoeye.avif" alt="Avito Eye" />

        <h1 className={styles.title}>
          Визуальный поиск
          <br />в Авито
        </h1>

        <p className={styles.subtitle}>
          Наведи камеру на любую вещь —
          <br />и Авито найдёт похожие объявления
        </p>

        <div className={styles.ctaWrap}>
          <button className={styles.cta} onClick={() => navigate(ROUTES.home)}>
            Начать
          </button>
        </div>

        <p className={styles.disclaimer}>*Прототип команды Флаувау*</p>
      </div>
    </div>
  );
}
