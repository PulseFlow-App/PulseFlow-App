import { colors } from '../theme/colors';
import styles from './ScoreRing.module.css';

const DEFAULT_SIZE = 160;
const STROKE = 12;

type ScoreRingProps = {
  score: number;
  label?: string;
  size?: number;
};

export function ScoreRing({ score, label = 'Pulse', size = DEFAULT_SIZE }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - STROKE) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 60 ? colors.pulseHigh : clamped >= 40 ? colors.pulseMid : colors.pulseLow;

  return (
    <div className={styles.wrapper}>
      <div className={styles.ringContainer} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute' }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colors.border}
            strokeWidth={STROKE}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>
        <div className={styles.center} style={{ width: size, height: size }}>
          <span className={styles.score} style={{ fontSize: size * 0.2 }}>
            {Math.round(clamped)}
          </span>
          <span className={styles.label}>{label}</span>
        </div>
      </div>
    </div>
  );
}
