import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { addFridgeLog } from './store';
import { RecoveryContextCard } from './RecoveryContextCard';
import type { FridgePhoto, FridgeSlot } from './types';
import { MAX_PHOTO_BYTES, MAX_PHOTO_LABEL, getDataUrlDecodedBytes } from '../../lib/photoLimit';
import { photoFileToDataUrl, isHeicFile } from '../../lib/photoFileToDataUrl';
import styles from './Nutrition.module.css';

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

const UPLOAD_TIMEOUT_MS = 60_000;

const SLOTS: { key: FridgeSlot; label: string }[] = [
  { key: 'freezer', label: 'Freezer' },
  { key: 'main', label: 'Main fridge' },
  { key: 'veggie', label: 'Veggie drawer' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

async function uploadPhoto(dataUrl: string, accessToken: string): Promise<string | undefined> {
  if (!API_BASE) return undefined;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/users/me/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ dataUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return undefined;
    const data = await res.json();
    const url = data.url;
    return typeof url === 'string' && url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : undefined;
  } catch {
    clearTimeout(timeoutId);
    return undefined;
  }
}

export function NutritionFridgeLog() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [freezer, setFreezer] = useState<string | null>(null);
  const [main, setMain] = useState<string | null>(null);
  const [veggie, setVeggie] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FridgeSlot, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const slotsState = { freezer, main, veggie };

  const handleFile = (slot: FridgeSlot, file: File | undefined) => {
    setErrors((e) => ({ ...e, [slot]: undefined }));
    setSubmitError(null);
    const setter = slot === 'freezer' ? setFreezer : slot === 'main' ? setMain : setVeggie;
    if (!file) {
      setter(null);
      return;
    }
    const allowed = ALLOWED_TYPES.includes(file.type) || isHeicFile(file);
    if (!allowed) {
      setErrors((e) => ({ ...e, [slot]: 'Use JPEG, PNG, WebP, or HEIC (iPhone).' }));
      setter(null);
      return;
    }
    photoFileToDataUrl(file)
      .then((dataUrl) => {
        const bytes = getDataUrlDecodedBytes(dataUrl);
        if (bytes > MAX_PHOTO_BYTES) {
          setErrors((e) => ({ ...e, [slot]: `Max ${MAX_PHOTO_LABEL} per image.` }));
          setter(null);
          return;
        }
        setter(dataUrl);
      })
      .catch((err) => {
        setErrors((e) => ({ ...e, [slot]: err instanceof Error ? err.message : 'Could not load image. Try JPEG or PNG.' }));
        setter(null);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezer && !main && !veggie) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const buildPhoto = async (dataUrl: string | null): Promise<FridgePhoto | undefined> => {
        if (!dataUrl) return undefined;
        const photoUri = accessToken ? await uploadPhoto(dataUrl, accessToken) : undefined;
        return { dataUrl, photoUri };
      };
      const entry = {
        freezer: await buildPhoto(freezer),
        main: await buildPhoto(main),
        veggie: await buildPhoto(veggie),
        notes: notes.trim() || undefined,
      };
      addFridgeLog(entry);
      navigate('/dashboard/nutrition', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasAny = freezer || main || veggie;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/nutrition" className={styles.back}>
          ← Nutrition
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Log fridge photos</h1>
          <p className={styles.subtitle}>
            Add fridge photos and a note. Recipe ideas use your Pulse and your body signals and work routine so suggestions fit your energy, stress, and context.
          </p>
        </div>
        <RecoveryContextCard />
        <form onSubmit={handleSubmit}>
          <div className={styles.slotSection}>
            <div className={styles.slotLabel}>Note (optional)</div>
            <p className={styles.hint}>e.g. dietary needs, what you feel like cooking, or &quot;what can I make with this today?&quot; This and your Pulse factors are used for smarter recipe suggestions.</p>
            <textarea
              className={styles.notesInput}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSubmitError(null); }}
              placeholder="e.g. Need something quick and filling; low energy today"
              maxLength={500}
              rows={3}
              aria-label="Note for recipe suggestions"
            />
          </div>
          {SLOTS.map(({ key, label }) => (
            <div key={key} className={styles.slotSection}>
              <div className={styles.slotLabel}>{label}</div>
              <p className={styles.hint}>Optional. JPEG, PNG, WebP, or HEIC (iPhone).</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                className={styles.fileInput}
                aria-label={`Upload ${label} photo`}
                onChange={(e) => handleFile(key, e.target.files?.[0])}
              />
              {slotsState[key] && (
                <>
                  <div className={styles.photoPreview}>
                    <img src={slotsState[key]!} alt={label} className={styles.photoImg} />
                  </div>
                  <button
                    type="button"
                    className={styles.removePhoto}
                    onClick={() => (key === 'freezer' ? setFreezer(null) : key === 'main' ? setMain(null) : setVeggie(null))}
                  >
                    Remove photo
                  </button>
                </>
              )}
              {errors[key] && <p className={styles.photoError} role="alert">{errors[key]}</p>}
            </div>
          ))}
          {submitError && <p className={styles.photoError} role="alert">{submitError}</p>}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!hasAny || submitting}
          >
            {submitting ? 'Saving…' : 'Save fridge log'}
          </button>
        </form>
      </main>
    </div>
  );
}
