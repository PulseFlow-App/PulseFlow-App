/**
 * Today's context from Body + Work Routine. Shown on Nutrition overview and fridge/recipe flow.
 */
import { getRecoverySituation } from './recoverySituation';
import type { RecoverySituation } from './types';
import styles from './Nutrition.module.css';

const LABELS: Record<RecoverySituation, string> = {
  gym_day: "Today: gym / workout",
  party_night: "Tonight: party / going out",
  travel_day: "Today: travel",
  deadline_day: "Today: deadline / big day",
  poor_sleep_night: "Recovery: poor sleep last night",
  normal: "Today: normal",
};

const TIPS: Record<RecoverySituation, string> = {
  gym_day: "Consider a recovery-focused meal: protein + carbs + hydration.",
  party_night: "Light meal before, hydrate during and after. Tomorrow: gentle digestion.",
  travel_day: "Stay hydrated; easy meals and snacks help energy on the go.",
  deadline_day: "Steady energy: regular small meals and hydration beat a single big one.",
  poor_sleep_night: "Lighter meals and earlier dinner may help tonight’s sleep.",
  normal: "Your usual rhythm. Meal timing and hydration keep things steady.",
};

export function RecoveryContextCard() {
  const situation = getRecoverySituation();
  const label = LABELS[situation];
  const tip = TIPS[situation];

  return (
    <div className={styles.recoveryCard} role="region" aria-labelledby="recovery-context-heading">
      <h2 id="recovery-context-heading" className={styles.recoveryHeading}>
        Today’s context
      </h2>
      <p className={styles.recoveryLabel}>{label}</p>
      <p className={styles.recoveryTip}>{tip}</p>
    </div>
  );
}
