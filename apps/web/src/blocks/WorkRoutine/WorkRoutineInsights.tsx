import { Link } from 'react-router-dom';
import { getLatestCheckIn, getCheckIns } from './store';
import styles from './WorkRoutine.module.css';

export function WorkRoutineInsights() {
  const latest = getLatestCheckIn();
  const all = getCheckIns();

  if (all.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <Link to="/dashboard/work-routine" className={styles.back}>
            ← Work Routine
          </Link>
        </header>
        <div id="main" className={styles.empty}>
          <h2 className={styles.emptyTitle}>No insights yet</h2>
          <p className={styles.emptyText}>
            Complete a check-in to see your pattern and one thing to try.
          </p>
          <Link to="/dashboard/work-routine/checkin" className={styles.emptyLink}>
            Start Check-in →
          </Link>
        </div>
      </div>
    );
  }

  const useNarrative = latest?.analysis.pattern != null && latest.analysis.shaping != null && latest.analysis.oneThing != null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/work-routine" className={styles.back}>
          ← Work Routine
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Latest insight</h1>
          {latest && (
            <p className={styles.date}>
              {new Date(latest.timestamp).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
        {latest && useNarrative ? (
          <div className={styles.narrativeCard}>
            <section className={styles.narrativeSection} aria-labelledby="wr-pattern-heading">
              <h2 id="wr-pattern-heading" className={styles.narrativeHeading}>Today&apos;s work pattern</h2>
              <p className={styles.narrativeText}>{latest.analysis.pattern}</p>
            </section>
            <section className={styles.narrativeSection} aria-labelledby="wr-shaping-heading">
              <h2 id="wr-shaping-heading" className={styles.narrativeHeading}>What&apos;s shaping this</h2>
              <p className={styles.narrativeShaping}>{latest.analysis.shaping}</p>
            </section>
            <section className={styles.narrativeSection} aria-labelledby="wr-onething-heading">
              <h2 id="wr-onething-heading" className={styles.narrativeHeading}>One thing to observe</h2>
              <p className={styles.narrativeText}>{latest.analysis.oneThing}</p>
            </section>
          </div>
        ) : latest ? (
          <>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Assessment</p>
              <p className={styles.cardText}>{latest.analysis.assessment}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Quick wins</p>
              {latest.analysis.quickWins.map((win, i) => (
                <p key={i} className={styles.bullet}>
                  • {win}
                </p>
              ))}
            </div>
          </>
        ) : null}
        <p className={styles.hint}>Complete more check-ins to see patterns over time.</p>
      </main>
    </div>
  );
}
