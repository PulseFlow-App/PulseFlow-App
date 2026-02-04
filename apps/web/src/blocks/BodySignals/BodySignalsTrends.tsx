import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart } from '../../components/LineChart';
import { getLogsForRange } from './store';
import type { TrendMetric } from './types';
import styles from './BodySignals.module.css';

const RANGES = [7, 30] as const;
const METRICS: { key: TrendMetric; label: string }[] = [
  { key: 'sleep', label: 'Sleep' },
  { key: 'energy', label: 'Energy' },
  { key: 'mood', label: 'Mood' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'stress', label: 'Stress' },
  { key: 'appetite', label: 'Appetite' },
  { key: 'digestion', label: 'Digestion' },
  { key: 'weight', label: 'Weight' },
];

export function BodySignalsTrends() {
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [metric, setMetric] = useState<TrendMetric>('sleep');

  const logs = useMemo(() => getLogsForRange(rangeDays), [rangeDays]);
  const chartData = useMemo(() => {
    const out: { x: number; y: number; label?: string }[] = [];
    for (const l of logs) {
      let y: number | undefined;
      if (metric === 'weight') y = l.weight;
      else if (metric === 'sleep') y = l.sleepHours;
      else if (metric === 'energy') y = l.energy;
      else if (metric === 'mood') y = l.mood;
      else if (metric === 'hydration') y = l.hydration;
      else if (metric === 'stress') y = l.stress;
      else if (metric === 'appetite') y = l.appetite;
      else if (metric === 'digestion') y = l.digestion;
      if (y != null) out.push({ x: 0, y, label: l.date.slice(5) });
    }
    return out;
  }, [logs, metric]);

  const is1to5 =
    metric === 'energy' ||
    metric === 'mood' ||
    metric === 'hydration' ||
    metric === 'stress' ||
    metric === 'appetite' ||
    metric === 'digestion';
  const correlationHint =
    logs.length >= 2 && metric === 'energy'
      ? 'Low sleep → low energy'
      : metric === 'stress'
        ? 'High stress can affect sleep and mood'
        : metric === 'sleep'
          ? 'Aim for 7–9 hours'
          : '';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/body-signals" className={styles.back}>
          ← Body Signals
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Trends</h1>
          <p className={styles.subtitle}>Body Signals over time</p>
        </div>
        <div className={styles.rangeRow}>
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              className={rangeDays === d ? styles.rangeChipActive : styles.rangeChip}
              onClick={() => setRangeDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className={styles.metricRow}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={metric === m.key ? styles.metricChipActive : styles.metricChip}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className={styles.chartCard}>
          <LineChart
            data={chartData}
            yMin={is1to5 ? 1 : undefined}
            yMax={is1to5 ? 5 : undefined}
          />
        </div>
        {correlationHint && <p className={styles.correlationHint}>{correlationHint}</p>}
        <Link to="/dashboard/body-signals/log" className={styles.button}>
          Log Data
        </Link>
      </main>
    </div>
  );
}
