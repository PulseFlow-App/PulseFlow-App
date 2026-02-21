import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLatestFridgeLog } from './store';
import { getMealTimingForDate } from './mealTimingStore';
import { getApiUrl } from '../../lib/apiUrl';
import { ScoreRing } from '../../components/ScoreRing';
import { getCombinedPulse, hasBodyTodayCheck, hasRoutineTodayCheck, hasNutritionTodayCheck } from '../../stores/combinedPulse';
import { WhatNextSection } from '../../components/WhatNextSection';
import { useHasWallet } from '../../contexts/WalletContext';
import styles from './Nutrition.module.css';
import pulseStyles from '../../pages/Pulse.module.css';

type FromSource = 'fridge' | 'meal-timing' | 'hydration';

const SOURCE_LABELS: Record<FromSource, string> = {
  fridge: 'Fridge log saved',
  'meal-timing': 'Meal timing saved',
  hydration: 'Hydration timing saved',
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Short recommendations from today's meal timing data. */
function getMealTimingTips(): string[] {
  const today = todayStr();
  const entry = getMealTimingForDate(today);
  if (!entry) return [];
  const tips: string[] = [];
  if (entry.lateNightEating) {
    tips.push('Consider an earlier last meal to support sleep.');
  }
  if (entry.biggestMeal === 'evening') {
    tips.push('Having your biggest meal earlier in the day can help energy and sleep.');
  }
  if (entry.proteinAtBreakfast === false) {
    tips.push('Protein at breakfast can help steady energy.');
  }
  if (entry.proteinAtLastMeal === false && entry.lateNightEating) {
    tips.push('A little protein at your last meal may help with satiety and sleep.');
  }
  return tips;
}

function RecipeIdeasSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latest = getLatestFridgeLog();
  const images: string[] = [];
  if (latest?.freezer?.dataUrl) images.push(latest.freezer.dataUrl);
  if (latest?.main?.dataUrl) images.push(latest.main.dataUrl);
  if (latest?.veggie?.dataUrl) images.push(latest.veggie.dataUrl);
  const notes = latest?.notes?.trim();

  const handleGenerate = async () => {
    const apiBase = getApiUrl();
    if (!apiBase) {
      setError('API URL is not set. Recipe ideas need the Pulse API.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/insights/recipes-from-fridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, notes: notes || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || res.statusText || 'Failed to generate recipes');
        return;
      }
      if (data.text) setResult({ text: data.text });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (images.length === 0) return null;

  return (
    <section className={styles.recipeIdeasCard} role="region" aria-labelledby="recipe-ideas-heading">
      <h2 id="recipe-ideas-heading" className={styles.recipeIdeasHeading}>
        Recipe ideas from your fridge
      </h2>
      <p className={styles.recipeIdeasIntro}>
        AI will detect ingredients in your photos and suggest meals you can make. Results use only what it sees—no guessing.
      </p>
      {!result && !error && (
        <button
          type="button"
          className={styles.recipeIdeasButton}
          onClick={handleGenerate}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Analyzing photos…' : 'Generate recipe ideas'}
        </button>
      )}
      {error && <p className={styles.photoError} role="alert">{error}</p>}
      {result && (
        <div className={styles.recipeIdeasOutput}>
          <pre className={styles.recipeIdeasPre}>{result.text}</pre>
        </div>
      )}
    </section>
  );
}

export function NutritionResult() {
  const hasWallet = useHasWallet();
  const location = useLocation();
  const rawFrom = (location.state as { from?: FromSource })?.from;
  const from: FromSource =
    rawFrom === 'meal-timing' || rawFrom === 'hydration' ? rawFrom : 'fridge';

  const pulse = getCombinedPulse();
  const hasBody = hasBodyTodayCheck();
  const hasRoutine = hasRoutineTodayCheck();
  const hasNutrition = hasNutritionTodayCheck();
  const blockCount = pulse.blockCount;
  const hasBoth = hasBody && hasRoutine;
  const bodyShare = hasBoth ? 50 : pulse.body !== null ? 100 : 0;
  const routineShare = hasBoth ? 50 : pulse.routine !== null ? 100 : 0;
  const bodyScore = pulse.body ?? 0;
  const routineScore = pulse.routine ?? 0;

  const mealTips = from === 'meal-timing' ? getMealTimingTips() : [];

  const scoreCardLabel =
    blockCount === 3
      ? 'Your Pulse (all 3 blocks)'
      : hasBoth
        ? 'Combined Pulse (2 blocks)'
        : pulse.body !== null
          ? 'Body Pulse'
          : 'Work Pulse';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/nutrition" className={styles.back}>
          ← Nutrition
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>{SOURCE_LABELS[from]}</h1>
          <p className={styles.subtitle}>
            Here’s your result from this block. See your aggregated pulse below, then add more nutrition data or go to the main dashboard for combined recommendations.
          </p>
        </div>

        {/* Recommendations from this check-in */}
        {from === 'meal-timing' && (
          <section className={styles.card} role="region" aria-labelledby="nutrition-tips-heading">
            <h2 id="nutrition-tips-heading" className={styles.recommendationsHeading}>
              {mealTips.length > 0 ? 'Recommendations' : 'Saved'}
            </h2>
            {mealTips.length > 0 ? (
              <ul className={styles.recommendationsList}>
                {mealTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.recommendationsBody}>
                Your meal timing is saved. Add hydration, fridge photos, or other blocks on the main dashboard for combined recommendations and your full Pulse.
              </p>
            )}
          </section>
        )}
        {from === 'hydration' && (
          <section className={styles.card} role="region" aria-labelledby="hydration-saved-heading">
            <h2 id="hydration-saved-heading" className={styles.recommendationsHeading}>
              Saved
            </h2>
            <p className={styles.recommendationsBody}>
              Your hydration timing is saved. Add meal timing, fridge photos, or body signals and work routine to get combined recommendations and your full Pulse.
            </p>
          </section>
        )}

        {/* Aggregated pulse (same diagram as Body Signals / Work Routine / Pulse page) */}
        {pulse.combined !== null && (
          <div id="pulse-score" className={pulseStyles.scoreCard}>
            <ScoreRing score={pulse.combined} label={scoreCardLabel} />
            <div className={pulseStyles.diagramSection}>
              <h3 className={pulseStyles.diagramHeading}>What made it this way</h3>
              <div className={pulseStyles.diagramBar} aria-hidden="true">
                {pulse.body !== null && (
                  <div
                    className={`${pulseStyles.diagramSegment} ${pulseStyles.diagramSegmentBody} ${!hasBoth ? pulseStyles.diagramSegmentSolo : ''}`}
                    style={{ width: `${bodyShare}%` }}
                  />
                )}
                {pulse.routine !== null && (
                  <div
                    className={`${pulseStyles.diagramSegment} ${pulseStyles.diagramSegmentRoutine} ${!hasBoth ? pulseStyles.diagramSegmentSolo : ''}`}
                    style={{ width: `${routineShare}%` }}
                  />
                )}
              </div>
              <div className={pulseStyles.diagramLegend}>
                {pulse.body !== null && (
                  <span className={pulseStyles.diagramLegendItem}>
                    <span className={`${pulseStyles.diagramLegendDot} ${pulseStyles.diagramLegendDotBody}`} aria-hidden />
                    Body Signals: {bodyScore}%
                  </span>
                )}
                {pulse.routine !== null && (
                  <span className={pulseStyles.diagramLegendItem}>
                    <span className={`${pulseStyles.diagramLegendDot} ${pulseStyles.diagramLegendDotRoutine}`} aria-hidden />
                    Work Routine: {routineScore}%
                  </span>
                )}
              </div>
              {hasNutrition && (
                <p className={pulseStyles.aggregationText} style={{ marginTop: 12, marginBottom: 0 }}>
                  {blockCount === 3
                    ? 'Recommendations use all three blocks: Body Signals, Work Routine, and Nutrition.'
                    : 'Add more blocks on the main dashboard to get combined recommendations.'}
                </p>
              )}
            </div>
          </div>
        )}

        {from === 'fridge' && hasWallet && <RecipeIdeasSection />}
        {from === 'fridge' && !hasWallet && (
          <section className={styles.stabilityCard} role="region" aria-labelledby="recipe-gate-heading">
            <h2 id="recipe-gate-heading" className={styles.stabilityHeading}>Recipe ideas</h2>
            <p className={styles.stabilityText}>Connect your wallet to unlock AI recipe ideas from your fridge photos.</p>
          </section>
        )}

        <WhatNextSection variant="nutrition" />
      </main>
    </div>
  );
}
