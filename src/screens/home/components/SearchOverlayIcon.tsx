// Node 677:4999 ("Search Overlay") — viewfinder corner brackets + magnifier
// glyph, drawn on top of Avito-eye. Inline (no exported asset file): traced
// 1:1 from the node's own vector data, same "peeker-svg is the only sourced
// asset" rule as AvitoEyeGlow.tsx — this one just isn't sourced from
// peeker-svg.svg at all, so it's code instead of a file reference.
export function SearchOverlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M1 6V4C1 2.34315 2.34315 1 4 1H6" stroke="white" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M1 14V16C1 17.6569 2.34315 19 4 19H6" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M19 6V4C19 2.34315 17.6569 1 16 1H14" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M19 14V16C19 17.6569 17.6569 19 16 19H14" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
      <path
        d="M8.99988 5.03101C6.97138 5.27768 5.40027 7.00526 5.40027 9.10034C5.40037 11.3646 7.23557 13.2 9.49988 13.2C11.7642 13.2 13.5994 11.3646 13.5995 9.10034C13.5995 9.06677 13.5983 9.03314 13.5975 8.99976H14.9979C14.9985 9.03316 14.9999 9.0668 14.9999 9.10034C14.9998 10.3667 14.5717 11.533 13.8524 12.4626L16.495 15.1052L15.5048 16.0955L12.8622 13.4529C11.9325 14.1721 10.7662 14.6003 9.49988 14.6003C6.46237 14.6003 3.99998 12.1378 3.99988 9.10034C3.99988 6.23136 6.19668 3.87644 8.99988 3.62378V5.03101Z"
        fill="white"
      />
      <path
        d="M10.1962 5.7002C11.376 5.3029 12.3027 4.37604 12.7001 3.19629C13.0975 4.37604 14.0242 5.3029 15.204 5.7002C14.0241 6.09754 13.0974 7.02423 12.7001 8.2041C12.3028 7.02423 11.376 6.09754 10.1962 5.7002Z"
        fill="white"
      />
    </svg>
  );
}
