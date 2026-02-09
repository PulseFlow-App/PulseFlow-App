import { useSearchParams, Link } from 'react-router-dom';
import { ScoreRing } from '../components/ScoreRing';
import {
  getCombinedPulse,
  hasBodyTodayCheck,
  hasRoutineTodayCheck,
} from '../stores/combinedPulse';
import styles from './Pulse.module.css';

export function Pulse() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from'); // 'body-signals' | 'work-routine'

  const pulse = getCombinedPulse();
  const hasBody = hasBodyTodayCheck();
  const hasRoutine = hasRoutineTodayCheck();

  const showOfferWorkRoutine = from === 'body-signals' && !hasRoutine && hasBody;
  const showOfferBodySignals = from === 'work-routine' && !hasBody && hasRoutine;

  const bodyScore = pulse.body ?? 0;
  const routineScore = pulse.routine ?? 0;
  const hasBoth = pulse.sources.length === 2;
  const bodyShare = hasBoth ? 50 : pulse.body !== null ? 100 : 0;
  const routineShare = hasBoth ? 50 : pulse.routine !== null ? 100 : 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back}>
          ← Dashboard
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Your Pulse</h1>
        <p className={styles.subtitle}>
          Combined score from Body Signals and Work Routine
        </p>

        {showOfferWorkRoutine && (
          <div className={styles.ctaCard} role="region" aria-labelledby="cta-heading-wr">
            <h2 id="cta-heading-wr" className={styles.ctaHeading}>
              Add Work Routine for your best Pulse
            </h2>
            <p className={styles.ctaText}>
              You logged body signals today. Adding how your work day went will
              give you a combined Pulse and clearer insights: focus, energy, and
              how they connect.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/dashboard/work-routine/checkin" className={styles.ctaPrimary}>
                Add Work Routine
              </Link>
              <a href="#pulse-score" className={styles.ctaSecondary}>
                See my Pulse anyway
              </a>
            </div>
          </div>
        )}

        {showOfferBodySignals && (
          <div className={styles.ctaCard} role="region" aria-labelledby="cta-heading-bs">
            <h2 id="cta-heading-bs" className={styles.ctaHeading}>
              Add Body Signals for your best Pulse
            </h2>
            <p className={styles.ctaText}>
              You logged work routine today. Adding sleep, energy, and mood will
              give you a combined Pulse and better insights: how body and work
              connect.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/dashboard/body-signals/log" className={styles.ctaPrimary}>
                Add Body Signals
              </Link>
              <a href="#pulse-score" className={styles.ctaSecondary}>
                See my Pulse anyway
              </a>
            </div>
          </div>
        )}

        {pulse.combined !== null ? (
          <div id="pulse-score" className={styles.scoreCard}>
            <ScoreRing
              score={pulse.combined}
              label={hasBoth ? 'Combined Pulse' : pulse.body !== null ? 'Body Pulse' : 'Work Pulse'}
            />
            <div className={styles.diagramSection}>
              <h3 className={styles.diagramHeading}>What made it this way</h3>
              <div className={styles.diagramBar} aria-hidden="true">
                {pulse.body !== null && (
                  <div
                    className={`${styles.diagramSegment} ${styles.diagramSegmentBody} ${!hasBoth ? styles.diagramSegmentSolo : ''}`}
                    style={{ width: `${bodyShare}%` }}
                  />
                )}
                {pulse.routine !== null && (
                  <div
                    className={`${styles.diagramSegment} ${styles.diagramSegmentRoutine} ${!hasBoth ? styles.diagramSegmentSolo : ''}`}
                    style={{ width: `${routineShare}%` }}
                  />
                )}
              </div>
              <div className={styles.diagramLegend}>
                {pulse.body !== null && (
                  <span className={styles.diagramLegendItem}>
                    <span className={`${styles.diagramLegendDot} ${styles.diagramLegendDotBody}`} aria-hidden />
                    Body Signals: {bodyScore}%
                  </span>
                )}
                {pulse.routine !== null && (
                  <span className={styles.diagramLegendItem}>
                    <span className={`${styles.diagramLegendDot} ${styles.diagramLegendDotRoutine}`} aria-hidden />
                    Work Routine: {routineScore}%
                  </span>
                )}
              </div>
              {hasBoth && (
                <p className={styles.ctaText} style={{ marginTop: 12, marginBottom: 0 }}>
                  Your combined Pulse is the average of both. More data = clearer picture.
                </p>
              )}
            </div>
            <div className={styles.linksSection}>
              <Link to="/dashboard/body-signals" className={styles.linkButton}>
                Body Signals
              </Link>
              <Link to="/dashboard/work-routine" className={styles.linkButton}>
                Work Routine
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyHeading}>No Pulse yet today</p>
            <p className={styles.emptyText}>
              Log Body Signals or complete a Work Routine check-in to see your
              Pulse. Doing both gives you the best combined score and insights.
            </p>
            <div className={styles.emptyLinks}>
              <Link to="/dashboard/body-signals/log" className={styles.emptyLink}>
                Log Body Signals
              </Link>
              <Link to="/dashboard/work-routine/checkin" className={styles.emptyLink}>
                Work Routine check-in
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
