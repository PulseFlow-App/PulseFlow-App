import { useState, useEffect } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { PulseRing } from './PulseRing';
import { BlockPill, type BlockPillBlock } from './BlockPill';
import { ScanLine } from './ScanLine';
import { getScoreColor, getStatusLabel, BLOCK_COLORS } from './scoreColor';
import styles from './PulseScore.module.css';

export type PulseScoreVariant = 'block-only' | 'daily-combined' | 'all-time-blocks' | 'all-time-pulse';

export type PulseScoreCardProps = {
  variant: PulseScoreVariant;
  /** block-only: single score and label */
  score?: number;
  label?: string;
  blockKey?: 'body' | 'work' | 'nutrition';
  /** daily-combined: main score + block breakdown */
  combinedScore?: number;
  /** daily-combined: animate from this score to combinedScore (e.g. body-only score before check-in). */
  initialCombinedScore?: number;
  blocks?: {
    body: number | null;
    work: number | null;
    nutrition: number | null;
  };
  baselineDelta?: number;
  title?: string;
  subtitle?: string;
  dateLabel?: string;
  showLive?: boolean;
  /** all-time-blocks: per-block all-time scores */
  allTimeBodyScore?: number;
  allTimeWorkScore?: number;
  allTimeNutritionHasData?: boolean;
  /** all-time-pulse: single combined all-time score */
  allTimeScore?: number;
  bodyLogCount?: number;
  checkInCount?: number;
  /** Compact: smaller ring, no scanline (e.g. block result pages) */
  compact?: boolean;
  /** daily-combined: when nutrition is logged but has no numeric score */
  nutritionLogged?: boolean;
  /** block-only: use score-based color (green/amber/red) instead of block color */
  useScoreColor?: boolean;
};

