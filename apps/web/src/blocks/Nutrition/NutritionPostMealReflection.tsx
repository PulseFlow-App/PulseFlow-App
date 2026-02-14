import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getPostMealReflections,
  addPostMealReflection,
} from './postMealReflectionStore';
import type { PostMealFeeling } from './types';
import styles from './Nutrition.module.css';

const FEELING_OPTIONS: { value: PostMealFeeling; label: string }[] = [
  { value: 'energized', label: 'Energized' },
  { value: 'focused', label: 'Focused' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'sleepy', label: 'Sleepy' },
  { value: 'bloated', label: 'Bloated' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

function feelingLabel(f: PostMealFeeling): string {
  return FEELING_OPTIONS.find((o) => o.value === f)?.label ?? f;
}

export function NutritionPostMealReflection() {
  const [reflectionsKey, setReflectionsKey] = useState(0);
  const reflections = useMemo(
    () => getPostMealReflections(),
    [reflectionsKey]
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<PostMealFeeling>('energized');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addPostMealReflection({ date: todayStr, feeling, notes });
    setNotes('');
    setReflectionsKey((k) => k + 1);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/nutrition" className={styles.back}>
          ← Nutrition
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Post-meal reflection</h1>
          <p className={styles.subtitle}>
            How did you feel 60–90 min after eating? Over time this reveals what works for you.
          </p>
        </div>

        <section className={styles.reflectionPrompt} aria-labelledby="add-reflection-heading">
          <h2 id="add-reflection-heading" className={styles.sectionHeading}>
            Add reflection
          </h2>
          <form onSubmit={handleAdd} className={styles.reflectionForm}>
            <label className={styles.slotLabel} htmlFor="feeling-select">
              How did you feel after eating?
            </label>
            <select
              id="feeling-select"
              className={styles.select}
              value={feeling}
              onChange={(e) => setFeeling(e.target.value as PostMealFeeling)}
              aria-label="Feeling after meal"
            >
              {FEELING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className={styles.slotLabel} htmlFor="reflection-notes">
              Notes (optional)
            </label>
            <input
              id="reflection-notes"
              type="text"
              className={styles.textInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. big lunch, had coffee after"
              maxLength={200}
            />
            <button type="submit" className={styles.submitButton}>
              {submitted ? 'Saved' : 'Save reflection'}
            </button>
          </form>
        </section>

        <section className={styles.reflectionList} aria-labelledby="reflections-heading">
          <h2 id="reflections-heading" className={styles.sectionHeading}>
            Recent reflections
          </h2>
          {reflections.length === 0 ? (
            <p className={styles.emptyList}>No reflections yet. Add one above.</p>
          ) : (
            <ul className={styles.list}>
              {reflections.slice(0, 20).map((r) => (
                <li key={r.id} className={styles.listItem}>
                  <button
                    type="button"
                    className={styles.listItemButton}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    aria-expanded={expandedId === r.id}
                  >
                    <span className={styles.listItemDate}>{formatDate(r.date)}</span>
                    <span className={styles.listItemFeeling}>{feelingLabel(r.feeling)}</span>
                  </button>
                  {expandedId === r.id && (
                    <div className={styles.listItemDetail}>
                      <p><strong>Feeling:</strong> {feelingLabel(r.feeling)}</p>
                      {r.notes && <p><strong>Note:</strong> {r.notes}</p>}
                      <p className={styles.listItemMeta}>
                        {new Date(r.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
