import { useEffect, useRef } from "react";

// Measures the element's own parent width and writes scale = width/designWidth
// to --width-scale on the element itself. Used to scale an entire fixed-width
// design (e.g. Home's 375px-wide Figma layout) uniformly for wider real
// devices, per spec: "375x812 is the 100% baseline, scale by width above that."
// JS (ResizeObserver), not a CSS container/viewport-unit trick — those proved
// unreliable across the browsers/webviews this project is tested in.
export function useWidthScale<T extends HTMLElement>(designWidth: number) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const applyScale = () => {
      const scale = parent.clientWidth / designWidth;
      el.style.setProperty("--width-scale", String(scale));
    };

    applyScale();
    const observer = new ResizeObserver(applyScale);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [designWidth]);

  return ref;
}
