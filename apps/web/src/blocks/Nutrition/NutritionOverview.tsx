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
            Log fridge photos (freezer, main, veggie) and ask what to cook today. Recipe ideas use your Pulse — body signals and work routine — so suggestions match your nutrition needs, energy, and context.
          </p>
        </div>
        <Link to="/dashboard/nutrition/fridge" className={styles.button}>
          Log fridge photos
        </Link>
      </main>
    </div>
  );
}
