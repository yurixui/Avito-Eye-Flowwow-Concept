// Procedural morph of node 820:4672 ("peeker-svg"), the Avito-eye peeker.
// Every point below is transcribed 1:1 from the real exported asset,
// public/images/home-screen/peeker-svg.svg (viewBox "0 0 47 190", path `d`
// spans y -5.00001..189.347, x 2..64.6836) — used RAW, no coordinate
// shifting: the SVG element's own viewBox simply starts at "0 -5" so
// path-space and CSS-space line up directly (see AvitoEyePeeker.tsx's
// viewBox). There's no Figma equivalent for a "stretched" frame — that
// state only exists once this becomes interactive — so instead of a
// hand-authored second keyframe, every point of BOTH the outer silhouette
// ("Union") and the inner glow mask is run through the same `warpPoint`.
//
// warpPoint = a weighted UNIFORM SCALE around the base anchor, plus an
// extra tip-weighted horizontal pull:
//   1. Scale S = 1 + p·GROW·w about (ANCHOR_X, CENTER_Y). Because it's a
//      *scale* (multiplicative), every distance grows in proportion, so
//      round arcs stay round and the whole shape keeps its aspect ratio as
//      it grows in BOTH width and height — a real physical scale-up.
//   2. An extra `-p·STRETCH_PX·w` horizontal pull layers the taffy/slime
//      stretch on top of that even growth.
// This replaced an earlier additive `sign(y-center)·px` vertical push,
// which tore the narrow rounded tip apart: its two center-adjacent points
// (y≈91.3 above, y≈98.6 below) got shoved in OPPOSITE directions by a big
// fixed amount, collapsing the round cap into two horizontal edges joined
// by a vertical one — i.e. a square. A scale can't do that: adjacent points
// stay adjacent, just farther from the anchor.
//
// `w` is per-point weight: ~1 at the tip, 0 at the pinned base — so the
// base never moves and the growth concentrates toward the tip. Union and
// the glow mask share this one function so they warp as a single unit,
// matching how they're one grouped element in the source file.

interface Point {
  x: number;
  y: number;
}

const CENTER_Y = 92.17; // vertical scale anchor
const ANCHOR_X = 64.6836; // horizontal scale anchor: the base, pinned past the screen edge
const GROW = 0.8; // uniform scale reaches 1 + GROW at the tip, pull=1
const STRETCH_PX = 190; // extra horizontal taffy pull at the tip, pull=1

// x of the rounded tip vs. x where the shape meets its pinned base.
const TIP_X = 2;
const NECK_X = 46.833;

// Per-point weight. smoothstep (flat derivative at BOTH ends) instead of a
// plain power curve: the rounded tip cap spans several points (x≈2..12)
// that must move as one rigid arc to stay round — a power curve gave them
// noticeably different weights (x=2→0.94 vs x=5.4→0.84), shearing the cap.
// smoothstep plateaus near the tip so those cap points move nearly
// together, and plateaus again at the neck so the join to the pinned base
// stays smooth.
function weight(x: number) {
  const n = Math.min(1, Math.max(0, (x - TIP_X) / (NECK_X - TIP_X)));
  const s = n * n * (3 - 2 * n); // smoothstep
  return 1 - s;
}

function warpPoint({ x, y }: Point, pull: number): Point {
  const w = weight(x);
  const p = Math.min(pull, 1.2);
  const s = 1 + p * GROW * w;
  return {
    x: ANCHOR_X + (x - ANCHOR_X) * s - p * STRETCH_PX * w,
    y: CENTER_Y + (y - CENTER_Y) * s,
  };
}

// Parsed 1:1 from the real `d`, in command order (H/V normalized to x,y).
const REST_POINTS: Point[] = [
  { x: 46.833, y: 20.5 }, // M (start / close point)
  { x: 46.833, y: 34.5 },
  { x: 38.2016, y: 53.8774 },
  { x: 24.7822, y: 63.3096 },
  { x: 11.8115, y: 72.4268 }, // L
  { x: 5.66079, y: 76.75 },
  { x: 2.00015, y: 83.7973 },
  { x: 2.00002, y: 91.3154 }, // tip (upper)
  { x: 2.00002, y: 98.5598 }, // tip (lower)
  { x: 5.40038, y: 105.384 },
  { x: 11.1836, y: 109.747 }, // L
  { x: 24.8604, y: 120.065 },
  { x: 38.3042, y: 130.208 },
  { x: 46.3929, y: 145.924 },
  { x: 46.833, y: 162.759 }, // L
  { x: 47.5284, y: 189.347 }, // L
  { x: 64.6836, y: 189.347 }, // base (bottom-right) (was H target)
  { x: 64.6836, y: -5.00001 }, // base (top-right) (was V target)
  { x: 46.833, y: -5 }, // L
  { x: 46.833, y: -5 }, // smooth control point (same as prev)
  { x: 46.833, y: 6.5 },
  { x: 46.833, y: 20.5 }, // closes back to start
];

