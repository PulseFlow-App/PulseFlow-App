import { Link } from 'react-router-dom';
import { RecoveryContextCard } from './RecoveryContextCard';
import { getNutritionPatternBlock, getWeeklyNutritionStability } from './patternInsights';
import styles from './Nutrition.module.css';

export function NutritionOverview() {
  const block = getNutritionPatternBlock();
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
            Regulation support through timing, hydration, and recovery. We use your body signals and work routine so suggestions match your energy, sleep, and context.
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

        <div className={styles.insightsCard} role="region" aria-labelledby="pattern-heading">
          <h2 id="pattern-heading" className={styles.insightsHeading}>
            {block.mode === 'no_data' ? "Today's insight" : "Today's nutrition pattern"}
          </h2>
          <p className={styles.patternText}>{block.pattern}</p>
          {block.influencing.length > 0 && (
            <>
              <h3 className={styles.influencingHeading}>What&apos;s influencing it</h3>
              <ul className={styles.insightsList}>
                {block.influencing.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          )}
          <p className={styles.oneAdjustment}>
            <strong>One smart adjustment:</strong> {block.oneAdjustment}
          </p>
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
        <Link to="/dashboard/nutrition/fridge" className={styles.buttonSecondary}>
          Log fridge photos
        </Link>
      </main>
    </div>
  );
}
