import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLatestFridgeLog } from './store';
import { getApiUrl } from '../../lib/apiUrl';
import { WhatNextSection } from '../../components/WhatNextSection';
import { useHasWallet } from '../../contexts/WalletContext';
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
  const hasWallet = useHasWallet();
  const location = useLocation();
  const rawFrom = (location.state as { from?: FromSource })?.from;
  const from: FromSource =
    rawFrom === 'meal-timing' || rawFrom === 'hydration' ? rawFrom : 'fridge';

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
            Here’s your result from this block. Below: go to the main dashboard to add other blocks and get combined recommendations (2 or 3 blocks).
          </p>
        </div>

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
