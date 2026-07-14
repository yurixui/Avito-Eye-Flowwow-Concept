import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/router";
import { getAvitoEyeBlobPath, getAvitoEyeGlowClipPath } from "./avitoEyeBlobPath";
import { AvitoEyeGlowDefs, AvitoEyeGlowBlobs } from "./AvitoEyeGlow";
import { SearchOverlayIcon } from "./SearchOverlayIcon";
import styles from "./AvitoEyePeeker.module.css";

// Commit once dragged 40% of the screen width to the left, per spec.
const COMMIT_RATIO = 0.4;
// Rubber-band: diminishing visual pull as raw drag distance grows.
const RESISTANCE = 180;
// The glow's blob layers (AvitoEyeGlowBlobs) are a handful of small blurred
// shapes, not warped point-by-point like the clip mask around them (see
// avitoEyeBlobPath.ts) — that'd mean re-deriving 8 separate paths for a
// soft-focus fill. Instead they get one representative scale+shift, sampled
// at the mask's own rough center (x=20), so they keep filling the mask as
// it grows instead of leaving blank space at the edges.
const GLOW_BLOB_ORIGIN = { x: 22, y: 91 };
function glowBlobWeight(pull: number) {
  // Mirror warpPoint() from avitoEyeBlobPath.ts, sampled at the blob group's
  // origin, so the glow scales + shifts in step with the clip mask that's
  // warped point-by-point around it. Same constants (GROW 0.8, ANCHOR_X
  // 64.6836, STRETCH_PX 190, smoothstep weight).
  const p = Math.min(pull, 1.2);
  const n = Math.min(1, Math.max(0, (GLOW_BLOB_ORIGIN.x - 2) / (46.833 - 2)));
  const w = 1 - n * n * (3 - 2 * n);
  const scale = 1 + p * 0.8 * w;
  // Net horizontal displacement of the origin under the same scale-about-
  // anchor + tip pull, so translateX tracks where its clip mask actually goes.
  const shiftX = 64.6836 + (GLOW_BLOB_ORIGIN.x - 64.6836) * scale - p * 190 * w - GLOW_BLOB_ORIGIN.x;
  return { scale, shiftX };
}

type Phase = "rest" | "dragging" | "returning" | "committing";

function rubberBand(dx: number) {
  return 1 - 1 / (1 + Math.max(0, dx) / RESISTANCE);
}

