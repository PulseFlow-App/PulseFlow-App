import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getBodyLogs } from '../BodySignals/store';
import { getApiUrl } from '../../lib/apiUrl';
import { getMealPhotosForDate, addMealPhoto, updateMealPhotoAnalysis } from './mealPhotoStore';
import type { MealPhotoEntry, MealPhotoAnalysis } from './types';
import { compressDataUrlToMaxBytes } from '../../lib/compressImageToLimit';
import { MAX_PHOTO_BYTES, getDataUrlDecodedBytes } from '../../lib/photoLimit';
import { photoFileToDataUrl, isHeicFile } from '../../lib/photoFileToDataUrl';
import styles from './Nutrition.module.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Body signals for today (if logged) for meal photo context. */
function getBodySignalsForMealPhoto(): Record<string, unknown> | undefined {
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

async function analyzeMealPhoto(dataUrl: string): Promise<{ analysis: MealPhotoAnalysis } | { error: string }> {
  const apiBase = getApiUrl();
  if (!apiBase) return { error: 'API URL is not set.' };
  const bodySignals = getBodySignalsForMealPhoto();
  const res = await fetch(`${apiBase}/insights/meal-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl, body_signals: bodySignals }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data?.message || res.statusText || 'Analysis failed' };
  if (data.whatsOnPlate != null && data.approximateNutrition != null && data.oneSuggestion != null) {
    return {
      analysis: {
        whatsOnPlate: String(data.whatsOnPlate).trim(),
        approximateNutrition: String(data.approximateNutrition).trim(),
        oneSuggestion: String(data.oneSuggestion).trim(),
      },
    };
  }
  return { error: 'Invalid response' };
}

function MealPhotoCard({
  entry,
  onRetry,
}: {
  entry: MealPhotoEntry;
  onRetry: (id: string) => void;
}) {
  const { id, timestamp, dataUrl, analysis, error } = entry;
  const timeLabel = formatTime(timestamp);

  if (error) {
    return (
      <article className={styles.mealPhotoCard} aria-labelledby={`meal-photo-time-${id}`}>
        <p id={`meal-photo-time-${id}`} className={styles.mealPhotoTime}>
          {timeLabel}
        </p>
        <img src={dataUrl} alt="Meal" className={styles.mealPhotoImage} />
        <button
          type="button"
          className={styles.mealPhotoRetry}
          onClick={() => onRetry(id)}
        >
          Could not analyze this photo — tap to retry.
        </button>
      </article>
    );
  }

  if (!analysis) {
    return (
      <article className={styles.mealPhotoCard}>
        <p className={styles.mealPhotoTime}>{timeLabel}</p>
        <img src={dataUrl} alt="Meal" className={styles.mealPhotoImage} />
        <p className={styles.aiLoading}>Analyzing…</p>
      </article>
    );
  }

  return (
    <article className={styles.mealPhotoCard} aria-labelledby={`meal-photo-time-${id}`}>
      <p id={`meal-photo-time-${id}`} className={styles.mealPhotoTime}>
        {timeLabel}
      </p>
      <img src={dataUrl} alt="Meal" className={styles.mealPhotoImage} />
      <section className={styles.narrativeSection} aria-labelledby={`plate-${id}`}>
        <h2 id={`plate-${id}`} className={styles.narrativeHeading}>What&apos;s on your plate</h2>
        <p className={styles.narrativeText}>{analysis.whatsOnPlate}</p>
      </section>
      <section className={styles.narrativeSection} aria-labelledby={`nutrition-${id}`}>
        <h2 id={`nutrition-${id}`} className={styles.narrativeHeading}>Approximate nutrition</h2>
        <p className={styles.narrativeText}>{analysis.approximateNutrition}</p>
      </section>
      <section className={styles.narrativeSection} aria-labelledby={`suggestion-${id}`}>
        <h2 id={`suggestion-${id}`} className={styles.narrativeHeading}>One suggestion</h2>
        <p className={styles.narrativeText}>{analysis.oneSuggestion}</p>
      </section>
    </article>
  );
}

export function NutritionMealPhoto() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = todayStr();
  const [entries, setEntries] = useState<MealPhotoEntry[]>(() => getMealPhotosForDate(today));
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const refreshEntries = () => setEntries(getMealPhotosForDate(today));

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
    setFileError(null);
    try {
      let dataUrl = await photoFileToDataUrl(file);
      const bytes = getDataUrlDecodedBytes(dataUrl);
      if (bytes > MAX_PHOTO_BYTES) {
        dataUrl = await compressDataUrlToMaxBytes(dataUrl, MAX_PHOTO_BYTES);
      }
      const newEntry = addMealPhoto({ date: today, dataUrl });
      refreshEntries();
      try {
        const result = await analyzeMealPhoto(dataUrl);
        if ('analysis' in result) {
          updateMealPhotoAnalysis(newEntry.id, result.analysis, false);
        } else {
          updateMealPhotoAnalysis(newEntry.id, null, true);
        }
      } catch {
        updateMealPhotoAnalysis(newEntry.id, null, true);
      }
      refreshEntries();
    } catch {
      setFileError('Could not process photo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (id: string) => {
    const entry = getMealPhotosForDate(today).find((e) => e.id === id);
    if (!entry?.dataUrl) return;
    try {
      const result = await analyzeMealPhoto(entry.dataUrl);
      if ('analysis' in result) {
        updateMealPhotoAnalysis(id, result.analysis, false);
      } else {
        updateMealPhotoAnalysis(id, null, true);
      }
      refreshEntries();
    } catch {
      updateMealPhotoAnalysis(id, null, true);
      refreshEntries();
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
          <h1 className={styles.title}>Meal photos</h1>
          <p className={styles.subtitle}>
            Add a photo of your meal. We&apos;ll describe what we see, estimate approximate nutrition, and offer one suggestion. One photo per meal; add as many as you like for the day.
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
          {submitting ? 'Adding…' : 'Add meal photo'}
        </button>
        {fileError && <p className={styles.photoError} role="alert">{fileError}</p>}

        <div className={styles.mealPhotoList}>
          {entries.map((entry) => (
            <MealPhotoCard
              key={entry.id}
              entry={entry}
              onRetry={handleRetry}
            />
          ))}
        </div>

        {entries.length > 0 && (
          <Link to="/dashboard/nutrition/result" className={styles.buttonSecondary} style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
            Back to Nutrition
          </Link>
        )}
      </main>
    </div>
  );
}
