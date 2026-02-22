import { Link } from 'react-router-dom';
import { hasMealTimingToday } from './mealTimingStore';
import { hasHydrationTimingToday } from './hydrationTimingStore';
import { hasReflectionsToday } from './postMealReflectionStore';
import { hasMealPhotosToday } from './mealPhotoStore';
import { hasFridgePhotoToday } from './fridgePhotoStore';
import styles from './Nutrition.module.css';

/** Required = meal timing + hydration + post-meal reflection. Optional = meal photos, fridge. */
export function NutritionProgressChecklist() {
  const mealDone = hasMealTimingToday();
  const hydrationDone = hasHydrationTimingToday();
  const reflectionsDone = hasReflectionsToday();
  const mealPhotosDone = hasMealPhotosToday();
  const fridgeDone = hasFridgePhotoToday();

  return (
    <section className={styles.progressCard} role="region" aria-labelledby="nutrition-progress-heading">
      <h2 id="nutrition-progress-heading" className={styles.progressHeading}>
        Nutrition block
      </h2>
      <ul className={styles.progressList}>
        <li className={styles.progressItem}>
          {mealDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Meal timing <span className={styles.progressRequired}>(required)</span></span>
          {mealDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/meal-timing" className={styles.progressLink}>Log now</Link>}
        </li>
        <li className={styles.progressItem}>
          {hydrationDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Hydration timing <span className={styles.progressRequired}>(required)</span></span>
          {hydrationDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/hydration" className={styles.progressLink}>Log now</Link>}
        </li>
        <li className={styles.progressItem}>
          {reflectionsDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Post-meal reflections <span className={styles.progressRequired}>(required)</span></span>
          {reflectionsDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/reflections" className={styles.progressLink}>Log now</Link>}
        </li>
        <li className={styles.progressItem}>
          {mealPhotosDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Meal photos <span className={styles.progressOptional}>(optional)</span></span>
          {mealPhotosDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/meal-photo" className={styles.progressLinkOptional}>Add</Link>}
        </li>
        <li className={styles.progressItem}>
          {fridgeDone ? <span className={styles.progressDone} aria-hidden>✓</span> : <span className={styles.progressDot} aria-hidden>○</span>}
          <span>Fridge photos <span className={styles.progressOptional}>(optional)</span></span>
          {fridgeDone ? <span className={styles.progressLabel}>Done</span> : <Link to="/dashboard/nutrition/fridge-photo" className={styles.progressLinkOptional}>Add</Link>}
        </li>
      </ul>
    </section>
  );
}