export function PulseScoreCard(props: PulseScoreCardProps) {
  const {
    variant,
    score = 0,
    label = 'Pulse',
    blockKey = 'body',
    combinedScore = 0,
    initialCombinedScore,
    blocks,
    baselineDelta,
    title,
    subtitle,
    dateLabel,
    showLive = false,
    allTimeBodyScore,
    allTimeWorkScore,
    allTimeNutritionHasData,
    allTimeScore = 0,
    bodyLogCount = 0,
    checkInCount = 0,
    compact = false,
    nutritionLogged = false,
    useScoreColor = false,
  } = props;

  const [loaded, setLoaded] = useState(false);
  const [pulseReady, setPulseReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLoaded(true), 100);
    const t2 = setTimeout(() => setPulseReady(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const displayScore =
    variant === 'block-only'
      ? score
      : variant === 'daily-combined'
        ? combinedScore
        : variant === 'all-time-pulse'
          ? allTimeScore
          : 0;

  const scoreColor = getScoreColor(displayScore);
  const statusLabel = getStatusLabel(displayScore);

  const size = compact ? 160 : 200;
  const strokeWidth = compact ? 6 : 8;

  if (variant === 'block-only') {
    const color = useScoreColor ? scoreColor : BLOCK_COLORS[blockKey];
    return (
      <div
        className={styles.card}
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: compact ? '24px 20px' : '40px 32px',
        }}
      >
        {!compact && <ScanLine />}
        <div className={styles.cardContent}>
          {!compact && (
            <div
              className={styles.glowBehind}
              style={{
                background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
              }}
            />
          )}
          <div className={styles.ringWrap}>
            <PulseRing
              score={displayScore}
              color={color}
              size={size}
              strokeWidth={strokeWidth}
              delay={300}
            />
            <div className={styles.centerContent}>
              <div className={styles.centerScore} style={{ fontSize: size * 0.26 }}>
                <AnimatedNumber value={displayScore} delay={400} />
              </div>
              <div className={styles.centerLabel}>{label}</div>
              {!compact && (
                <div
                  className={styles.statusBadge}
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}40`,
                    color,
                  }}
                >
                  {statusLabel}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'all-time-pulse') {
    return (
      <div
        className={styles.card}
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: compact ? '24px 20px' : '40px 32px',
        }}
      >
        <div className={styles.cardContent}>
          <div className={styles.ringWrap}>
            <PulseRing
              score={displayScore}
              color={scoreColor}
              size={size}
              strokeWidth={strokeWidth}
              delay={300}
            />
            <div className={styles.centerContent}>
              <div className={styles.centerScore} style={{ fontSize: size * 0.22 }}>
                <AnimatedNumber value={displayScore} delay={400} />
              </div>
              <div className={styles.centerLabel}>All time Pulse</div>
              <div className={styles.centerLabel} style={{ marginTop: 2, fontSize: 10 }}>
                {bodyLogCount + checkInCount} check-ins
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'all-time-blocks') {
    const pillBlocks: BlockPillBlock[] = [
      {
        key: 'body',
        label: 'Body',
        score: allTimeBodyScore ?? null,
        color: BLOCK_COLORS.body,
      },
      {
        key: 'work',
        label: 'Work',
        score: allTimeWorkScore ?? null,
        color: BLOCK_COLORS.work,
      },
      {
        key: 'nutrition',
        label: 'Nutrition',
        score: allTimeNutritionHasData ? 0 : null,
        color: BLOCK_COLORS.nutrition,
      },
    ];
    const nutritionPill = pillBlocks[2];
    if (nutritionPill && allTimeNutritionHasData) {
      nutritionPill.score = null;
      nutritionPill.loggedLabel = true;
    }

    return (
      <div
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className={styles.blockBreakdown}>
          <div className={styles.blockBreakdownTitle}>All-time block scores</div>
          {pillBlocks.map((b, i) => (
            <BlockPill key={b.key} block={b} index={i} />
          ))}
        </div>
      </div>
    );
  }

  /* daily-combined */
  const blockPills: BlockPillBlock[] = [
    {
      key: 'body',
      label: 'Body',
      score: blocks?.body ?? null,
      color: BLOCK_COLORS.body,
    },
    {
      key: 'work',
      label: 'Work',
      score: blocks?.work ?? null,
      color: BLOCK_COLORS.work,
    },
    {
      key: 'nutrition',
      label: 'Nutrition',
      score: blocks?.nutrition ?? null,
      color: BLOCK_COLORS.nutrition,
      loggedLabel: nutritionLogged,
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 380,
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {(title || dateLabel || showLive) && (
        <div
          className={styles.header}
          style={{ animation: loaded ? 'pulseScoreFadeUp 0.6s ease both' : 'none' }}
        >
          <div>
            {subtitle && <div className={styles.headerLeftSub}>{subtitle}</div>}
            <div className={styles.headerLeftTitle}>{title ?? 'Daily Pulse'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {showLive && (
              <div className={styles.headerRightLive}>
                <div className={styles.headerRightLiveDot} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
                  LIVE
                </span>
              </div>
            )}
            {dateLabel && <div className={styles.headerRightDate}>{dateLabel}</div>}
          </div>
        </div>
      )}

      <div
        className={styles.card}
        style={{
          marginBottom: 16,
          animation: loaded ? 'pulseScoreFadeUp 0.7s 0.1s ease both' : 'none',
        }}
      >
        <ScanLine />
        <div
          className={styles.glowBehind}
          style={{
            background: `radial-gradient(circle, ${scoreColor}18 0%, transparent 70%)`,
          }}
        />
        <div className={styles.cardContent}>
          <div className={styles.ringWrap}>
            <PulseRing
              score={pulseReady ? combinedScore : initialCombinedScore ?? 0}
              color={scoreColor}
              size={size}
              strokeWidth={strokeWidth}
              delay={300}
              initialScore={initialCombinedScore}
            />
            <div className={styles.centerContent}>
              <div className={styles.centerScore} style={{ fontSize: size * 0.26 }}>
                <AnimatedNumber
                  value={combinedScore}
                  initialValue={initialCombinedScore}
                  delay={400}
                />
              </div>
              <div className={styles.centerLabel}>Pulse Score</div>
              <div
                className={styles.statusBadge}
                style={{
                  background: `${scoreColor}18`,
                  border: `1px solid ${scoreColor}40`,
                  color: scoreColor,
                }}
              >
                {statusLabel}
              </div>
            </div>
          </div>

          {baselineDelta != null && (
            <div
              className={styles.baselineRow}
              style={{ animation: loaded ? 'pulseScoreFadeUp 0.7s 0.15s ease both' : 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M7 11V3M3.5 6.5L7 3L10.5 6.5"
                  stroke="#00ff88"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.baselineDelta}>
                {baselineDelta >= 0 ? '+' : ''}{baselineDelta}
              </span>
              <span>vs your 7-day baseline</span>
            </div>
          )}
        </div>
      </div>

      <div
        className={styles.blockBreakdown}
        style={{
          marginBottom: 24,
          animation: loaded ? 'pulseScoreFadeUp 0.7s 0.2s ease both' : 'none',
        }}
      >
        <div className={styles.blockBreakdownTitle}>Block breakdown</div>
        {blockPills.map((block, i) => (
          <BlockPill key={block.key} block={block} index={i} />
        ))}
      </div>
    </div>
  );
}
