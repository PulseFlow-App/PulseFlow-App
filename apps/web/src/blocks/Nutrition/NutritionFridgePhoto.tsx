import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getBodyLogs } from '../BodySignals/store';
import { getApiUrl } from '../../lib/apiUrl';
import { getFridgePhotoForDate, setFridgePhotoForDate } from './fridgePhotoStore';
import type { FridgePhotoEntry, FridgePhotoMeal } from './types';
import { compressDataUrlToMaxBytes } from '../../lib/compressImageToLimit';
import { MAX_PHOTO_BYTES, getDataUrlDecodedBytes } from '../../lib/photoLimit';
import { photoFileToDataUrl, isHeicFile } from '../../lib/photoFileToDataUrl';
import styles from './Nutrition.module.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getBodySignals(): Record<string, unknown> | undefined {
  const today = todayStr();
  const logs = getBodyLogs();
  const entry = logs.find((l) => l.date === today);
  if (!entry) return undefined;
  return {
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

async function analyzeFridgePhoto(dataUrl: string): Promise<
  { whatsVisible: string; meals: FridgePhotoMeal[] } | { error: string }
> {
  const apiBase = getApiUrl();
  if (!apiBase) return { error: 'API URL is not set.' };
  const bodySignals = getBodySignals();
  const res = await fetch(`${apiBase}/insights/fridge-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl, body_signals: bodySignals }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || res.statusText || 'Analysis failed' };
  if (typeof data.whatsVisible === 'string' && Array.isArray(data.meals)) {
    const meals = data.meals
      .filter((m: unknown) => m && typeof m === 'object' && typeof (m as { name?: unknown }).name === 'string')
      .map((m: { name: string; description?: string; steps?: unknown[]; signalConnection?: string }) => ({
        name: String(m.name).trim(),
        description: typeof m.description === 'string' ? m.description.trim() : '',
        steps: Array.isArray(m.steps) ? m.steps.map((s) => String(s).trim()).filter(Boolean) : [],
        signalConnection: typeof m.signalConnection === 'string' ? m.signalConnection.trim() : undefined,
      }));
    return { whatsVisible: data.whatsVisible.trim(), meals };
  }
  return { error: 'Invalid response' };
}

function MealCard({ meal }: { meal: FridgePhotoMeal }) {
  const handleGetFullRecipe = () => {
    window.alert('Full recipe view is coming soon. You can use "Log fridge photos" (3 compartments) for detailed recipe ideas in the meantime.');
  }

  return (
    <article className={styles.fridgeMealCard}>
      <h3 className={styles.fridgeMealName}>{meal.name}</h3>
      {meal.description && (
        <p className={styles.fridgeMealDescription}>{meal.description}</p>
      )}
      {meal.steps.length > 0 && (
        <ol className={styles.fridgeMealSteps}>
          {meal.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      {meal.signalConnection && (
        <p className={styles.fridgeMealSignal}>{meal.signalConnection}</p>
      )}
      <button
        type="button"
        className={styles.fridgeMealRecipeBtn}
        onClick={handleGetFullRecipe}
      >
        Get full recipe
      </button>
    </article>
  );
}

export function NutritionFridgePhoto() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = todayStr();
  const [entry, setEntry] = useState<FridgePhotoEntry | undefined>(() => getFridgePhotoForDate(today));
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setFileError(null);
    if (!file) return;
    const allowed = ALLOWED_TYPES.includes(file.type) || isHeicFile(file);
    if (!allowed) {
      setFileError('Use JPEG, PNG, WebP, or HEIC (iPhone).');
      return;
    }
    setSubmitting(true);
    let dataUrl: string | null = null;
    try {
      dataUrl = await photoFileToDataUrl(file);
      const bytes = getDataUrlDecodedBytes(dataUrl);
      if (bytes > MAX_PHOTO_BYTES) {
        dataUrl = await compressDataUrlToMaxBytes(dataUrl, MAX_PHOTO_BYTES);
      }
      setFridgePhotoForDate(today, { dataUrl });
      setEntry(getFridgePhotoForDate(today));

      const result = await analyzeFridgePhoto(dataUrl);
      if ('error' in result) {
        setFridgePhotoForDate(today, { dataUrl, error: true });
      } else {
        setFridgePhotoForDate(today, { dataUrl, analysis: result });
      }
      setEntry(getFridgePhotoForDate(today));
    } catch {
      if (dataUrl) {
        setFridgePhotoForDate(today, { dataUrl, error: true });
        setEntry(getFridgePhotoForDate(today));
      }
      setFileError('Could not process photo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/nutrition" className={styles.back}>
          ← Nutrition
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Fridge photo</h1>
          <p className={styles.subtitle}>
            Take one photo of your fridge or pantry. We&apos;ll list what we see and suggest 2–3 meals you could make right now. One photo per day; submitting again replaces the previous.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className={styles.hiddenInput}
          aria-hidden
          onChange={handleFileChange}
          disabled={submitting}
        />
        <button
          type="button"
          className={styles.button}
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Analyzing…' : entry ? 'Replace fridge photo' : 'Add fridge photo'}
        </button>
        {fileError && <p className={styles.photoError} role="alert">{fileError}</p>}

        {entry && (
          <div className={styles.fridgePhotoResult}>
            <img src={entry.dataUrl} alt="Your fridge" className={styles.mealPhotoImage} />

            {entry.error && (
              <p className={styles.fridgePhotoError}>
                Could not read this photo — try a clearer shot of your fridge.
              </p>
            )}

            {entry.analysis && !entry.error && (
              <>
                <section className={styles.narrativeSection} aria-labelledby="fridge-what-heading">
                  <h2 id="fridge-what-heading" className={styles.narrativeHeading}>What I can see</h2>
                  <p className={styles.narrativeText}>{entry.analysis.whatsVisible}</p>
                </section>

                <section className={styles.narrativeSection} aria-labelledby="fridge-meals-heading">
                  <h2 id="fridge-meals-heading" className={styles.narrativeHeading}>Meals you could make right now</h2>
                  <div className={styles.fridgeMealCards}>
                    {entry.analysis.meals.map((meal, i) => (
                      <MealCard key={i} meal={meal} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {entry && (
          <Link to="/dashboard/nutrition/result" className={styles.buttonSecondary} style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
            Back to Nutrition
          </Link>
        )}
      </main>
    </div>
  );
}
