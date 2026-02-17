import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getNutritionPatternBlock, getWeeklyNutritionStability } from './patternInsights';
import { getLatestFridgeLog } from './store';
import { getApiUrl } from '../../lib/apiUrl';
import { NextStepModal } from '../../components/NextStepModal';
import styles from './Nutrition.module.css';

type FromSource = 'fridge' | 'meal-timing' | 'hydration';

const SOURCE_LABELS: Record<FromSource, string> = {
  fridge: 'Fridge log saved',
  'meal-timing': 'Meal timing saved',
  hydration: 'Hydration timing saved',
};

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
  const location = useLocation();
  const rawFrom = (location.state as { from?: FromSource })?.from;
  const from: FromSource =
    rawFrom === 'meal-timing' || rawFrom === 'hydration' ? rawFrom : 'fridge';
  const block = getNutritionPatternBlock();
  const stability = getWeeklyNutritionStability();
  const [showNextStepModal, setShowNextStepModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowNextStepModal(true), 500);
    return () => clearTimeout(t);
  }, []);

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
            Here’s your analysis and recommendations. Add more data to get a more precise Pulse.
          </p>
        </div>

        <section className={styles.stabilityCard} role="region" aria-labelledby="result-stability-heading">
          <h2 id="result-stability-heading" className={styles.stabilityHeading}>
            This week
          </h2>
          <p className={styles.stabilityText}>
            {stability.daysLogged} day{stability.daysLogged !== 1 ? 's' : ''} logged (meal or hydration). {stability.label}
          </p>
        </section>

        <section className={styles.insightsCard} role="region" aria-labelledby="result-pattern-heading">
          <h2 id="result-pattern-heading" className={styles.insightsHeading}>
            {block.mode === 'no_data' ? "Today's insight" : "Analysis & recommendations"}
          </h2>
          <p className={styles.patternText}>{block.pattern}</p>
          {block.influencing.length > 0 && (
            <>
              <h3 className={styles.influencingHeading}>What&apos;s influencing it</h3>
              <ul className={styles.insightsList}>
                {block.influencing.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          )}
          <p className={styles.oneAdjustment}>
            <strong>Trick to try:</strong> {block.oneAdjustment}
          </p>
        </section>

        {from === 'fridge' && <RecipeIdeasSection />}

        <p className={styles.resultPulseCopy}>
          Your Pulse gets more precise as you add more blocks (Body Signals, Work Routine, Nutrition). View it now or keep logging to refine it.
        </p>

        <Link to="/dashboard/pulse" className={styles.button}>
          View Pulse score
        </Link>
        <Link to="/dashboard/nutrition" className={styles.buttonSecondary}>
          Add more nutrition data
        </Link>
        <Link to="/dashboard" className={styles.buttonSecondary}>
          Go to other blocks
        </Link>
      </main>
      <NextStepModal
        isOpen={showNextStepModal}
        onClose={() => setShowNextStepModal(false)}
        onDashboard={false}
      />
    </div>
  );
}
