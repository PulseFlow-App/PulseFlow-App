import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart } from '../../components/LineChart';
import { getCheckInsForRange } from './store';
import type { CheckInEntry, WorkDayMetrics } from './types';
import styles from './WorkRoutine.module.css';

const RANGES = [7, 30] as const;

type MetricKey = keyof Pick<
  WorkDayMetrics,
  'workHours' | 'focusSessions' | 'breaks' | 'deskComfort' | 'distractions' | 'interruptions' | 'energyStart' | 'energyEnd' | 'taskCompletion'
>;

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'workHours', label: 'Work hours' },
  { key: 'focusSessions', label: 'Focus sessions' },
  { key: 'breaks', label: 'Breaks' },
  { key: 'energyStart', label: 'Energy (start)' },
  { key: 'energyEnd', label: 'Energy (end)' },
  { key: 'taskCompletion', label: 'Task completion' },
  { key: 'deskComfort', label: 'Desk comfort' },
  { key: 'distractions', label: 'Distractions' },
  { key: 'interruptions', label: 'Interruptions' },
];

function getMetricValue(entry: CheckInEntry, key: MetricKey): number | undefined {
  const m = entry.metrics;
  if (!m) return undefined;
  const v = m[key];
  return typeof v === 'number' ? v : undefined;
}

export function WorkRoutineTrends() {
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [metric, setMetric] = useState<MetricKey>('workHours');

  const checkIns = useMemo(() => getCheckInsForRange(rangeDays), [rangeDays]);
  const chartData = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const c of checkIns) {
      const y = getMetricValue(c, metric);
      if (y != null) {
        const dateStr = c.timestamp.slice(0, 10);
        if (!byDate.has(dateStr)) byDate.set(dateStr, y);
      }
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, y]) => ({ x: 0, y, label: dateStr.slice(5) }));
  }, [checkIns, metric]);

  const is1to5 =
    metric === 'energyStart' ||
    metric === 'energyEnd' ||
    metric === 'taskCompletion' ||
    metric === 'deskComfort' ||
    metric === 'distractions' ||
    metric === 'interruptions';

  const count7 = getCheckInsForRange(7).length;
  const count30 = getCheckInsForRange(30).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/work-routine" className={styles.back}>
          ← Work Routine
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Trends</h1>
          <p className={styles.subtitle}>Work Routine over time</p>
        </div>

        <div className={styles.statsRow}>
          <span className={styles.statLabel}>{count7} check-in{count7 !== 1 ? 's' : ''} in last 7 days</span>
          <span className={styles.statLabel}>{count30} in last 30 days</span>
        </div>
        <p className={styles.hint} style={{ marginTop: '0.25rem', marginBottom: 0 }}>
          Check-ins sync across devices when you're signed in.
        </p>

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
            color="#3b82f6"
          />
        </div>
        <Link to="/dashboard/work-routine/checkin" className={styles.button}>
          Log Data
        </Link>
      </main>
    </div>
  );
}
