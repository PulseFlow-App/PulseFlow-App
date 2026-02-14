import { Link } from 'react-router-dom';
import styles from './Nutrition.module.css';

export function NutritionOverview() {
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
            Log fridge photos (freezer, main, veggie) for recipe ideas. Best result with all three.
          </p>
        </div>
        <Link to="/dashboard/nutrition/fridge" className={styles.button}>
          Log fridge photos
        </Link>
      </main>
    </div>
  );
}