// Node 820:4642 ("Avito-eye") — the draggable peeker. Grab it and pull left:
// it stretches AND grows like taffy — both wider (tip pulls out, weighted
// per-point in avitoEyeBlobPath.ts) and taller (same weighting pushes
// points away from the vertical center) — anchored to the screen edge.
// Past the commit threshold, releasing snaps it into a full-screen black
// fill and hands off to the Camera screen; short of that, it springs back
// to rest.
//
// .root is the stable anchor (never transformed) matching Avito-eye's
// Figma frame exactly; .wrap (the actual svg, sized to the path's bleed)
// is what gets `scale(40)` on commit. SearchOverlayIcon is a sibling of
// .wrap, not a child — it must never inherit that scale, only fade out in
// place — see the commit()/phase-driven opacity below.
//
// Event handlers read/write `phaseRef` (not the `phase` state) for gating —
// setState is batched/async, so a pointerdown immediately followed by a
// pointermove (same tick, e.g. a fast real drag or a fast synthetic test)
// could otherwise still see the pre-drag "rest" phase from a stale closure.
// `phase` state exists only to drive the CSS transition class.
export function AvitoEyePeeker() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState<Phase>("rest");
  const phaseRef = useRef<Phase>("rest");
  const startXRef = useRef(0);
  const dxRef = useRef(0);
  const springRef = useRef<number | null>(null);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const stopSpring = () => {
    if (springRef.current !== null) {
      cancelAnimationFrame(springRef.current);
      springRef.current = null;
    }
  };

  const springBackToRest = () => {
    stopSpring();
    let position = pull;
    let velocity = 0;
    const stiffness = 0.22;
    const damping = 0.72;

    const step = () => {
      const accel = -stiffness * position;
      velocity = (velocity + accel) * damping;
      position += velocity;
      if (Math.abs(position) < 0.002 && Math.abs(velocity) < 0.002) {
        setPull(0);
        setPhaseBoth("rest");
        springRef.current = null;
        return;
      }
      setPull(position);
      springRef.current = requestAnimationFrame(step);
    };
    springRef.current = requestAnimationFrame(step);
  };

  const commit = () => {
    stopSpring();
    setPhaseBoth("committing");
    setPull(1.45); // quick final snap-through before the screen-fill scale
    setTimeout(() => {
      const wrap = wrapRef.current;
      if (wrap) wrap.style.transform = "scale(40)";
    }, 90);
    setTimeout(() => navigate(ROUTES.camera), 90 + 420);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current === "committing") return;
    stopSpring();
    startXRef.current = e.clientX;
    dxRef.current = 0;
    setPhaseBoth("dragging");
    // Best-effort: keeps the drag tracking even if the pointer leaves the
    // SVG's bounds. Not load-bearing — must never block dragging if the
    // browser refuses capture (e.g. no active pointer session).
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (phaseRef.current !== "dragging") return;
    const dx = startXRef.current - e.clientX;
    dxRef.current = dx;
    setPull(rubberBand(dx));
  };

  const endDrag = () => {
    if (phaseRef.current !== "dragging") return;
    const screenWidth = rootRef.current?.parentElement?.clientWidth ?? 375;
    if (dxRef.current >= screenWidth * COMMIT_RATIO) {
      commit();
    } else {
      setPhaseBoth("returning");
      springBackToRest();
    }
  };

  useEffect(() => stopSpring, []);

  const wrapClass = [styles.wrap, phase === "returning" && styles.returning, phase === "committing" && styles.committing]
    .filter(Boolean)
    .join(" ");
  const overlayClass = [styles.overlayIcon, phase === "committing" && styles.overlayFading].filter(Boolean).join(" ");

  const glowBlob = glowBlobWeight(pull);

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={wrapClass} ref={wrapRef}>
        <svg
          className={styles.svg}
          width="65"
          height="195"
          viewBox="0 -5 65 195"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <defs>
            <clipPath id="avitoEyeGlowClip" clipPathUnits="userSpaceOnUse">
              {/* Same warpPoint() as the Union path below, applied to the
                  mask's own points — Union and this clip shape are one
                  grouped element in the source file, so they must deform
                  identically instead of one morphing and the other just
                  sliding along for the ride. */}
              <path d={getAvitoEyeGlowClipPath(pull)} />
            </clipPath>
            <AvitoEyeGlowDefs />
          </defs>
          <rect x="-260" y="-5" width="360" height="195" fill="transparent" />
          {/* Node 820:4672 ("Union") — the black taffy silhouette. */}
          <path className={styles.path} d={getAvitoEyeBlobPath(pull)} />
          {/* Node 820:4672's mask group — colored glow, painted ON TOP of the
              black silhouette (matches Figma's layer order), clipped to the
              warped shape above. The blob layers themselves get one
              representative scale+shift (see glowBlobWeight) so they keep
              filling that growing clip window instead of leaving it blank
              at the edges. */}
          <g clipPath="url(#avitoEyeGlowClip)">
            <g
              style={{
                transform: `translateX(${glowBlob.shiftX}px) scale(${glowBlob.scale})`,
                transformOrigin: `${GLOW_BLOB_ORIGIN.x}px ${GLOW_BLOB_ORIGIN.y}px`,
              }}
            >
              <AvitoEyeGlowBlobs />
            </g>
          </g>
        </svg>
      </div>
      {/* Node 677:4999 ("Search Overlay") — sibling of .wrap, NOT a child:
          it must never inherit .wrap's commit-time scale(40). It stays put
          at its original spot and only fades via opacity (see .overlayFading). */}
      <SearchOverlayIcon className={overlayClass} />
    </div>
  );
}
