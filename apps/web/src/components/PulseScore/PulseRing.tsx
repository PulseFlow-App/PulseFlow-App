import { useState, useEffect, useRef } from 'react';

const GLOW_FILTER_ID = 'pulse-score-glow';

type PulseRingProps = {
  score: number;
  /** When set, first animation runs from this score to `score` (e.g. previous pulse before check-in). */
  initialScore?: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  delay?: number;
};

export function PulseRing({
  score,
  initialScore,
  color,
  size = 220,
  strokeWidth = 10,
  delay = 0,
}: PulseRingProps) {
  const [displayScore, setDisplayScore] = useState(initialScore ?? 0);
  const prevScoreRef = useRef(initialScore ?? 0);

  const r = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * r;
  const filled = (displayScore / 100) * circumference;

  useEffect(() => {
    if (score === prevScoreRef.current) return;
    const from = prevScoreRef.current;
    prevScoreRef.current = score;

    let start: number | null = null;
    let frame: number;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (start == null) start = timestamp;
      const elapsed = timestamp - start - delay;
      if (elapsed < 0) {
        frame = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplayScore(from + eased * (score - from));
      if (p < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score, delay]);

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity={0.4} />
        </linearGradient>
        <filter id={GLOW_FILTER_ID}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const inner = r - 8;
        const outer = r - 2;
        const x1 = size / 2 + inner * Math.cos(rad);
        const y1 = size / 2 + inner * Math.sin(rad);
        const x2 = size / 2 + outer * Math.cos(rad);
        const y2 = size / 2 + outer * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={i % 5 === 0 ? 2 : 1}
          />
        );
      })}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#pulseGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        filter={`url(#${GLOW_FILTER_ID})`}
      />
    </svg>
  );
}
