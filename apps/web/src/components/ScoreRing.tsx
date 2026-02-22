import { useId } from 'react';
import styles from './ScoreRing.module.css';

const DEFAULT_SIZE = 160;
const STROKE = 14;

type ScoreRingProps = {
  score: number;
  label?: string;
  size?: number;
};

export function ScoreRing({ score, label = 'Pulse', size = DEFAULT_SIZE }: ScoreRingProps) {
  const id = useId();
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - STROKE) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const isHigh = clamped >= 60;
  const isMid = clamped >= 40 && clamped < 60;
  const gradientId = `pulse-g-${id.replace(/:/g, '')}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.ringContainer} style={{ width: size, height: size }} data-score-tier={isHigh ? 'high' : isMid ? 'mid' : 'low'}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={styles.ringSvg}
          aria-hidden
        >
          <defs>
            <linearGradient id={`${gradientId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isHigh && (
                <>
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#4ade80" />
                </>
              )}
              {isMid && (
                <>
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </>
              )}
              {!isHigh && !isMid && (
                <>
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f87171" />
                </>
              )}
            </linearGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          <circle
            className={styles.progressRing}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>
        <div className={styles.center} style={{ width: size, height: size }}>
          <span className={styles.score} style={{ fontSize: size * 0.22 }}>
            {Math.round(clamped)}
          </span>
          <span className={styles.label}>{label}</span>
        </div>
      </div>
    </div>
  );
}
