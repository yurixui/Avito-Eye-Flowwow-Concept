import { type CSSProperties, useEffect, useRef, useState } from "react";
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

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? new Blob()), "image/jpeg", 0.88);
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
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const { videoRef, state } = useCamera(facingMode);
  const contentRef = useWidthScale<HTMLDivElement>(DESIGN_WIDTH);
  const requestIdRef = useRef(0);
  const typingText = useTypingPhrases(analysisState === "thinking");

  const close = () => navigate(ROUTES.home);
  const flipCamera = () => setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  const isProcessing = analysisState !== "idle";
  const objectBox = normalizeBox(visionResult);
  const objectWindowStyle = {
    left: `${objectBox.x}px`,
    top: `${objectBox.y}px`,
    width: `${objectBox.width}px`,
    height: `${objectBox.height}px`,
  } satisfies CSSProperties;

  const startAnalysis = async () => {
    if (analysisState === "thinking") return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setAnalysisState("thinking");
    setVisionResult(null);

    try {
      const blob = await captureVideoFrame(videoRef.current);
      const result = await analyzeFrame(blob);
      if (requestIdRef.current !== requestId) return;

      setVisionResult(result);
      setAnalysisState("found");
    } catch {
      if (requestIdRef.current !== requestId) return;

      setVisionResult({
        label: "объект",
        confidence: 0,
        bbox: { x: 29, y: 298, width: 315, height: 236 },
      });
      setAnalysisState("error");
    }
  };

  return (
    <div className={styles.screen}>
      {/* 1. camera-on — live feed, z-index bottom */}
      {state === "ready" && <video ref={videoRef} className={styles.video} autoPlay playsInline muted />}
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

        <img className={styles.cropFrame} src="/images/camera-screen/crop-frame.svg" alt="" />

        {!isProcessing && (
          <div className={styles.helpWrapper}>
            <img className={styles.helpIcon} src="/images/camera-screen/shutter-glyph.svg" alt="" />
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
            {analysisState === "thinking" && <div className={styles.processGradient} />}

            {analysisState !== "thinking" && (
              <div className={styles.objectWindow} style={objectWindowStyle} aria-hidden>
                <span className={styles.cornerTopLeft} />
                <span className={styles.cornerTopRight} />
                <span className={styles.cornerBottomLeft} />
                <span className={styles.cornerBottomRight} />
                <span className={styles.objectDot} />
              </div>
            )}

            <div className={styles.processSheet}>
              <div className={styles.sheetHandle} />
              <div className={styles.processStatus}>
                <LottiePlayer className={styles.processLottie} path="/data.json" />
                <span className={styles.processText}>
                  {analysisState === "thinking"
                    ? typingText || "Вникаю..."
                    : analysisState === "error"
                      ? "Похоже, это объект"
                      : `Похоже, это ${visionResult?.label ?? "объект"}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
