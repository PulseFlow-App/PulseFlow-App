import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addWorkDayCheckIn } from './store';
import type { WorkDayMetrics, WorkspaceType, MeetingLoad } from './types';
import styles from './WorkRoutine.module.css';

const WORKSPACE_OPTIONS: { value: WorkspaceType; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'office', label: 'Office' },
  { value: 'cafe', label: 'Cafe / co-working' },
  { value: 'other', label: 'Other' },
];

const MEETING_OPTIONS: { value: MeetingLoad; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'few', label: 'Few' },
  { value: 'many', label: 'Many' },
];

const PHOTO_CAPTIONS = ['Calendar', 'Desk setup', 'Workspace', 'Other'] as const;

const MAX_PHOTO_BASE64_BYTES = 280_000; // ~210KB raw → ~280K base64

export function WorkRoutineCheckIn() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workHours, setWorkHours] = useState(8);
  const [focusSessions, setFocusSessions] = useState(3);
  const [breaks, setBreaks] = useState(3);
  const [workspace, setWorkspace] = useState<WorkspaceType>('home');
  const [deskComfort, setDeskComfort] = useState(3);
  const [distractions, setDistractions] = useState(2);
  const [interruptions, setInterruptions] = useState(2);
  const [energyStart, setEnergyStart] = useState(3);
  const [energyEnd, setEnergyEnd] = useState(3);
  const [taskCompletion, setTaskCompletion] = useState(3);
  const [meetingLoad, setMeetingLoad] = useState<MeetingLoad>('few');
  const [screenHours, setScreenHours] = useState<number | ''>(8);
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(null);
      return;
    }
    // Only allow safe raster image types (no SVG/HTML to prevent XSS or phishing file uploads)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
      const bytes = Math.ceil((base64Length * 3) / 4);
      if (bytes > MAX_PHOTO_BASE64_BYTES) {
        setPhotoError('Image too large. Use a smaller image (e.g. under 200 KB).');
        setPhotoDataUrl(null);
        return;
      }
      setPhotoDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metrics: WorkDayMetrics = {
      workHours,
      focusSessions,
      breaks,
      workspace,
      deskComfort,
      distractions,
      interruptions,
      energyStart,
      energyEnd,
      taskCompletion,
      meetingLoad,
      screenHours: screenHours === '' ? undefined : screenHours,
      notes: notes.trim() || undefined,
      photo:
        photoDataUrl ?
          { dataUrl: photoDataUrl, caption: photoCaption.trim() || undefined }
        : undefined,
    };
    addWorkDayCheckIn(metrics);
    navigate('/dashboard/pulse?from=work-routine', { replace: true });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/work-routine" className={styles.back}>
          ← Work Routine
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Log work day</h1>
          <p className={styles.subtitle}>Sliders and one submit</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Work hours today</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{workHours}h</span>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={14}
                step={0.5}
                value={workHours}
                onChange={(e) => setWorkHours(parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Focus sessions (deep work blocks)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{focusSessions}</span>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={8}
                step={1}
                value={focusSessions}
                onChange={(e) => setFocusSessions(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Breaks (1 = few, 5 = many)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{breaks}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={breaks}
                onChange={(e) => setBreaks(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Workspace</label>
            <div className={styles.chipRow}>
              {WORKSPACE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.chip} ${workspace === opt.value ? styles.chipActive : ''}`}
                  onClick={() => setWorkspace(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Desk / space comfort (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{deskComfort}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={deskComfort}
                onChange={(e) => setDeskComfort(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Distractions (1 = low, 5 = high)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{distractions}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={distractions}
                onChange={(e) => setDistractions(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Interruptions (1 = low, 5 = high)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{interruptions}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={interruptions}
                onChange={(e) => setInterruptions(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Energy at start of work (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{energyStart}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={energyStart}
                onChange={(e) => setEnergyStart(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Energy at end of work (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{energyEnd}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={energyEnd}
                onChange={(e) => setEnergyEnd(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>How much did you get done? (1–5)</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderValue}>{taskCompletion}</span>
              <input
                type="range"
                className={styles.slider}
                min={1}
                max={5}
                step={1}
                value={taskCompletion}
                onChange={(e) => setTaskCompletion(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Meeting load</label>
            <div className={styles.chipRow}>
              {MEETING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.chip} ${meetingLoad === opt.value ? styles.chipActive : ''}`}
                  onClick={() => setMeetingLoad(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Screen time (hours, optional)</label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              className={styles.input}
              value={screenHours === '' ? '' : screenHours}
              onChange={(e) =>
                setScreenHours(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
              }
              placeholder="Optional"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Notes (optional)</label>
            <textarea
              className={`${styles.input} ${styles.textArea}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Back-to-back calls, moved desk, great focus block"
              maxLength={500}
              rows={2}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Photo (optional)</label>
            <p className={styles.hint}>Calendar, desk setup, or something else. Max ~200 KB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.fileInput}
              aria-label="Upload image"
              onChange={handlePhotoChange}
            />
            {photoDataUrl && (
              <div className={styles.photoPreview}>
                <img src={photoDataUrl} alt="Upload" className={styles.photoImg} />
                <select
                  className={styles.select}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  aria-label="Photo caption"
                >
                  <option value="">Caption (optional)</option>
                  {PHOTO_CAPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.removePhoto}
                  onClick={() => {
                    setPhotoDataUrl(null);
                    setPhotoCaption('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Remove photo
                </button>
              </div>
            )}
            {photoError && <p className={styles.photoError} role="alert">{photoError}</p>}
          </div>

          <button type="submit" className={styles.submitButton}>
            Submit
          </button>
        </form>
      </main>
    </div>
  );
}
