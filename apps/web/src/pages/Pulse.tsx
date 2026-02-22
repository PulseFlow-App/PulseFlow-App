import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ScoreRing } from '../components/ScoreRing';
import {
  getCombinedPulse,
  hasBodyTodayCheck,
  hasRoutineTodayCheck,
  hasNutritionTodayCheck,
} from '../stores/combinedPulse';
import { computeBodyPulseAsync } from '../blocks/BodySignals/store';
import type { BodyPulseSnapshot } from '../blocks/BodySignals/types';
import { getExplanationBullets, SignalIcon } from '../blocks/BodySignals/signalIcons';
import { getLatestCheckIn } from '../blocks/WorkRoutine/store';
import { getApiUrl } from '../lib/apiUrl';
import { buildDailyReportPayload } from '../lib/buildDailyReportPayload';
import { fetchPulseAggregation, type AggregationResult } from '../lib/buildAggregationPayload';
import { reportPdfToBlob } from '../lib/reportPdf';
import type { DailyReportJson } from '../lib/reportTypes';
import styles from './Pulse.module.css';

export function Pulse() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from'); // 'body-signals' | 'work-routine'

  const pulse = getCombinedPulse();
  const hasBody = hasBodyTodayCheck();
  const hasRoutine = hasRoutineTodayCheck();
  const hasNutrition = hasNutritionTodayCheck();
  const blockCount = pulse.blockCount;
  const hasAllThree = blockCount === 3;

  const [bodySnapshot, setBodySnapshot] = useState<BodyPulseSnapshot | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [aggregation, setAggregation] = useState<AggregationResult | null>(null);
  const [loadingAggregation, setLoadingAggregation] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const showOfferWorkRoutine = hasBody && !hasRoutine;
  const showOfferBodySignals = from === 'work-routine' && !hasBody && hasRoutine;
  const showOfferNutrition = (hasBody || hasRoutine) && !hasNutrition;

  const bodyScore = pulse.body ?? 0;
  const routineScore = pulse.routine ?? 0;
  const hasBoth = hasBody && hasRoutine;
  /* When all 3 blocks logged, show three segments in the bar (Body / Work / Nutrition). */
  const bodyShare = hasAllThree ? 40 : hasBoth ? 50 : pulse.body !== null ? 100 : 0;
  const routineShare = hasAllThree ? 40 : hasBoth ? 50 : pulse.routine !== null ? 100 : 0;
  const nutritionShare = hasAllThree ? 20 : 0;

  const scoreCardLabel = hasAllThree
    ? 'Your Pulse (all 3 blocks)'
    : hasBoth
      ? 'Combined Pulse (2 blocks)'
      : pulse.body !== null
        ? 'Body Pulse'
        : 'Work Pulse';
  const routineEntry = hasRoutine ? getLatestCheckIn() : undefined;

  const blockNames = (count: number) => {
    const names: string[] = [];
    if (hasBody) names.push('Body Signals');
    if (hasRoutine) names.push('Work Routine');
    if (hasNutrition) names.push('Nutrition');
    return names.slice(0, count).join(' and ');
  };

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

  useEffect(() => {
    if (blockCount < 2) {
      setAggregation(null);
      setLoadingAggregation(false);
      return;
    }
    const apiBase = getApiUrl();
    if (!apiBase) {
      setAggregation(null);
      setLoadingAggregation(false);
      return;
    }
    setLoadingAggregation(true);
    setAggregation(null);
    fetchPulseAggregation(apiBase, bodySnapshot)
      .then(setAggregation)
      .finally(() => setLoadingAggregation(false));
  }, [blockCount, bodySnapshot?.date, hasBody, hasRoutine, hasNutrition]);

  useEffect(() => {
    if (!reportError) return;
    const t = setTimeout(() => setReportError(null), 5000);
    return () => clearTimeout(t);
  }, [reportError]);

  const handleDownloadReport = useCallback(async () => {
    const apiBase = getApiUrl();
    if (!apiBase) {
      setReportError("Couldn't generate report — try again.");
      return;
    }
    let snapshot = bodySnapshot;
    if (hasBody && !snapshot) {
      try {
        snapshot = await computeBodyPulseAsync();
      } catch {
        setReportError("Couldn't generate report — try again.");
        return;
      }
    }
    setReportError(null);
    setReportLoading(true);
    try {
      const payload = buildDailyReportPayload(snapshot);
      const res = await fetch(`${apiBase}/report/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReportError("Couldn't generate report — try again.");
        return;
      }
      const report = data as DailyReportJson;
      const blob = reportPdfToBlob(report);
      const filename = `PulseFlow-Report-${report.report_date ?? new Date().toISOString().slice(0, 10)}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'PulseFlow Daily Report', files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setReportError("Couldn't generate report — try again.");
    } finally {
      setReportLoading(false);
    }
  }, [bodySnapshot, hasBody]);

  const scoreCardBlock = pulse.combined !== null ? (
    <div id="pulse-score" className={styles.scoreCard}>
      <ScoreRing score={pulse.combined} label={scoreCardLabel} />
      <div className={styles.diagramSection}>
        <h3 className={styles.diagramHeading}>What made it this way</h3>
        <div className={`${styles.diagramBar} ${hasAllThree ? styles.threeBlocks : ''}`} aria-hidden="true">
          {pulse.body !== null && bodyShare > 0 && (
            <div
              className={`${styles.diagramSegment} ${styles.diagramSegmentBody} ${!hasBoth && !hasAllThree ? styles.diagramSegmentSolo : ''}`}
              style={{ width: `${bodyShare}%` }}
            />
          )}
          {pulse.routine !== null && routineShare > 0 && (
            <div
              className={`${styles.diagramSegment} ${styles.diagramSegmentRoutine} ${!hasBoth && !hasAllThree ? styles.diagramSegmentSolo : ''}`}
              style={{ width: `${routineShare}%` }}
            />
          )}
          {hasNutrition && nutritionShare > 0 && (
            <div
              className={`${styles.diagramSegment} ${styles.diagramSegmentNutrition} ${hasAllThree ? '' : styles.diagramSegmentSolo}`}
              style={{ width: `${nutritionShare}%` }}
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
          {hasNutrition && (
            <span className={styles.diagramLegendItem}>
              <span className={`${styles.diagramLegendDot} ${styles.diagramLegendDotNutrition}`} aria-hidden />
              Nutrition: logged
            </span>
          )}
        </div>
        {blockCount === 1 && (
          <p className={styles.ctaText} style={{ marginTop: 12, marginBottom: 0 }}>
            Based on {blockNames(1)} only. Add another block to get combined recommendations that use more of your inputs.
          </p>
        )}
        {blockCount === 2 && (
          <p className={styles.aggregationText}>
            Recommendations below use your {blockNames(2)} inputs. Your score combines Body Signals and Work Routine. Add the third block (Nutrition) for recommendations based on all your data.
          </p>
        )}
        {hasAllThree && (
          <p className={styles.aggregationText}>
            Recommendations below are based on all three blocks: Body Signals, Work Routine, and Nutrition. This is your full Pulse for today.
          </p>
        )}
      </div>

      {/* Narrative: 1-, 2-, or 3-block recommendations */}
      {(hasBody || hasRoutine) && (
        <div className={styles.narrativeBlock}>
          {blockCount >= 2 && loadingAggregation && (
            <p className={styles.bodyLoading}>Getting your combined Pulse…</p>
          )}
          {blockCount >= 2 && aggregation && !loadingAggregation && (
            <>
              {aggregation.pulse_score_framing && (
                <p className={styles.aggregationText} style={{ marginBottom: 12 }}>
                  {aggregation.pulse_score_framing}
                </p>
              )}
              <section className={styles.narrativeSection} aria-labelledby="pulse-connects-heading">
                <h2 id="pulse-connects-heading" className={styles.narrativeHeading}>What&apos;s connecting today</h2>
                <p className={styles.narrativeText}>{aggregation.what_connects}</p>
              </section>
              {aggregation.pulse_drivers.length > 0 && (
                <section className={styles.narrativeSection} aria-labelledby="pulse-drivers-heading">
                  <h2 id="pulse-drivers-heading" className={styles.narrativeHeading}>What&apos;s driving your Pulse score</h2>
                  <ul className={styles.explanationList} aria-label="Cross-block drivers">
                    {aggregation.pulse_drivers.map((line, i) => (
                      <li key={i} className={styles.explanationItem}>
                        <span className={styles.explanationText}>{line}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {aggregation.recommendations.length > 0 && (
                <section className={styles.narrativeSection} aria-labelledby="pulse-recs-heading">
                  <h2 id="pulse-recs-heading" className={styles.narrativeHeading}>Prioritized recommendations</h2>
                  <ol className={styles.recommendationList}>
                    {aggregation.recommendations.map((rec, i) => (
                      <li key={i} className={styles.recommendationItem}>
                        <strong>{rec.action}</strong>
                        {rec.observe && <> – {rec.observe}</>}
                        {rec.why && <p className={styles.recommendationWhy}>{rec.why}</p>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {aggregation.tomorrow_signal && (
                <section className={styles.narrativeSection} aria-labelledby="pulse-tomorrow-heading">
                  <h2 id="pulse-tomorrow-heading" className={styles.narrativeHeading}>Tomorrow&apos;s signal to watch</h2>
                  <p className={styles.narrativeOneThing}>{aggregation.tomorrow_signal}</p>
                </section>
              )}
              {aggregation.cta && (
                <p className={styles.ctaText} style={{ marginTop: 12 }}>{aggregation.cta}</p>
              )}
            </>
          )}
          {((!aggregation && !loadingAggregation) || blockCount === 1) && (
            <>
              {blockCount >= 2 && (
                <p className={styles.narrativeIntro}>
              {blockCount === 2
                ? `Based on your ${blockNames(2)}: what’s shaping your Pulse and one thing to try.`
                : 'Based on all your inputs: what’s shaping your Pulse and one thing to try.'}
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
                      Today’s pattern
                    </h2>
                    <p className={styles.narrativeInsight}>{bodySnapshot.insight}</p>
                    {hasRoutine && routineEntry?.analysis?.pattern && (
                      <p className={styles.narrativeText} style={{ marginTop: 12 }}>{routineEntry.analysis.pattern}</p>
                    )}
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
          {hasRoutine && routineEntry?.analysis && !hasBody && (
            <>
              <section className={styles.narrativeSection} aria-labelledby="pulse-pattern-heading">
                <h2 id="pulse-pattern-heading" className={styles.narrativeHeading}>Today’s pattern</h2>
                <p className={styles.narrativeText}>{routineEntry.analysis.pattern}</p>
              </section>
              {routineEntry.analysis.shaping && (
                <section className={styles.narrativeSection} aria-labelledby="pulse-why-heading">
                  <h2 id="pulse-why-heading" className={styles.narrativeHeading}>What’s shaping your Pulse</h2>
                  <p className={styles.narrativeText} style={{ whiteSpace: 'pre-line' }}>{routineEntry.analysis.shaping.replace(/^[•\s]+/gm, '• ').trim()}</p>
                </section>
              )}
              {routineEntry.analysis.oneThing && (
                <section className={styles.narrativeSection} aria-labelledby="pulse-one-heading">
                  <h2 id="pulse-one-heading" className={styles.narrativeHeading}>One thing to try</h2>
                  <p className={styles.narrativeOneThing}>{routineEntry.analysis.oneThing}</p>
                </section>
              )}
            </>
          )}
          {(hasBoth || hasAllThree) && (bodySnapshot?.improvements?.[0] || routineEntry?.analysis?.oneThing) && (
            <section className={styles.narrativeSection} aria-labelledby="pulse-one-heading">
              <h2 id="pulse-one-heading" className={styles.narrativeHeading}>One thing to try</h2>
              <p className={styles.narrativeOneThing}>
                {bodySnapshot?.improvements?.[0] ?? routineEntry?.analysis?.oneThing}
              </p>
            </section>
          )}
          {hasNutrition && blockCount >= 2 && (
            <section className={styles.narrativeSection} aria-label="Nutrition note">
              <p className={styles.narrativeText}>
                You logged nutrition today. Together with body and work data, this gives a fuller picture for your Pulse.
              </p>
            </section>
          )}
            </>
          )}
        </div>
      )}

    </div>
  ) : null;

  const emptyStateBlock = blockCount === 0 ? (
    <div className={styles.emptyState}>
      <p className={styles.emptyHeading}>No Pulse yet today</p>
      <p className={styles.emptyText}>
        Log at least one block to see your Pulse. Add more blocks to get combined recommendations (2 blocks) or full recommendations using all three (Body Signals, Work Routine, Nutrition).
      </p>
      <div className={styles.emptyLinks}>
        <Link to="/dashboard/body-signals/log" className={styles.emptyLink}>
          Body Signals
        </Link>
        <Link to="/dashboard/work-routine/checkin" className={styles.emptyLink}>
          Work Routine
        </Link>
        <Link to="/dashboard/nutrition" className={styles.emptyLink}>
          Nutrition
        </Link>
        <Link to="/dashboard" className={styles.emptyLink}>
          Main dashboard
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
        <h1 className={styles.title}>
          {hasAllThree
            ? 'Your Pulse (all 3 blocks)'
            : blockCount === 2
              ? 'Your Pulse (2 blocks)'
              : 'Your Pulse'}
        </h1>
        <p className={styles.subtitle}>
          {blockCount === 0
            ? 'Log at least one block to see your Pulse and recommendations.'
            : blockCount === 1
              ? `Based on ${blockNames(1)}. Add more blocks for combined recommendations.`
              : blockCount === 2
                ? `Recommendations below use your ${blockNames(2)}. Add the third block for full Pulse.`
                : 'Recommendations below are based on Body Signals, Work Routine, and Nutrition.'}
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
              <Link to="/dashboard" className={styles.ctaSecondary}>
                Continue with other blocks
              </Link>
            </div>
          </div>
        )}

        {showOfferBodySignals && (
          <div className={styles.ctaCard} role="region" aria-labelledby="cta-heading-bs">
            <h2 id="cta-heading-bs" className={styles.ctaHeading}>
              Add Body Signals for your best Pulse
            </h2>
            <p className={styles.ctaText}>
              You logged work routine today. Adding sleep, energy, and mood will give you combined recommendations: how body and work connect.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/dashboard/body-signals/log" className={styles.ctaPrimary}>
                Add Body Signals
              </Link>
              <Link to="/dashboard" className={styles.ctaSecondary}>
                Continue with other blocks
              </Link>
            </div>
          </div>
        )}

        {showOfferNutrition && (
          <div className={styles.ctaCard} role="region" aria-labelledby="cta-heading-nut">
            <h2 id="cta-heading-nut" className={styles.ctaHeading}>
              Add Nutrition for your full Pulse
            </h2>
            <p className={styles.ctaText}>
              You have Body Signals and Work Routine. Log fridge or nutrition to get recommendations based on all three blocks.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/dashboard/nutrition" className={styles.ctaPrimary}>
                Log Nutrition
              </Link>
              <Link to="/dashboard" className={styles.ctaSecondary}>
                Go to main dashboard
              </Link>
            </div>
          </div>
        )}

        {blockCount >= 1 && (
          <div className={styles.continueBlock}>
            <p className={styles.ctaText}>
              {blockCount < 3
                ? 'Continue with other blocks on the main dashboard to get recommendations based on more of your data.'
                : 'Go back to the dashboard to log more or update your inputs.'}
            </p>
            <Link to="/dashboard" className={styles.ctaPrimary}>
              {blockCount < 3 ? 'Continue with other blocks' : 'Go to main dashboard'}
            </Link>
            <button
              type="button"
              className={styles.reportDownload}
              disabled={reportLoading}
              onClick={handleDownloadReport}
            >
              {reportLoading ? 'Generating your report...' : "Download today's report"}
            </button>
            {reportError && <p className={styles.reportToast} role="alert">{reportError}</p>}
          </div>
        )}

        {emptyStateBlock}
      </main>
    </div>
  );
}
