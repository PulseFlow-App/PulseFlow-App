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
          <h1 className={styles.title}>Meal timing</h1>
          <p className={styles.subtitle}>
            First and last meal, biggest meal, and late-night eating. Connects to sleep and energy.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.slotSection}>
            <label className={styles.slotLabel} htmlFor="first-meal">
              First meal (time)
            </label>
            <input
              id="first-meal"
              type="time"
              className={styles.timeInput}
              value={firstMealTime}
              onChange={(e) => setFirstMealTime(e.target.value)}
              aria-label="Time of first meal"
            />
          </div>
          <div className={styles.slotSection}>
            <label className={styles.slotLabel} htmlFor="last-meal">
              Last meal (time)
            </label>
            <input
              id="last-meal"
              type="time"
              className={styles.timeInput}
              value={lastMealTime}
              onChange={(e) => setLastMealTime(e.target.value)}
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
