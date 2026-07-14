import { useEffect } from "react";

// Writes the real, currently-visible viewport height (px) to --app-height
// on :root. window.visualViewport/innerHeight are plain, universally
// supported APIs — used instead of CSS vh/dvh/lvh units, which behaved
// inconsistently inside the in-app browser this was tested in.
export function useAppHeight() {
  useEffect(() => {
    const setHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    };

    setHeight();
    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
    };
  }, []);
}
