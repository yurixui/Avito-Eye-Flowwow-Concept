import { type CSSProperties, type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/router";
import { LottiePlayer } from "@/shared/components/LottiePlayer";
import { useCamera } from "@/shared/hooks/useCamera";
import { useWidthScale } from "@/shared/hooks/useWidthScale";
import styles from "./CameraScreen.module.css";

const DESIGN_WIDTH = 375;
const VISION_API_URL =
  import.meta.env.VITE_AVITO_EYE_VISION_API_URL ?? "https://cover-myth-thing-railroad.trycloudflare.com";
const THINKING_PHRASES = ["Вникаю...", "Анализирую...", "Дайте-ка подумать.."];

type AnalysisState = "idle" | "thinking" | "found" | "error";

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisionResult {
  label: string;
  confidence?: number;
  bbox?: DetectionBox;
  avitoCount?: number;
  listings?: Listing[];
}

interface Listing {
  id: string;
  title: string;
  price: string;
  image: string;
}

interface ObjectSummary {
  title: string;
  category: string;
  subcategory: string;
  count: number;
  listings: Listing[];
}

const DEFAULT_LISTINGS: Listing[] = [
  { id: "1", title: "Игровая мышь Logitech G, RGB", price: "4 800 ₽", image: "/images/home-screen/product-mouse.avif" },
  { id: "2", title: "Logitech G Pro Wireless", price: "6 500 ₽", image: "/images/home-screen/product-mouse.avif" },
  { id: "3", title: "Компьютерная мышь Logitech", price: "2 900 ₽", image: "/images/home-screen/product-mouse.avif" },
  { id: "4", title: "Мышь Logitech с подсветкой", price: "3 700 ₽", image: "/images/home-screen/product-mouse.avif" },
];

function cleanModelLabel(label?: string) {
  return (label ?? "объект")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function getObjectSummary(label?: string): ObjectSummary {
  const cleanLabel = cleanModelLabel(label).toLowerCase();

  if (cleanLabel.includes("мыш") || cleanLabel.includes("mouse") || cleanLabel.includes("logitech")) {
    return {
      title: "Игровая мышь Logitech",
      category: "Электроника",
      subcategory: "Периферия",
      count: DEFAULT_LISTINGS.length,
      listings: DEFAULT_LISTINGS,
    };
  }

  if (cleanLabel.includes("авто") || cleanLabel.includes("vinfast") || cleanLabel.includes("car")) {
    return {
      title: "Автомобиль Vinfast VF3",
      category: "Транспорт",
      subcategory: "Автомобили",
      listings: [
        { id: "1", title: "Vinfast VF7 2024, 8 300 км", price: "2 225 000 ₽", image: "/images/home-screen/product-car.avif" },
        { id: "2", title: "Vinfast VF7 2025, 30 000 км", price: "1 200 000 ₽", image: "/images/home-screen/product-car.avif" },
        { id: "3", title: "Vinfast VF3, без пробега", price: "1 790 000 ₽", image: "/images/home-screen/product-car.avif" },
        { id: "4", title: "Vinfast VF3 электро", price: "1 650 000 ₽", image: "/images/home-screen/product-car.avif" },
      ],
      count: 4,
    };
  }

  if (cleanLabel.includes("стол") || cleanLabel.includes("table")) {
    return {
      title: "Металлический стол",
      category: "Для дома",
      subcategory: "Мебель",
      listings: [
        { id: "1", title: "Стол металлический рабочий", price: "18 900 ₽", image: "/images/home-screen/product-table.avif" },
        { id: "2", title: "Стол loft металл", price: "12 500 ₽", image: "/images/home-screen/product-table.avif" },
        { id: "3", title: "Письменный стол металл", price: "9 800 ₽", image: "/images/home-screen/product-table.avif" },
        { id: "4", title: "Стол дизайнерский", price: "24 000 ₽", image: "/images/home-screen/product-table.avif" },
      ],
      count: 4,
    };
  }

  const title = cleanModelLabel(label).slice(0, 32) || "Похожий товар";
  const listings = DEFAULT_LISTINGS.map((listing) => ({
    ...listing,
    title: `${title} на Авито`.slice(0, 44),
  }));

  return {
    title,
    category: "Товары",
    subcategory: "Разное",
    count: listings.length,
    listings,
  };
}

function mergeVisionSummary(result: VisionResult | null): ObjectSummary {
  const summary = getObjectSummary(result?.label);
  const listings = result?.listings?.length ? result.listings : summary.listings;

  return {
    ...summary,
    listings,
    count: result?.avitoCount ?? listings.length,
  };
}

function useTypingPhrases(active: boolean) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active) {
      setText("");
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer = 0;

    const tick = () => {
      const phrase = THINKING_PHRASES[phraseIndex];
      setText(phrase.slice(0, charIndex));

      if (!deleting && charIndex < phrase.length) {
        charIndex += 1;
        timer = window.setTimeout(tick, 70);
        return;
      }

      if (!deleting) {
        deleting = true;
        timer = window.setTimeout(tick, 900);
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        timer = window.setTimeout(tick, 36);
        return;
      }

      deleting = false;
      phraseIndex = (phraseIndex + 1) % THINKING_PHRASES.length;
      timer = window.setTimeout(tick, 240);
    };

    timer = window.setTimeout(tick, 120);
    return () => window.clearTimeout(timer);
  }, [active]);

  return text;
}

