import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ScoreRing } from '../components/ScoreRing';
import {
  getCombinedPulse,
  hasBodyTodayCheck,
  hasRoutineTodayCheck,
} from '../stores/combinedPulse';
import { computeBodyPulseAsync } from '../blocks/BodySignals/store';
import type { BodyPulseSnapshot } from '../blocks/BodySignals/types';
import { getExplanationBullets, SignalIcon } from '../blocks/BodySignals/signalIcons';
import { getLatestCheckIn } from '../blocks/WorkRoutine/store';
import styles from './Pulse.module.css';

export function Pulse() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from'); // 'body-signals' | 'work-routine'

  const pulse = getCombinedPulse();
  const hasBody = hasBodyTodayCheck();
  const hasRoutine = hasRoutineTodayCheck();

  const [bodySnapshot, setBodySnapshot] = useState<BodyPulseSnapshot | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);

  const showOfferWorkRoutine = hasBody && !hasRoutine;
  const showOfferBodySignals = from === 'work-routine' && !hasBody && hasRoutine;

  const bodyScore = pulse.body ?? 0;
  const routineScore = pulse.routine ?? 0;
  const hasBoth = pulse.sources.length === 2;
  const bodyShare = hasBoth ? 50 : pulse.body !== null ? 100 : 0;
  const routineShare = hasBoth ? 50 : pulse.routine !== null ? 100 : 0;

  const scoreCardLabel = hasBoth ? 'Combined Pulse' : pulse.body !== null ? 'Body Pulse' : 'Work Pulse';
  const routineEntry = hasRoutine ? getLatestCheckIn() : undefined;

  useEffect(() => {
    if (!hasBody) {
      setBodySnapshot(null);
      setLoadingBody(false);
      return;
    }
    setLoadingBody(true);
    setBodySnapshot(null);
    computeBodyPulseAsync()
      .then(setBodySnapshot)
      .finally(() => setLoadingBody(false));
  }, [hasBody]);

  const scoreCardBlock = pulse.combined !== null ? (
    <div id="pulse-score" className={styles.scoreCard}>
      <ScoreRing score={pulse.combined} label={scoreCardLabel} />
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
        {hasBoth ? (
          <p className={styles.aggregationText}>
            Body Signals contributed {bodyScore}% and Work Routine contributed {routineScore}%. Your combined Pulse is {pulse.combined}, the average of both. More data gives a clearer picture.
          </p>
        ) : (
          <p className={styles.ctaText} style={{ marginTop: 12, marginBottom: 0 }}>
            Add another block to get a combined Pulse and richer insights.
          </p>
        )}
      </div>

      {/* Narrative: one combined flow when both, else body or routine only */}
      {(hasBody || hasRoutine) && (
        <div className={styles.narrativeBlock}>
          {hasBoth && (
            <p className={styles.narrativeIntro}>
              Body and work both feed your Pulse today. Below: what’s shaping it and one thing to try.
            </p>
          )}
          {hasBody && (
            <>
              {loadingBody ? (
                <p className={styles.bodyLoading}>Getting your pattern…</p>
              ) : bodySnapshot ? (
                <>
                  <section className={styles.narrativeSection} aria-labelledby="pulse-pattern-heading">
                    <h2 id="pulse-pattern-heading" className={styles.narrativeHeading}>
                      {hasBoth ? 'From Body Signals' : 'Today’s pattern'}
                    </h2>
                    <p className={styles.narrativeInsight}>{bodySnapshot.insight}</p>
                  </section>
                  {bodySnapshot.explanation && (
                    <section className={styles.narrativeSection} aria-labelledby="pulse-why-heading">
                      <h2 id="pulse-why-heading" className={styles.narrativeHeading}>What’s shaping your Pulse</h2>
                      {getExplanationBullets(bodySnapshot.explanation).length > 0 ? (
                        <ul className={styles.explanationList} aria-label="What affects your score">
                          {getExplanationBullets(bodySnapshot.explanation).map(({ icon, text }, i) => (
                            <li key={i} className={styles.explanationItem}>
                              <SignalIcon icon={icon} className={styles.explanationIcon} />
                              <span className={styles.explanationText}>{text}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.narrativeText}>{bodySnapshot.explanation}</p>
                      )}
                    </section>
                  )}
                  {bodySnapshot.improvements.length > 0 && !hasBoth && (
                    <section className={styles.narrativeSection} aria-labelledby="pulse-one-heading">
                      <h2 id="pulse-one-heading" className={styles.narrativeHeading}>A small thing to try</h2>
                      <p className={styles.narrativeOneThing}>{bodySnapshot.improvements[0]}</p>
                    </section>
                  )}
                </>
              ) : null}
            </>
          )}
          {hasRoutine && routineEntry?.analysis && (
            <section className={styles.narrativeSection} aria-labelledby="pulse-routine-heading">
              <h2 id="pulse-routine-heading" className={styles.narrativeHeading}>
                From your work check-in
              </h2>
              <p className={styles.narrativeTextSmall}>
                Based on your logged focus, energy, and breaks (not AI).
              </p>
              <p className={styles.narrativeText}>{routineEntry.analysis.pattern}</p>
              {routineEntry.analysis.oneThing && (
                <p className={styles.narrativeOneThing}>{routineEntry.analysis.oneThing}</p>
              )}
            </section>
          )}
          {hasBoth && (bodySnapshot?.improvements?.[0] || routineEntry?.analysis?.oneThing) && (
            <section className={styles.narrativeSection} aria-labelledby="pulse-one-heading">
              <h2 id="pulse-one-heading" className={styles.narrativeHeading}>One thing to try</h2>
              <p className={styles.narrativeOneThing}>
                {bodySnapshot?.improvements?.[0] ?? routineEntry?.analysis?.oneThing}
              </p>
            </section>
          )}
        </div>
      )}

    </div>
  ) : null;

  const emptyStateBlock = pulse.combined === null ? (
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
  ) : null;

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

        {scoreCardBlock}

        {showOfferWorkRoutine && (
          <div className={styles.ctaCard} role="region" aria-labelledby="cta-heading-wr">
            <h2 id="cta-heading-wr" className={styles.ctaHeading}>
              Add Work Routine for your best Pulse
            </h2>
            <p className={styles.ctaText}>
              You logged body signals today. Adding how your work day went will give you a combined Pulse and clearer insights: focus, energy, and how they connect.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/dashboard/work-routine/checkin" className={styles.ctaPrimary}>
                Log work routine
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
              You logged work routine today. Adding sleep, energy, and mood will give you a combined Pulse and better insights: how body and work connect.
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

        {emptyStateBlock}
      </main>
    </div>
  );
}
