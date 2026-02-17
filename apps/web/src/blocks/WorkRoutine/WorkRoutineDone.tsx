import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NextStepModal } from '../../components/NextStepModal';
import styles from './WorkRoutine.module.css';

export function WorkRoutineDone() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowModal(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/work-routine" className={styles.back}>
          ← Work Routine
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Check-in saved</h1>
          <p className={styles.subtitle}>
            Your work day is logged. See your Pulse score or add more blocks (Body Signals, Nutrition) for a stronger signal.
          </p>
        </div>
      </main>
      <NextStepModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDashboard={false}
      />
    </div>
  );
}
