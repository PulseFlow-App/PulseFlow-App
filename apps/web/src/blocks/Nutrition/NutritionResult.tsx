import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLatestFridgeLog } from './store';
import { getMealTimingForDate, hasMealTimingToday } from './mealTimingStore';
import { hasHydrationTimingToday, getHydrationTimingForDate } from './hydrationTimingStore';
import { hasReflectionsToday } from './postMealReflectionStore';
import { getPostMealReflections } from './postMealReflectionStore';
import { hasMealPhotosToday, getMealPhotoInsightsForDate } from './mealPhotoStore';
import { hasFridgePhotoToday } from './fridgePhotoStore';
import { getApiUrl } from '../../lib/apiUrl';
import { getFullAccessForTesting } from '../../lib/featureFlags';
import { ScoreRing } from '../../components/ScoreRing';
import { getCombinedPulse } from '../../stores/combinedPulse';
import { getBodyLogs } from '../BodySignals/store';
import { getLatestCheckIn } from '../WorkRoutine/store';
import { WhatNextSection } from '../../components/WhatNextSection';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useHasWallet } from '../../contexts/WalletContext';
import styles from './Nutrition.module.css';

type FromSource = 'fridge' | 'meal-timing' | 'hydration';

const SOURCE_LABELS: Record<FromSource, string> = {
  fridge: 'Fridge log saved',
  'meal-timing': 'Meal timing saved',
  hydration: 'Hydration timing saved',
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Required = meal timing + hydration. Optional = reflections, meal photos, fridge. Checklist updates reactively from stores. */
function NutritionProgressChecklist() {
  const mealDone = hasMealTimingToday();
  const hydrationDone = hasHydrationTimingToday();
  const reflectionsDone = hasReflectionsToday();
  const mealPhotosDone = hasMealPhotosToday();
  const fridgeDone = hasFridgePhotoToday();

  return (
    <section className={styles.progressCard} role="region" aria-labelledby="nutrition-progress-heading">
      <h2 id="nutrition-progress-heading" className={styles.progressHeading}>
        Nutrition block
      </h2>
      <ul className={styles.progressList}>
        <li className={styles.progressItem}>
          {mealDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Meal timing</span>
          {mealDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/meal-timing" className={styles.progressLink}>Log now</Link>}
        </li>
        <li className={styles.progressItem}>
          {hydrationDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Hydration timing</span>
          {hydrationDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/hydration" className={styles.progressLink}>Log now</Link>}
        </li>
        <li className={styles.progressItem}>
          {reflectionsDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Post-meal reflections</span>
          {reflectionsDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/reflections" className={styles.progressLinkOptional}>Add</Link>}
        </li>
        <li className={styles.progressItem}>
          {mealPhotosDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Meal photos</span>
          {mealPhotosDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/meal-photo" className={styles.progressLinkOptional}>Add</Link>}
        </li>
        <li className={styles.progressItem}>
          {fridgeDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Fridge photos</span>
          {fridgeDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/fridge-photo" className={styles.progressLinkOptional}>Add</Link>}
        </li>
      </ul>
    </section>
  );
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
        AI will detect ingredients in your photos and suggest meals you can make. Results use only what it sees; no guessing.
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

/** Build nutrition payload for API: meal timing, hydration, reflections, fridge (today). */
function buildNutritionPayload() {
  const today = todayStr();
  const meal = getMealTimingForDate(today);
  const hydration = getHydrationTimingForDate(today);
  const reflections = getPostMealReflections().filter((r) => r.date === today);
  const fridge = getLatestFridgeLog();
  const fridgeToday = fridge?.timestamp?.slice(0, 10) === today ? fridge : undefined;
  const meal_photo_insights = getMealPhotoInsightsForDate(today);
  return {
    mealTiming: meal ? { firstMealTime: meal.firstMealTime, lastMealTime: meal.lastMealTime, biggestMeal: meal.biggestMeal, lateNightEating: meal.lateNightEating, proteinAtBreakfast: meal.proteinAtBreakfast, proteinAtLastMeal: meal.proteinAtLastMeal } : null,
    hydration: hydration ? { when: hydration.when, notes: hydration.notes } : null,
    reflections: reflections.length > 0 ? reflections.map((r) => ({ feeling: r.feeling, notes: r.notes })) : [],
    fridge: fridgeToday ? { hasPhotos: !!(fridgeToday.freezer || fridgeToday.main || fridgeToday.veggie), notes: fridgeToday.notes } : null,
    meal_photo_insights: meal_photo_insights.length > 0 ? meal_photo_insights : undefined,
  };
}

/** Body handoff for today (if body logged today). */
function getBodyHandoff(): Record<string, unknown> | undefined {
  const today = todayStr();
  const logs = getBodyLogs();
  const entry = logs.find((l) => l.date === today);
  if (!entry) return undefined;
  return {
    date: entry.date,
    sleepHours: entry.sleepHours,
    sleepQuality: entry.sleepQuality,
    energy: entry.energy,
    mood: entry.mood,
    hydration: entry.hydration,
    stress: entry.stress,
    appetite: entry.appetite,
    digestion: entry.digestion,
    notes: entry.notes,
  };
}

/** Work handoff for today (if work routine logged today). */
function getWorkHandoff(): Record<string, unknown> | undefined {
  const latest = getLatestCheckIn();
  if (!latest) return undefined;
  const today = todayStr();
  if (latest.timestamp.slice(0, 10) !== today) return undefined;
  return latest.metrics ? { metrics: latest.metrics, analysis: latest.analysis } : undefined;
}

const NUTRITION_BLOCK_SCORE_DEFAULT = 80;

export function NutritionResult() {
  const hasWallet = useHasWallet();
  const { hasActiveSubscription } = useSubscription();
  const fullAccessForTesting = getFullAccessForTesting();
  const showWalletGatedContent = hasWallet || fullAccessForTesting;
  const location = useLocation();
  const rawFrom = (location.state as { from?: FromSource })?.from;
  const from: FromSource =
    rawFrom === 'meal-timing' || rawFrom === 'hydration' ? rawFrom : 'fridge';

  const mealDone = hasMealTimingToday();
  const hydrationDone = hasHydrationTimingToday();
  const hasRequired = mealDone && hydrationDone;

  const [loadingAI, setLoadingAI] = useState(false);
  const [aiOutput, setAiOutput] = useState<{ pattern: string; shaping: string; oneThing: string } | null>(null);

  const pulse = getCombinedPulse();
  const blockCount = pulse.blockCount;
  const hasOtherBlocks = blockCount >= 2;

  const optionalDataVersion = getPostMealReflections().length + (getLatestFridgeLog()?.id ?? '');

  useEffect(() => {
    if (!hasRequired) {
      setAiOutput(null);
      return;
    }
    const apiBase = getApiUrl();
    if (!apiBase) {
      setAiOutput(null);
      return;
    }
    setLoadingAI(true);
    const nutrition = buildNutritionPayload();
    const bodyHandoff = getBodyHandoff();
    const workHandoff = getWorkHandoff();
    fetch(`${apiBase}/insights/nutrition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nutrition,
        body_handoff: bodyHandoff,
        work_handoff: workHandoff,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.pattern === 'string') {
          setAiOutput({
            pattern: data.pattern.trim(),
            shaping: typeof data.shaping === 'string' ? data.shaping.trim() : '',
            oneThing: typeof data.oneThing === 'string' ? data.oneThing.trim() : '',
          });
        } else {
          setAiOutput(null);
        }
      })
      .catch(() => setAiOutput(null))
      .finally(() => setLoadingAI(false));
  }, [hasRequired, optionalDataVersion]);

  const shapingBullets = aiOutput?.shaping
    ? aiOutput.shaping
        .split(/\n+/)
        .map((s) => s.replace(/^[•\-\s]+/, '').trim())
        .filter(Boolean)
    : [];
  const showAiBlock = aiOutput && (aiOutput.pattern || shapingBullets.length > 0 || aiOutput.oneThing);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/nutrition" className={styles.back}>
          ← Nutrition
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>
            {hasRequired ? 'Your Nutrition Pulse' : SOURCE_LABELS[from]}
          </h1>
          <p className={styles.subtitle}>
            {hasRequired
              ? "Here's your result from this block. See your Pulse below, then go to the main dashboard or view your full Pulse."
              : mealDone && !hydrationDone
                ? 'Add hydration timing to complete your Nutrition block. Optional inputs below give you richer insights.'
                : hydrationDone && !mealDone
                  ? 'Add meal timing to complete your Nutrition block. Optional inputs below give you richer insights.'
                  : 'Add meal timing and hydration timing to complete your Nutrition block. Optional inputs below give you richer insights.'}
          </p>
        </div>

        {!hasRequired && (
          <>
            <NutritionProgressChecklist />
            <WhatNextSection variant="nutrition" />
          </>
        )}

        {hasRequired && (
          <>
            <div className={styles.card}>
              <div className={styles.scoreSection}>
                <ScoreRing score={NUTRITION_BLOCK_SCORE_DEFAULT} label="Your Nutrition Pulse" />
              </div>
              {loadingAI ? (
                <p className={styles.aiLoading}>Getting your pattern…</p>
              ) : (
                showAiBlock && (
                  <>
                    {aiOutput!.pattern && (
                      <section className={styles.narrativeSection} aria-labelledby="nutrition-pattern-heading">
                        <h2 id="nutrition-pattern-heading" className={styles.narrativeHeading}>Today&apos;s pattern</h2>
                        <p className={styles.narrativeText}>{aiOutput!.pattern}</p>
                      </section>
                    )}
                    {shapingBullets.length > 0 && (
                      <section className={styles.narrativeSection} aria-labelledby="nutrition-shaping-heading">
                        <h2 id="nutrition-shaping-heading" className={styles.narrativeHeading}>What&apos;s shaping your nutrition signals</h2>
                        <ul className={styles.shapingList}>
                          {shapingBullets.map((line, i) => (
                            <li key={i} className={styles.shapingItem}>{line}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {aiOutput!.oneThing && (
                      <section className={styles.narrativeSection} aria-labelledby="nutrition-one-heading">
                        <h2 id="nutrition-one-heading" className={styles.narrativeHeading}>One thing to try</h2>
                        <p className={styles.narrativeText}>{aiOutput!.oneThing}</p>
                      </section>
                    )}
                    {!hasActiveSubscription && aiOutput!.oneThing && (
                      <section className={styles.narrativeSection} aria-labelledby="nutrition-get-more-heading">
                        <h2 id="nutrition-get-more-heading" className={styles.narrativeHeading}>Get more</h2>
                        <p className={styles.narrativeText}>
                          Upgrade to Premium for a recommendation based on how your nutrition pattern connected to your body signals and work day.
                        </p>
                      </section>
                    )}
                  </>
                )
              )}
            </div>

            {hasOtherBlocks ? (
              <div className={styles.card}>
                <Link to="/dashboard/pulse" className={styles.button} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                  View your full Pulse
                </Link>
              </div>
            ) : (
              <WhatNextSection variant="nutrition" />
            )}

            {from === 'fridge' && showWalletGatedContent && <RecipeIdeasSection />}
            {from === 'fridge' && !showWalletGatedContent && (
              <section className={styles.stabilityCard} role="region" aria-labelledby="recipe-gate-heading">
                <h2 id="recipe-gate-heading" className={styles.stabilityHeading}>Recipe ideas</h2>
                <p className={styles.stabilityText}>Connect your wallet to unlock AI recipe ideas from your fridge photos.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
