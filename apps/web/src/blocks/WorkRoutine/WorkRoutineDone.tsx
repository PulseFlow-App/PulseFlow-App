import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { WhatNextSection } from '../../components/WhatNextSection';
import { getBodyLogs } from '../BodySignals/store';
import { getLatestCheckIn, getTodayRoutineScore, updateLatestCheckInAnalysis } from './store';
import type { CheckInAnalysis } from './types';
import styles from './WorkRoutine.module.css';

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

function getTodayBodyEntry(): Record<string, unknown> | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const logs = getBodyLogs();
  const entry = logs.find((l) => l.date === today);
  if (!entry) return undefined;
  return {
    date: entry.date,
    sleepHours: entry.sleepHours,
    sleepQuality: entry.sleepQuality,
    energy: entry.energy,
    mood: entry.mood,
    hydration: entry.hydration,
    stress: entry.stress,
    appetite: entry.appetite,
    digestion: entry.digestion,
    notes: entry.notes,
  };
}

export function WorkRoutineDone() {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<CheckInAnalysis | null | undefined>(undefined);

  const latest = getLatestCheckIn();
  const isToday = latest && latest.timestamp.slice(0, 10) === new Date().toISOString().slice(0, 10);
  const score = getTodayRoutineScore();

  useEffect(() => {
    if (!API_BASE || !latest || !isToday || !latest.metrics) return;
    setLoadingAI(true);
    setAiAnalysis(undefined);
    const work = latest.metrics;
    const bodyEntry = getTodayBodyEntry();
    fetch(`${API_BASE}/insights/work-routine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work, body_entry: bodyEntry }),
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && typeof data.pattern === 'string') {
          const analysis: CheckInAnalysis = {
            assessment: '',
            quickWins: [],
            pattern: data.pattern.trim(),
            shaping: typeof data.shaping === 'string' ? data.shaping.trim() : '',
            oneThing: typeof data.oneThing === 'string' ? data.oneThing.trim() : '',
            aggregation_handoff: data.aggregation_handoff && typeof data.aggregation_handoff === 'object' ? data.aggregation_handoff : undefined,
          };
          updateLatestCheckInAnalysis(analysis);
          setAiAnalysis(analysis);
        } else {
          updateLatestCheckInAnalysis(null);
          setAiAnalysis(null);
        }
      })
      .catch(() => {
        updateLatestCheckInAnalysis(null);
        setAiAnalysis(null);
      })
      .finally(() => setLoadingAI(false));
  }, [API_BASE, isToday, latest?.id]);

  /* When API returns null (fail or no data), fall back to stored rule-based analysis so user always sees recommendations. */
  const analysis =
    aiAnalysis !== undefined && aiAnalysis !== null
      ? aiAnalysis
      : isToday
        ? latest?.analysis
        : null;
  const pattern = analysis?.pattern ?? '';
  const shaping = analysis?.shaping ?? '';
  const oneThing = analysis?.oneThing ?? '';

  const shapingBullets = shaping
    ? shaping
        .split(/\n+/)
        .map((s) => s.replace(/^[•\-\s]+/, '').trim())
        .filter(Boolean)
    : [];

  const showInsightBlock = analysis && (pattern || shapingBullets.length > 0 || oneThing);

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <Link to="/dashboard/work-routine" className={styles.back}>
          ← Work Routine
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Check-in saved</h1>
          <p className={styles.subtitle}>
            Here’s your result from this block: your Work Pulse and recommendations below. Then add other blocks on the main dashboard for combined insights.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <ScoreRing
              score={score ?? 0}
              label={score !== null ? 'Your Work Pulse' : 'No data yet'}
            />
          </div>
          {loadingAI ? (
            <p className={styles.aiLoading}>Getting your pattern…</p>
          ) : showInsightBlock ? (
              <>
                {pattern && (
                  <section className={styles.narrativeSection} aria-labelledby="work-pattern-heading">
                    <h2 id="work-pattern-heading" className={styles.narrativeHeading}>Today’s pattern</h2>
                    <p className={styles.narrativeText}>{pattern}</p>
                  </section>
                )}
                {shapingBullets.length > 0 && (
                  <section className={styles.narrativeSection} aria-labelledby="work-shaping-heading">
                    <h2 id="work-shaping-heading" className={styles.narrativeHeading}>What’s shaping your work signals</h2>
                    <ul className={styles.shapingList}>
                      {shapingBullets.map((line, i) => (
                        <li key={i} className={styles.shapingItem}>{line}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {oneThing && (
                  <section className={styles.narrativeSection} aria-labelledby="work-one-heading">
                    <h2 id="work-one-heading" className={styles.narrativeHeading}>One thing to try</h2>
                    <p className={styles.narrativeText}>{oneThing}</p>
                  </section>
                )}
              </>
            ) : (
              <p className={styles.narrativeText}>Your check-in is saved. Add Body Signals or Nutrition on the main dashboard to get combined recommendations.</p>
            )}
        </div>

        <WhatNextSection />
      </main>
    </div>
  );
}
