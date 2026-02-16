import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHydrationTimingForDate, setHydrationTimingForDate } from './hydrationTimingStore';
import type { HydrationContext } from './types';
import styles from './Nutrition.module.css';

const HYDRATION_OPTIONS: { value: HydrationContext; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'before_coffee', label: 'Before coffee' },
  { value: 'during_work', label: 'During work' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'around_workout', label: 'Around workout' },
  { value: 'evening', label: 'Evening' },
  { value: 'after_alcohol', label: 'After alcohol' },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NutritionHydrationTiming() {
  const navigate = useNavigate();
  const date = todayStr();
  const existing = getHydrationTimingForDate(date);

  const [when, setWhen] = useState<HydrationContext[]>(existing?.when ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    if (existing) {
      setWhen(existing.when);
      setNotes(existing.notes ?? '');
    }
  }, [existing?.id]);

  const toggle = (ctx: HydrationContext) => {
    setWhen((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHydrationTimingForDate(date, { when, notes: notes.trim() || undefined });
    navigate('/dashboard', { replace: true });
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
          <h1 className={styles.title}>Hydration timing</h1>
          <p className={styles.subtitle}>
            When do you hydrate? Connects to energy and busy days.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.slotSection}>
            <span className={styles.slotLabel}>When do you drink water? (select all that apply)</span>
            <div className={styles.checkboxGroup}>
              {HYDRATION_OPTIONS.map((opt) => (
                <label key={opt.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={when.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.slotSection}>
            <label className={styles.slotLabel} htmlFor="hydration-notes">
              Notes (optional)
            </label>
            <input
              id="hydration-notes"
              type="text"
              className={styles.textInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. forgot until afternoon"
              maxLength={200}
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Save
          </button>
        </form>
      </main>
    </div>
  );
}