export function getAvitoEyeBlobPath(pull: number): string {
  const [p0, ...rest] = REST_POINTS.map((p) => warpPoint(p, pull));
  let d = `M${fmt(p0)}`;
  d += `C${fmt(rest[0])} ${fmt(rest[1])} ${fmt(rest[2])}`;
  d += `L${fmt(rest[3])}`;
  d += `C${fmt(rest[4])} ${fmt(rest[5])} ${fmt(rest[6])}`;
  d += `C${fmt(rest[7])} ${fmt(rest[8])} ${fmt(rest[9])}`;
  d += `L${fmt(rest[10])}`;
  d += `C${fmt(rest[11])} ${fmt(rest[12])} ${fmt(rest[13])}`;
  d += `L${fmt(rest[14])}`;
  d += `L${fmt(rest[15])}`; // base bottom-right
  d += `L${fmt(rest[16])}`; // base top-right
  d += `L${fmt(rest[17])}`;
  d += `C${fmt(rest[18])} ${fmt(rest[19])} ${fmt(rest[20])}`;
  d += "Z";
  return d;
}

// Node 820:4672's mask ("mask0_820_4672") — the colored blurred "iris" glow
// sits INSIDE the blob, clipped to this exact lens shape. Raw coordinates,
// same convention as REST_POINTS above, warped through the same function.
const GLOW_REST_POINTS: Point[] = [
  { x: 35.3816, y: 53.14 }, // M (start / close point)
  { x: 37.6642, y: 53.3713 },
  { x: 39.8782, y: 53.8952 },
  { x: 41.9978, y: 54.682 },
  { x: 31.9965, y: 61.754 },
  { x: 25.2029, y: 75.591 },
  { x: 25.2029, y: 91.5023 },
  { x: 25.203, y: 107.414 },
  { x: 31.9971, y: 121.251 },
  { x: 41.9988, y: 128.323 },
  { x: 39.7325, y: 129.164 },
  { x: 37.3584, y: 129.704 },
  { x: 34.908, y: 129.908 },
  { x: 31.9989, y: 126.213 },
  { x: 28.6022, y: 122.868 },
  { x: 24.7693, y: 119.976 }, // L
  { x: 11.0925, y: 109.658 },
  { x: 5.3098, y: 105.295 },
  { x: 1.90997, y: 98.4708 },
  { x: 1.90993, y: 91.2269 },
  { x: 1.91006, y: 83.7093 },
  { x: 5.57022, y: 76.6623 },
  { x: 11.7205, y: 72.3392 }, // L
  { x: 24.6912, y: 63.222 },
  { x: 28.7681, y: 60.3564 },
  { x: 32.354, y: 56.951 },
  { x: 35.3816, y: 53.14 }, // closes back to start
];

export function getAvitoEyeGlowClipPath(pull: number): string {
  const [p0, ...rest] = GLOW_REST_POINTS.map((p) => warpPoint(p, pull));
  let d = `M${fmt(p0)}`;
  d += `C${fmt(rest[0])} ${fmt(rest[1])} ${fmt(rest[2])}`;
  d += `C${fmt(rest[3])} ${fmt(rest[4])} ${fmt(rest[5])}`;
  d += `C${fmt(rest[6])} ${fmt(rest[7])} ${fmt(rest[8])}`;
  d += `C${fmt(rest[9])} ${fmt(rest[10])} ${fmt(rest[11])}`;
  d += `C${fmt(rest[12])} ${fmt(rest[13])} ${fmt(rest[14])}`;
  d += `L${fmt(rest[15])}`;
  d += `C${fmt(rest[16])} ${fmt(rest[17])} ${fmt(rest[18])}`;
  d += `C${fmt(rest[19])} ${fmt(rest[20])} ${fmt(rest[21])}`;
  d += `L${fmt(rest[22])}`;
  d += `C${fmt(rest[23])} ${fmt(rest[24])} ${fmt(rest[25])}`;
  d += "Z";
  return d;
}

function fmt(p: Point) {
  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
}
