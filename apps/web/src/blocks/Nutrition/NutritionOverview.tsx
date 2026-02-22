import { Link } from 'react-router-dom';
import { PulseScoreCard } from '../../components/PulseScore';
import { hasMealTimingToday } from './mealTimingStore';
import { hasHydrationTimingToday } from './hydrationTimingStore';
import { hasReflectionsToday } from './postMealReflectionStore';
import { NutritionProgressChecklist } from './NutritionProgressChecklist';
import styles from './Nutrition.module.css';

const NUTRITION_BLOCK_SCORE_DEFAULT = 80;

export function NutritionOverview() {
  const mealDone = hasMealTimingToday();
  const hydrationDone = hasHydrationTimingToday();
  const reflectionsDone = hasReflectionsToday();
  const hasRequiredForScore = mealDone && hydrationDone && reflectionsDone;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back}>
          ← Dashboard
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Nutrition</h1>
          <p className={styles.subtitle}>
            Complete meal timing, hydration, and post-meal reflection to see your Nutrition Pulse. Meal photos and fridge are optional.
          </p>
        </div>
        <NutritionProgressChecklist />
        {hasRequiredForScore && (
          <div className={styles.card}>
            <div className={styles.scoreSection}>
              <PulseScoreCard
                variant="block-only"
                score={NUTRITION_BLOCK_SCORE_DEFAULT}
                label="Nutrition Pulse"
                blockKey="nutrition"
                compact
              />
            </div>
          </div>
        )}
        <Link to="/dashboard/nutrition/meal-timing" className={styles.button}>
          Meal timing
        </Link>
        <Link to="/dashboard/nutrition/hydration" className={styles.buttonSecondary}>
          Hydration timing
        </Link>
        <Link to="/dashboard/nutrition/reflections" className={styles.buttonSecondary}>
          Post-meal reflection
        </Link>
        <Link to="/dashboard/nutrition/meal-photo" className={styles.buttonSecondary}>
          Meal photo
        </Link>
        <Link to="/dashboard/nutrition/fridge" className={styles.buttonSecondary}>
          Log fridge photos
        </Link>
      </main>
    </div>
  );
}
