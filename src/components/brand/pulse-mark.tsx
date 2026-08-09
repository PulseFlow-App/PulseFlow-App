export function PulseMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id="pf-mark-bg" x1="8" y1="4" x2="56" y2="60">
          <stop offset="0%" stopColor="#F59A5C" />
          <stop offset="100%" stopColor="#D45A1F" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#pf-mark-bg)" />

      {/* Villa / rental building */}
      <path
        d="M14 36.5 L32 22 L50 36.5"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 35.5 V48 H46 V35.5"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Door */}
      <path
        d="M29.5 48 V40.5 H34.5 V48"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Windows */}
      <rect x="21.5" y="38.5" width="4.2" height="4.2" rx="0.8" fill="#FFFFFF" />
      <rect x="38.3" y="38.5" width="4.2" height="4.2" rx="0.8" fill="#FFFFFF" />
      {/* Small porch / pool accent */}
      <path
        d="M20 48 H44"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Pulse line over the mark */}
      <path
        d="M9 28.5 H18 L21 22 L26.5 36 L30.5 27 H40"
        stroke="#FFE4D4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="43.5" cy="27" r="2.4" fill="#FFE4D4" />
    </svg>
  );
}
