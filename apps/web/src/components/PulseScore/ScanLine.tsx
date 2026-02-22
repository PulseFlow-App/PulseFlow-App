import styles from './PulseScore.module.css';

export function ScanLine() {
  return (
    <div className={styles.scanLineWrap} aria-hidden>
      <div className={styles.scanLine} />
    </div>
  );
}
