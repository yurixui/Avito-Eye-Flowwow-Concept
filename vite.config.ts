import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Vite's dev server sends `Cache-Control: no-cache` for everything, public/
// assets included — that forces the browser to revalidate every image with
// a network round-trip on every request, even unchanged ones. Fine on
// localhost, but noticeably slow over LAN/Wi-Fi (real-device testing) when
// navigating between screens re-mounts a few dozen <img>s at once.
//
// `immutable` (this project's first attempt) fixed the speed but broke
// asset iteration: these image files DO get overwritten in place under the
// same name during design work, and an immutable/max-age:1y response means
// the browser then ignores the new file on disk indefinitely under that
// URL. `stale-while-revalidate` is the actual right tool here — serve the
// cached copy instantly (same speed win), but revalidate in the background
// on every request, so a changed file shows up after one extra load
// instead of never.
function longCacheForStaticAssets(): Plugin {
  return {
    name: "long-cache-for-static-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && /^\/(images|fonts)\//.test(req.url)) {
          res.setHeader("Cache-Control", "public, max-age=0, stale-while-revalidate=604800");
        }
        next();
      });
    },
  };
}

// HTTPS is OPT-IN via `HTTPS=1` (e.g. `HTTPS=1 npm run dev`). Default is
// plain HTTP so the prototype just opens everywhere — a self-signed HTTPS
// cert makes browsers (and the in-app preview) throw a "not secure"
// error/warning that blocks viewing entirely. The only screen that needs
// HTTPS is Camera: getUserMedia only runs in a secure context (HTTPS or
// localhost), so the live feed can't work on a phone over the LAN's plain
// HTTP — it shows the "no camera access" fallback. Run with HTTPS=1 only
// when you specifically want to test the real camera on a device (then
// accept the one-time cert warning on the phone).
const useHttps = process.env.HTTPS === "1";

// Vite + React + SVGR (icons as components). No SSR — this is a click-through prototype.
export default defineConfig({
  plugins: [react(), svgr(), ...(useHttps ? [basicSsl()] : []), longCacheForStaticAssets()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true, // expose on LAN for real-device testing
  },
});
