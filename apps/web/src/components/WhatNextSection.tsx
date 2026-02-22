import { Link } from 'react-router-dom';
import styles from './WhatNextSection.module.css';

export type WhatNextVariant = 'default' | 'nutrition';

type WhatNextSectionProps = {
  variant?: WhatNextVariant;
};

const DEFAULT_BODY =
  'Continue with other blocks on the main dashboard to get recommendations based on more of your data. With two blocks you get combined insights; with all three you get your full Pulse.';
const NUTRITION_BODY =
  'Continue with other blocks on the main dashboard, or add more nutrition data (meal timing, hydration, fridge). More blocks give combined recommendations and your full Pulse.';

export function WhatNextSection({ variant = 'default' }: WhatNextSectionProps) {
  const isNutrition = variant === 'nutrition';

  return (
    <section className={styles.section} aria-labelledby="what-next-heading">
      <h2 id="what-next-heading" className={styles.heading}>
        What next?
      </h2>
      <p className={styles.body}>{isNutrition ? NUTRITION_BODY : DEFAULT_BODY}</p>
      <div className={styles.actions}>
        <Link to="/dashboard" className={styles.primary}>
          Go to main dashboard
        </Link>
        {isNutrition && (
          <Link to="/dashboard/nutrition" className={styles.secondary}>
            Add more nutrition data
          </Link>
        )}
        {!isNutrition && (
          <Link to="/dashboard/pulse" className={styles.secondary}>
            View Pulse score
          </Link>
        )}
      </div>
    </section>
  );
}
