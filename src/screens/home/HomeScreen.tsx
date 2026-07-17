import { type CSSProperties, type PointerEvent, type TransitionEvent, useEffect, useRef, useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { AvitoEyePeeker } from "./components/AvitoEyePeeker";
import { CategoryGrid } from "./components/CategoryGrid";
import { ProductGrid } from "./components/ProductGrid";
import { TabBar } from "./components/TabBar";
import { useWidthScale } from "@/shared/hooks/useWidthScale";
import styles from "./HomeScreen.module.css";

const DESIGN_WIDTH = 375;
const HOME_MODAL_DELAY_MS = 1000;
const HOME_MODAL_CLOSE_THRESHOLD = 72;

// Node 677:4811 ("Home"). Fixed: header (search + peeker) and tab bar.
// Scroll: categories + product grid (677:4812, taller than the viewport).
// scaleRoot scales the whole 375px-wide design uniformly for wider real
// devices (375 = 100% baseline, per spec) — see useWidthScale.
export function HomeScreen() {
  const scaleRef = useWidthScale<HTMLDivElement>(DESIGN_WIDTH);
  const [modalMounted, setModalMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (modalDismissed) return;

    const timer = window.setTimeout(() => {
      setModalMounted(true);
      window.requestAnimationFrame(() => setModalOpen(true));
    }, HOME_MODAL_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [modalDismissed]);

  const closeHomeModal = () => {
    setModalDismissed(true);
    setModalOpen(false);
    setDragY(0);
  };

  const onModalPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStartY.current = event.clientY;
    setDragY(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onModalPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    setDragY(Math.max(0, event.clientY - dragStartY.current));
  };

  const finishModalDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    isDragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (dragY > HOME_MODAL_CLOSE_THRESHOLD) {
      closeHomeModal();
      return;
    }

    setDragY(0);
  };

  const onModalTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "transform" || modalOpen) return;
    setModalMounted(false);
  };

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

        {modalMounted && (
          <div className={`${styles.homeModalLayer} ${modalOpen ? styles.homeModalLayerOpen : ""}`}>
            <button className={styles.homeModalOverlay} type="button" aria-label="Закрыть окно" onClick={closeHomeModal} />

            <div
              className={`${styles.homeModal} ${modalOpen ? styles.homeModalOpen : ""} ${isDragging.current ? styles.homeModalDragging : ""}`}
              style={{ "--home-modal-drag-y": `${dragY}px` } as CSSProperties}
              onPointerDown={onModalPointerDown}
              onPointerMove={onModalPointerMove}
              onPointerUp={finishModalDrag}
              onPointerCancel={finishModalDrag}
              onTransitionEnd={onModalTransitionEnd}
            >
              <div className={styles.homeModalHandleContainer}>
                <div className={styles.homeModalHandle} />
              </div>

              <div className={styles.homeModalContent}>
                <video
                  className={styles.homeModalVideo}
                  src="/videos/home-screen/home-ficha-animation.mp4"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                />

                <div className={styles.homeModalCopy}>
                  <h2>Ищите по фото</h2>
                  <p>
                    Наведите камеру на вещь,
                    <br />
                    а мы подскажем, что это, и найдём похожие объявления.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
