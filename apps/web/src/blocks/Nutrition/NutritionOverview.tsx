import { Link } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useHasWallet } from '../../contexts/WalletContext';
import { RecoveryContextCard } from './RecoveryContextCard';
import styles from './Nutrition.module.css';

export function NutritionOverview() {
  const { hasActiveSubscription } = useSubscription();
  const hasWallet = useHasWallet();

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

        {!hasActiveSubscription && (
          <div className={styles.stabilityCard} role="region" aria-labelledby="nutrition-tier-cta-heading">
            <h2 id="nutrition-tier-cta-heading" className={styles.stabilityHeading}>Get more</h2>
            <p className={styles.stabilityText}>
              <strong>Upgrade to Premium</strong> for advanced nutrition levers (a second lever when we have enough context).
              {!hasWallet && ' Connect your wallet for recipe ideas from fridge photos and on-chain rewards.'}
            </p>
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
