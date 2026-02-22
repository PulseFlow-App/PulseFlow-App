import { Link } from 'react-router-dom';
import { PulseScoreCard } from '../../components/PulseScore';
import { getAllTimeNutritionPulse } from '../../stores/combinedPulse';
import styles from './Nutrition.module.css';

const NUTRITION_BLOCK_SCORE_DEFAULT = 80;

export function NutritionOverview() {
  const pulse = getAllTimeNutritionPulse();

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
            {pulse.hasData
              ? 'Your nutrition data (pulse score coming soon)'
              : 'Log meal timing, hydration, and fridge to see your pulse'}
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <PulseScoreCard
              variant="block-only"
              score={pulse.hasData ? NUTRITION_BLOCK_SCORE_DEFAULT : 0}
              label={pulse.hasData ? 'Nutrition Pulse' : 'No data yet'}
              blockKey="nutrition"
              compact
            />
          </div>
        </div>
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