async function captureVideoFrame(video: HTMLVideoElement | null) {
  const canvas = document.createElement("canvas");
  const width = video?.videoWidth || 750;
  const height = video?.videoHeight || 1000;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (context) {
    if (video?.videoWidth && video.videoHeight) {
      context.drawImage(video, 0, 0, width, height);
    } else {
      context.fillStyle = "#101010";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.fillRect(width * 0.2, height * 0.28, width * 0.6, height * 0.36);
    }
  }

  return new Promise<{ blob: Blob; url: string }>((resolve) => {
    canvas.toBlob((blob) => {
      const frameBlob = blob ?? new Blob();
      resolve({
        blob: frameBlob,
        url: URL.createObjectURL(frameBlob),
      });
    }, "image/jpeg", 0.88);
  });
}

async function analyzeFrame(blob: Blob): Promise<VisionResult> {
  const formData = new FormData();
  formData.append("file", blob, "camera-frame.jpg");

  const response = await fetch(`${VISION_API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Vision API request failed");
  }

  return response.json();
}

function normalizeBox(result: VisionResult | null): DetectionBox {
  const box = result?.bbox;
  if (!box) {
    return { x: 29, y: 298, width: 315, height: 236 };
  }

  return {
    x: Math.max(20, Math.min(330, box.x)),
    y: Math.max(170, Math.min(520, box.y)),
    width: Math.max(72, Math.min(335, box.width)),
    height: Math.max(72, Math.min(360, box.height)),
  };
}

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
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [frozenFrameUrl, setFrozenFrameUrl] = useState<string | null>(null);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [isGradientVisible, setIsGradientVisible] = useState(false);
  const [isGradientLeaving, setIsGradientLeaving] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const { videoRef, state } = useCamera(facingMode);
  const contentRef = useWidthScale<HTMLDivElement>(DESIGN_WIDTH);
  const requestIdRef = useRef(0);
  const dragStartYRef = useRef<number | null>(null);
  const typingText = useTypingPhrases(analysisState === "thinking");
  const objectSummary = useMemo(() => mergeVisionSummary(visionResult), [visionResult]);

  const close = () => navigate(ROUTES.home);
  const flipCamera = () => setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  const isProcessing = analysisState !== "idle";
  const isResult = analysisState === "found" || analysisState === "error";
  const objectBox = normalizeBox(visionResult);
  const objectWindowStyle = {
    left: `${objectBox.x}px`,
    top: `${objectBox.y}px`,
    width: `${objectBox.width}px`,
    height: `${objectBox.height}px`,
  } satisfies CSSProperties;
  const processSheetStyle =
    sheetOffset > 0
      ? ({
          transform: `translateY(${sheetOffset}px)`,
        } satisfies CSSProperties)
      : undefined;

  const startAnalysis = async () => {
    if (analysisState === "thinking") return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const frame = await captureVideoFrame(videoRef.current);
    setFrozenFrameUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return frame.url;
    });
    setSheetOffset(0);
    setIsSheetDragging(false);
    setIsSheetClosing(false);
    setIsGradientVisible(true);
    setIsGradientLeaving(false);
    setAnalysisState("thinking");
    setVisionResult(null);

    try {
      const result = await analyzeFrame(frame.blob);
      if (requestIdRef.current !== requestId) return;

      setVisionResult(result);
      setAnalysisState("found");
      setIsGradientLeaving(true);
      window.setTimeout(() => {
        setIsGradientVisible(false);
        setIsGradientLeaving(false);
      }, 420);
    } catch {
      if (requestIdRef.current !== requestId) return;

      setVisionResult({
        label: "объект",
        confidence: 0,
        bbox: { x: 29, y: 298, width: 315, height: 236 },
      });
      setAnalysisState("error");
      setIsGradientLeaving(true);
      window.setTimeout(() => {
        setIsGradientVisible(false);
        setIsGradientLeaving(false);
      }, 420);
    }
  };

  const resetAnalysis = () => {
    requestIdRef.current += 1;
    setIsSheetClosing(false);
    setIsSheetDragging(false);
    setSheetOffset(0);
    setIsGradientVisible(false);
    setIsGradientLeaving(false);
    setAnalysisState("idle");
    setVisionResult(null);
    setFrozenFrameUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return null;
    });
  };

  const closeProcessSheet = () => {
    if (!isProcessing || isSheetClosing) return;

    dragStartYRef.current = null;
    setIsSheetDragging(false);
    setIsSheetClosing(true);
    window.requestAnimationFrame(() => {
      setSheetOffset(isResult ? 780 : 520);
    });
    window.setTimeout(resetAnalysis, 560);
  };

  const handleSheetPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    setIsSheetDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null || isSheetClosing) return;

    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    setSheetOffset(Math.min(nextOffset, isResult ? 720 : 430));
  };

  const handleSheetPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;

    const finalOffset = Math.max(0, event.clientY - dragStartYRef.current);
    dragStartYRef.current = null;
    setIsSheetDragging(false);

    if (finalOffset > 86) {
      closeProcessSheet();
      return;
    }

    setSheetOffset(0);
  };

  useEffect(() => {
    return () => {
      if (frozenFrameUrl) URL.revokeObjectURL(frozenFrameUrl);
    };
  }, [frozenFrameUrl]);

  return (
    <div className={styles.screen}>
      {/* 1. camera-on — live feed, z-index bottom */}
      {state === "ready" && <video ref={videoRef} className={styles.video} autoPlay playsInline muted />}
      {frozenFrameUrl && <img className={styles.frozenFrame} src={frozenFrameUrl} alt="" />}
      {(state === "denied" || state === "unsupported") && (
        <p className={styles.fallback}>
          Нет доступа к камере. Разрешите доступ в настройках браузера, чтобы протестировать поиск по фото.
        </p>
      )}

      {/* 2-3. Camera UI overlay */}
      <div className={styles.content} ref={contentRef}>
        <div className={styles.opacityUpperCamera} />

        <header className={styles.appBar}>
          {/* invisible 40x40 spacer (Figma node 726:3642, opacity 0) balances
              the close button so the title stays optically centered */}
          <span className={styles.appBarSpacer} aria-hidden />
          <h1 className={styles.appBarTitle}>Поиск по фото</h1>
          <button className={styles.closeButton} onClick={close} aria-label="Закрыть">
            <img src="/images/camera-screen/icon-close.svg" alt="" />
          </button>
        </header>

        {!isProcessing && <img className={styles.cropFrame} src="/images/camera-screen/crop-frame.svg" alt="" />}

        {!isProcessing && (
          <div className={styles.helpWrapper}>
            <img className={styles.helpIcon} src="/images/camera-screen/help-wrapper-icon.svg" alt="" />
            <span className={styles.helpText}>Наведите камеру на объект</span>
          </div>
        )}

        <button
          className={styles.shutter}
          onClick={startAnalysis}
          disabled={analysisState === "thinking"}
          aria-label="Найти по фото"
        >
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

        {isProcessing && (
          <div className={styles.processLayer}>
            {isGradientVisible && (
              <div className={`${styles.processGradient} ${isGradientLeaving ? styles.processGradientLeaving : ""}`}>
                <img className={styles.gradientVector11} src="/images/camera-screen/gradient-vector-11.svg" alt="" />
                <img className={styles.gradientVector13} src="/images/camera-screen/gradient-vector-13.svg" alt="" />
                <img className={styles.gradientVector12} src="/images/camera-screen/gradient-vector-12.svg" alt="" />
                <img className={styles.gradientVector14} src="/images/camera-screen/gradient-vector-14.svg" alt="" />
                <img className={styles.gradientVector15} src="/images/camera-screen/gradient-vector-15.svg" alt="" />
                <img className={styles.gradientVector16} src="/images/camera-screen/gradient-vector-16.svg" alt="" />
              </div>
            )}

            {analysisState !== "thinking" && (
              <div className={styles.objectWindow} style={objectWindowStyle} aria-hidden>
                <span className={styles.cornerTopLeft} />
                <span className={styles.cornerTopRight} />
                <span className={styles.cornerBottomLeft} />
                <span className={styles.cornerBottomRight} />
              </div>
            )}

            <img className={styles.objectDot} src="/images/camera-screen/dot-object.svg" alt="" />

            <div
              className={`${styles.processSheet} ${isResult ? styles.processSheetResult : ""} ${isSheetDragging ? styles.processSheetDragging : ""} ${isSheetClosing ? styles.processSheetClosing : ""}`}
              style={processSheetStyle}
              onPointerDown={handleSheetPointerDown}
              onPointerMove={handleSheetPointerMove}
              onPointerUp={handleSheetPointerUp}
              onPointerCancel={handleSheetPointerUp}
            >
              <div className={styles.sheetHandle} />
              {analysisState === "thinking" ? (
                <div className={styles.processStatus}>
                  <LottiePlayer className={styles.processLottie} path="/data.json" />
                  <span className={styles.processText}>{typingText || "Вникаю..."}</span>
                </div>
              ) : (
                <div className={styles.resultContent}>
                  <div className={styles.resultSearchBar}>
                    <div className={styles.resultPhoto}>
                      {frozenFrameUrl && <img src={frozenFrameUrl} alt="" />}
                    </div>
                    <div className={styles.resultSearchHint}>
                      <img src="/images/camera-screen/assistant-icon.svg" alt="" />
                      <span>Дополнить запрос</span>
                    </div>
                  </div>

                  <section className={styles.objectInfo}>
                    <div className={styles.objectNameGroup}>
                      <h2>{objectSummary.title}</h2>
                      <div className={styles.objectCategory}>
                        <span>{objectSummary.category}</span>
                        <span className={styles.categoryArrow}>›</span>
                        <span>{objectSummary.subcategory}</span>
                      </div>
                    </div>

                    <div className={styles.feedbackBar}>
                      <span>Это то, что вы искали?</span>
                      <div className={styles.feedbackActions}>
                        <button type="button">Да</button>
                        <button type="button">Нет</button>
                      </div>
                    </div>
                  </section>

                  <section className={styles.resultsBlock}>
                    <h3>Найдено {objectSummary.count} объявлений в Москве</h3>
                    <div className={styles.resultsGrid}>
                      {objectSummary.listings.map((listing) => (
                        <article className={styles.resultCard} key={listing.id}>
                          <div className={styles.resultCardImage}>
                            <img src={listing.image} alt="" />
                          </div>
                          <div className={styles.resultCardBody}>
                            <p className={styles.resultCardTitle}>{listing.title}</p>
                            <p className={styles.resultCardPrice}>{listing.price}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
