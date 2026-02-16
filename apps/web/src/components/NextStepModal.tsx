import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './NextStepModal.module.css';

export type NextStepModalVariant = 'default' | 'nutrition';

type NextStepModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** When true, "Submit more" / "Go to main" just closes the modal (caller is already on dashboard). */
  onDashboard?: boolean;
  variant?: NextStepModalVariant;
};

const DEFAULT_TITLE = 'What next?';
const DEFAULT_BODY =
  'You can view your Pulse score now, or add more blocks (Work Routine, Nutrition, etc.) to get a stronger signal. The more you log, the better your Pulse.';

const NUTRITION_TITLE = 'What next?';
const NUTRITION_BODY =
  'You can complete your nutrition check-in (meal timing, hydration, fridge, reflections) for a better signal, or go to the main dashboard.';

export function NextStepModal({ isOpen, onClose, onDashboard, variant = 'default' }: NextStepModalProps) {
  const navigate = useNavigate();
  const isNutrition = variant === 'nutrition';

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSecondary = () => {
    onClose();
    if (!onDashboard) navigate('/dashboard');
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="next-step-title">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.content}>
        <h2 id="next-step-title" className={styles.title}>
          {isNutrition ? NUTRITION_TITLE : DEFAULT_TITLE}
        </h2>
        <p className={styles.body}>{isNutrition ? NUTRITION_BODY : DEFAULT_BODY}</p>
        <div className={styles.actions}>
          {isNutrition ? (
            <>
              <Link to="/dashboard/nutrition" className={styles.primary} onClick={onClose}>
                Complete nutrition check-in
              </Link>
              <button type="button" className={styles.secondary} onClick={handleSecondary}>
                Go to main
              </button>
            </>
          ) : (
            <>
              <Link to="/dashboard/pulse" className={styles.primary} onClick={onClose}>
                View Pulse score
              </Link>
              <button type="button" className={styles.secondary} onClick={handleSecondary}>
                Submit more blocks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
