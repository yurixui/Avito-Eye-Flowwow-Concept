// Node 820:4672's mask group — the colored blurred "iris" glow inside the
// peeker. Transcribed verbatim from public/images/home-screen/peeker-svg.svg
// (the only asset this component is allowed to source from — no flattened
// raster export). Raw coordinates, no translation needed: AvitoEyePeeker's
// svg viewBox starts at "0 -5" specifically so this file's numbers can be
// copied straight from the source without hand-shifting anything.
const FILTERS: { id: string; x: number; y: number; w: number; h: number; blur: number }[] = [
  { id: "f0", x: -16.9974, y: 50.0047, w: 44.998, h: 84.9961, blur: 6.49971 },
  { id: "f1", x: -9.99773, y: 59.0043, w: 26.9988, h: 66.997, blur: 1.99991 },
  { id: "f2", x: -5.91774, y: 84.3801, w: 36.7083, h: 46.7432, blur: 2.95987 },
  { id: "f3", x: -17.5306, y: 73.4339, w: 55.2675, h: 65.3023, blur: 7.59966 },
  { id: "f4", x: -5.9178, y: 52.0696, w: 36.7083, h: 46.7432, blur: 2.95987 },
  { id: "f5", x: -6.90321, y: 55.5816, w: 38.8236, h: 43.2316, blur: 2.95987 },
  { id: "f6", x: -9.83753, y: 68.0245, w: 19.9847, h: 37.9952, blur: 2.95987 },
  { id: "f7", x: -9.91774, y: 82.0833, w: 19.8391, h: 37.8382, blur: 2.95987 },
];

const BLOBS: { filter: string; fill: string; opacity?: number; fillOpacity?: number; blend?: string; d: string }[] = [
  {
    filter: "f0",
    fill: "#00AAFF",
    d: "M6.99408 92.2619C6.99408 109.25 20.9728 122.416 11.9905 121.992C1.99768 121.52 -3.998 101.123 -3.998 92.2619C-3.998 83.4007 -0.500521 63.0042 11.9905 63.0041C19.4851 63.0041 6.99408 75.7454 6.99408 92.2619Z",
  },
  {
    filter: "f1",
    fill: "#965EEB",
    d: "M4.99417 92.2619C4.99417 109.25 18.9729 122.416 9.99058 121.992C-0.00222422 121.52 -5.99791 101.123 -5.99791 92.2619C-5.99791 83.4007 -2.50043 63.0042 9.99057 63.0041C17.4852 63.0041 4.99417 75.7454 4.99417 92.2619Z",
  },
  {
    filter: "f2",
    fill: "#04E061",
    d: "M1.32503 90.2998C1.32503 90.2998 1.22636 90.3184 0.09175 109.095C-1.04287 127.872 8.65719 124.984 24.8709 125.114C11.3715 116.615 1.32503 90.2998 1.32503 90.2998Z",
  },
  {
    filter: "f3",
    fill: "#00FF6C",
    opacity: 0.5,
    blend: "plus-lighter",
    d: "M-1.00826 88.6332C-1.00826 88.6332 -1.10692 88.6518 -2.24153 107.428C-3.37615 126.205 6.32391 123.317 22.5376 123.448C9.03819 114.948 -1.00826 88.6332 -1.00826 88.6332Z",
  },
  {
    filter: "f4",
    fill: "#6BFFA9",
    fillOpacity: 0.3,
    blend: "plus-lighter",
    d: "M1.32497 92.8931C1.32497 92.8931 1.2263 92.8744 0.0916857 74.0979C-1.04293 55.3214 8.65712 58.209 24.8708 58.0787C11.3714 66.5783 1.32497 92.8931 1.32497 92.8931Z",
  },
  {
    filter: "f5",
    fill: "#FF3131",
    d: "M0.325005 92.8934C0.325005 92.8934 0.226349 92.8748 -0.90827 74.0983C-2.04289 55.3217 9.78697 63.1345 26.0007 63.0041C12.5013 71.5038 0.325005 92.8934 0.325005 92.8934Z",
  },
  {
    filter: "f6",
    fill: "#965EEB",
    blend: "screen",
    d: "M1.83293 100.1C1.83293 100.1 1.95939 100.088 4.2274 82.1574C2.0605 76.041 -2.56373 67.4052 -3.72544 81.7937C-4.88715 96.1822 -0.503907 99.9931 1.83293 100.1Z",
  },
  {
    filter: "f7",
    fill: "#7A22FF",
    blend: "overlay",
    d: "M2.42945 114.002C2.42945 114.002 2.55523 113.984 4.00164 95.9686C1.55755 89.9576 -3.45641 81.5421 -3.95951 95.9686C-4.46261 110.395 0.0901752 114.002 2.42945 114.002Z",
  },
];

export function AvitoEyeGlowDefs() {
  return (
    <>
      {FILTERS.map((f) => (
        <filter
          key={f.id}
          id={`avitoEyeGlow_${f.id}`}
          x={f.x}
          y={f.y}
          width={f.w}
          height={f.h}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation={f.blur} />
        </filter>
      ))}
    </>
  );
}

export function AvitoEyeGlowBlobs() {
  return (
    <>
      {BLOBS.map((b, i) => (
        <g key={i} filter={`url(#avitoEyeGlow_${b.filter})`} opacity={b.opacity} style={b.blend ? { mixBlendMode: b.blend as never } : undefined}>
          <path d={b.d} fill={b.fill} fillOpacity={b.fillOpacity} />
        </g>
      ))}
    </>
  );
}
