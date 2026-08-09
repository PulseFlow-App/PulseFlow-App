/** Exact PulseFlow mark from brand SVG (house + pulse roof). */
export function PulseMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id="pf-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F26A36" />
          <stop offset="100%" stopColor="#D94E1B" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="112" fill="url(#pf-mark-bg)" />

      <path
        d="M 160 260 V 370 H 352 V 260"
        stroke="#FFFFFF"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 100 260 H 160 L 256 140 L 300 290 L 320 220 L 352 260 H 412"
        stroke="#FFFFFF"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect x="236" y="300" width="40" height="70" rx="8" fill="#FFFFFF" />
    </svg>
  );
}
