import { useState, useEffect, useRef } from 'react';

type ArcRingProps = {
  score: number;
  color: string;
  radius: number;
  strokeWidth: number;
  cx: number;
  cy: number;
  delay?: number;
};

export function ArcRing({ score, color, radius, strokeWidth, cx, cy, delay = 0 }: ArcRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const prevScoreRef = useRef(0);

  const circumference = 2 * Math.PI * radius;
  const filled = (displayScore / 100) * circumference;

  useEffect(() => {
    if (score === prevScoreRef.current) return;
    const from = prevScoreRef.current;
    prevScoreRef.current = score;

    let start: number | null = null;
    let frame: number;
    const duration = 1600;

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
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={`${filled} ${circumference}`}
      strokeDashoffset={0}
      transform={`rotate(-90 ${cx} ${cy})`}
      style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
    />
  );
}
