import { Link } from 'react-router-dom';
import { RecoveryContextCard } from './RecoveryContextCard';
import { getNutritionPatternInsights, getWeeklyNutritionStability } from './patternInsights';
import styles from './Nutrition.module.css';

export function NutritionOverview() {
  const insights = getNutritionPatternInsights();
  const stability = getWeeklyNutritionStability();

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
            Meal timing, hydration, and fridge photos connect to your Pulse (body signals and work routine) so suggestions match your energy, sleep, and context.
          </p>
        </div>

        <RecoveryContextCard />

        <div className={styles.stabilityCard} role="region" aria-labelledby="stability-heading">
          <h2 id="stability-heading" className={styles.stabilityHeading}>
            This week
          </h2>
          <p className={styles.stabilityText}>
            {stability.daysLogged} day{stability.daysLogged !== 1 ? 's' : ''} logged (meal or hydration). {stability.label}
          </p>
        </div>

        {insights.length > 0 && (
          <div className={styles.insightsCard} role="region" aria-labelledby="insights-heading">
            <h2 id="insights-heading" className={styles.insightsHeading}>
              Pattern insights
            </h2>
            <ul className={styles.insightsList}>
              {insights.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
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
        <Link to="/dashboard/nutrition/fridge" className={styles.buttonSecondary}>
          Log fridge photos
        </Link>
      </main>
    </div>
  );
}
