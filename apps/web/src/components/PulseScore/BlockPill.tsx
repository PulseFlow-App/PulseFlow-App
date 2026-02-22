import { useState, useEffect } from 'react';
import { ArcRing } from './ArcRing';
import styles from './PulseScore.module.css';

export type BlockPillBlock = {
  key: string;
  label: string;
  score: number | null;
  color: string;
  /** When score is null, show "Logged" instead of "Not logged" (e.g. nutrition). */
  loggedLabel?: boolean;
};

type BlockPillProps = {
  block: BlockPillBlock;
  index: number;
};

export function BlockPill({ block, index }: BlockPillProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400 + index * 120);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={styles.blockPill}
      style={{
        transitionDelay: `${index * 80}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      <div className={styles.blockPillIcon}>
        <svg width="32" height="32" style={{ overflow: 'visible' }} aria-hidden>
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.5"
          />
          {block.score !== null && (
            <ArcRing
              score={block.score}
              color={block.color}
              radius={13}
              strokeWidth={2.5}
              cx={16}
              cy={16}
              delay={600 + index * 150}
            />
          )}
        </svg>
        {block.score === null && (
          <div className={styles.blockPillDot} aria-hidden />
        )}
      </div>
      <div className={styles.blockPillText}>
        <div className={styles.blockPillLabel}>{block.label}</div>
        <div
          className={styles.blockPillScore}
          style={{
            color: block.score !== null ? block.color : 'rgba(255,255,255,0.2)',
          }}
        >
          {block.score !== null ? block.score : '—'}
        </div>
      </div>
      {block.score !== null ? (
        <div
          className={styles.blockPillIndicator}
          style={{ background: block.color, boxShadow: `0 0 8px ${block.color}` }}
          aria-hidden
        />
      ) : (
        <div className={styles.blockPillNotLogged}>
          {block.loggedLabel ? 'Logged' : 'Not logged'}
        </div>
      )}
    </div>
  );
}
