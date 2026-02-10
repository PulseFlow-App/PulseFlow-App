import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addBodyLog } from './store';
import styles from './BodySignals.module.css';

export function BodySignalsLog() {
  const navigate = useNavigate();
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [hydration, setHydration] = useState(3);
  const [stress, setStress] = useState(3);
  const [appetite, setAppetite] = useState<number | ''>(3);
  const [digestion, setDigestion] = useState<number | ''>(3);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBodyLog({
      sleepHours,
      sleepQuality,
      energy,
      mood,
      hydration,
      stress,
      appetite: appetite === '' ? undefined : (appetite as number),
      digestion: digestion === '' ? undefined : (digestion as number),
      weight: weight ? parseFloat(weight) : undefined,
      notes: notes.trim() || undefined,
    });
    navigate('/dashboard/body-signals/result', { replace: true });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/body-signals" className={styles.back}>
          ← Body Signals
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Log Data</h1>
          <p className={styles.subtitle}>One-tap submit</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Sleep (hours)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{sleepHours}h</span>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Sleep quality (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{sleepQuality}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Energy (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{energy}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Mood (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{mood}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Hydration (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{hydration}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={hydration}
                onChange={(e) => setHydration(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Stress (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{stress}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Appetite / hunger (1–5, optional)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{appetite === '' ? 'n/a' : appetite}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={appetite === '' ? 3 : appetite}
                onChange={(e) => setAppetite(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Digestion / comfort (1–5, optional)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{digestion === '' ? 'n/a' : digestion}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={digestion === '' ? 3 : digestion}
                onChange={(e) => setDigestion(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className={styles.input}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Notes (optional)</label>
            <textarea
              className={`${styles.input} ${styles.textArea}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Woke up super hungry, bloated after lunch, deadline stress"
              maxLength={500}
              rows={3}
            />
            <p className={styles.hint}>Notes are analyzed with your metrics to personalize suggestions.</p>
          </div>
          <button type="submit" className={styles.submitButton}>
            Submit
          </button>
        </form>
      </main>
    </div>
  );
}
