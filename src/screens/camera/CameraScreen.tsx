import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/router";
import { useCamera } from "@/shared/hooks/useCamera";
import { useWidthScale } from "@/shared/hooks/useWidthScale";
import styles from "./CameraScreen.module.css";

const DESIGN_WIDTH = 375;

// Node 726:3611 ("Avito Eye / Camera / Default"). Layer stack, bottom → top:
//   1. camera-on (726:3671)          — the live device camera feed, BELOW
//      everything else by z-index (empty frame in Figma; here it's <video>).
//   2. opacity-upper-camera (726:3669) — gradient that darkens the top/bottom
//      edges so the white UI stays readable over any camera image.
//   3. 2-eye-content (726:3620)      — the UI: app bar, crop frame, shutter,
//      bottom toolbar. Scaled as a 375-wide design like Home.
export function CameraScreen() {
  const navigate = useNavigate();
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const { videoRef, state } = useCamera(facingMode);
  const contentRef = useWidthScale<HTMLDivElement>(DESIGN_WIDTH);

  const close = () => navigate(ROUTES.home);
  const flipCamera = () => setFacingMode((m) => (m === "environment" ? "user" : "environment"));

  return (
    <div className={styles.screen}>
      {/* 1. camera-on — live feed, z-index bottom */}
      {state === "ready" && <video ref={videoRef} className={styles.video} autoPlay playsInline muted />}
      {(state === "denied" || state === "unsupported") && (
        <p className={styles.fallback}>
          Нет доступа к камере. Разрешите доступ в настройках браузера, чтобы протестировать поиск по фото.
        </p>
      )}

      {/* 2. opacity-upper-camera — top/bottom darkening gradient */}
      <div className={styles.gradientOverlay} />

      {/* 3. 2-eye-content — UI overlay */}
      <div className={styles.content} ref={contentRef}>
        <header className={styles.appBar}>
          {/* invisible 40x40 spacer (Figma node 726:3642, opacity 0) balances
              the close button so the title stays optically centered */}
          <span className={styles.appBarSpacer} aria-hidden />
          <h1 className={styles.appBarTitle}>Поиск по фото</h1>
          <button className={styles.closeButton} onClick={close} aria-label="Закрыть">
            <img src="/images/camera-screen/icon-close.svg" alt="" />
          </button>
        </header>

        <img className={styles.cropFrame} src="/images/camera-screen/crop-frame.svg" alt="" />

        <button className={styles.shutter} aria-label="Найти по фото">
          <span className={styles.shutterInner}>
            <img className={styles.shutterGlyph} src="/images/camera-screen/shutter-glyph.svg" alt="" />
          </span>
        </button>

        <div className={styles.bottomIcons}>
          <button className={styles.toolButton} aria-label="Вспышка">
            <img src="/images/camera-screen/icon-flash.svg" alt="" />
          </button>
          <button className={styles.toolButton} aria-label="Зум 1x">
            <img className={styles.zoomIcon} src="/images/camera-screen/icon-1x.svg" alt="1x" />
          </button>
          <button className={styles.toolButton} onClick={flipCamera} aria-label="Перевернуть камеру">
            <img src="/images/camera-screen/icon-rotate.svg" alt="" />
          </button>
        </div>
      </div>
    </div>
  );
}
