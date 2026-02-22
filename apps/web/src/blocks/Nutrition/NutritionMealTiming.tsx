import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMealTimingForDate, setMealTimingForDate } from './mealTimingStore';
import type { BiggestMeal } from './types';
import styles from './Nutrition.module.css';

const BIGGEST_MEAL_OPTIONS: { value: BiggestMeal; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Bounded time picker: hours 0-23, minutes 0-59 (no infinite scroll). */
function TimeSelect({
  id,
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  'aria-label'?: string;
}) {
  const [h, m] = value
    ? value.split(':').map((s) => parseInt(s, 10))
    : [null, null];
  const hour = h != null && h >= 0 && h <= 23 ? h : 0;
  const minute = m != null && m >= 0 && m <= 59 ? m : 0;

  const setHour = (newH: number) => {
    onChange(`${String(newH).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };
  const setMinute = (newM: number) => {
    onChange(`${String(hour).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  return (
    <div className={styles.timeSelectRow} aria-label={ariaLabel}>
      <select
        id={`${id}-hour`}
        className={styles.timeSelect}
        value={hour}
        onChange={(e) => setHour(Number(e.target.value))}
        aria-label={ariaLabel ? `${ariaLabel} hour` : undefined}
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>
            {String(i).padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className={styles.timeSelectSep}>:</span>
      <select
        id={`${id}-minute`}
        className={styles.timeSelect}
        value={minute}
        onChange={(e) => setMinute(Number(e.target.value))}
        aria-label={ariaLabel ? `${ariaLabel} minute` : undefined}
      >
        {Array.from({ length: 60 }, (_, i) => (
          <option key={i} value={i}>
            {String(i).padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  );
}

export function NutritionMealTiming() {
  const navigate = useNavigate();
  const date = todayStr();
  const existing = getMealTimingForDate(date);

  const [firstMealTime, setFirstMealTime] = useState(existing?.firstMealTime ?? '');
  const [lastMealTime, setLastMealTime] = useState(existing?.lastMealTime ?? '');
  const [biggestMeal, setBiggestMeal] = useState<BiggestMeal | ''>(existing?.biggestMeal ?? '');
  const [lateNightEating, setLateNightEating] = useState<boolean>(existing?.lateNightEating ?? false);
  const [proteinAtBreakfast, setProteinAtBreakfast] = useState<boolean>(existing?.proteinAtBreakfast ?? false);
  const [proteinAtLastMeal, setProteinAtLastMeal] = useState<boolean>(existing?.proteinAtLastMeal ?? false);

  useEffect(() => {
    if (existing) {
      setFirstMealTime(existing.firstMealTime ?? '');
      setLastMealTime(existing.lastMealTime ?? '');
      setBiggestMeal(existing.biggestMeal ?? '');
      setLateNightEating(existing.lateNightEating ?? false);
      setProteinAtBreakfast(existing.proteinAtBreakfast ?? false);
      setProteinAtLastMeal(existing.proteinAtLastMeal ?? false);
    }
  }, [existing?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMealTimingForDate(date, {
      firstMealTime: firstMealTime.trim() || undefined,
      lastMealTime: lastMealTime.trim() || undefined,
      biggestMeal: biggestMeal || undefined,
      lateNightEating,
      proteinAtBreakfast,
      proteinAtLastMeal,
    });
    navigate('/dashboard/nutrition/result', { replace: true, state: { from: 'meal-timing' } });
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
          <h1 className={styles.title}>Meal timing</h1>
          <p className={styles.subtitle}>
            First and last meal, biggest meal, and late-night eating. Connects to sleep and energy.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.slotSection}>
            <label className={styles.slotLabel} id="first-meal-label">
              First meal (time)
            </label>
            <TimeSelect
              id="first-meal"
              value={firstMealTime || '08:00'}
              onChange={(v) => setFirstMealTime(v)}
              aria-label="Time of first meal"
            />
          </div>
          <div className={styles.slotSection}>
            <label className={styles.slotLabel} id="last-meal-label">
              Last meal (time)
            </label>
            <TimeSelect
              id="last-meal"
              value={lastMealTime || '19:00'}
              onChange={(v) => setLastMealTime(v)}
              aria-label="Time of last meal"
            />
          </div>
          <div className={styles.slotSection}>
            <span className={styles.slotLabel}>Biggest meal</span>
            <div className={styles.optionRow}>
              {BIGGEST_MEAL_OPTIONS.map((opt) => (
                <label key={opt.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="biggestMeal"
                    value={opt.value}
                    checked={biggestMeal === opt.value}
                    onChange={() => setBiggestMeal(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.slotSection}>
            <span className={styles.slotLabel}>Protein (simple yes/no)</span>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={proteinAtBreakfast}
                onChange={(e) => setProteinAtBreakfast(e.target.checked)}
              />
              <span>Protein at breakfast</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={proteinAtLastMeal}
                onChange={(e) => setProteinAtLastMeal(e.target.checked)}
              />
              <span>Protein at last meal</span>
            </label>
          </div>
          <div className={styles.slotSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={lateNightEating}
                onChange={(e) => setLateNightEating(e.target.checked)}
              />
              <span>Late-night eating (after ~9-10pm)</span>
            </label>
          </div>
          <button type="submit" className={styles.submitButton}>
            Save
          </button>
        </form>
      </main>
    </div>
  );
}
