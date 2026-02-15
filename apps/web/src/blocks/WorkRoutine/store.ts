/**
 * Work Routine: check-ins and narrative analysis.
 * Logic aligned with: work-routine-system-prompt.md. Notes describe reality; response must explain effect + leverage.
 * Work routine = cognitive load, focus quality, mental fatigue, environment, timing (not productivity advice).
 */
import type { CheckInEntry, CheckInAnalysis, QuestionResponse, WorkDayMetrics } from './types';

const STORAGE_KEY = '@pulse/work_routine_checkins';

/** Work-note themes: concrete work patterns that require effect + leverage (no name-check only). */
function getWorkNoteThemes(notes: string): string[] {
  if (!notes || !notes.trim()) return [];
  const lower = notes.toLowerCase().trim();
  const themes: string[] = [];
  if (/\b(back to back calls|back-to-back calls|calls all day|nonstop calls|back to back meetings|meetings all day|meeting marathon)\b/.test(lower)) themes.push('back_to_back_calls');
  if (/\b(meetings all day|meeting marathon|back to back meetings|back-to-back meetings)\b/.test(lower) && !themes.includes('back_to_back_calls')) themes.push('meetings_heavy');
  if (/\b(deadline|deadlines|big day|crunch|ship date)\b/.test(lower)) themes.push('deadline');
  if (/\b(couldn't focus|could not focus|no focus|distracted all day|couldn\'t focus|barely focused)\b/.test(lower)) themes.push('no_focus');
  if (/\b(interruptions|constant interruptions|pings|slack|messages all day)\b/.test(lower)) themes.push('interruptions');
  if (/\b(deep work|focus block|heads down|uninterrupted)\b/.test(lower)) themes.push('deep_work');
  if (/\b(overwhelm|overwhelmed|chaotic|chaos|fire drill|putting out fires)\b/.test(lower)) themes.push('overwhelm');
  if (/\b(no break|no breaks|didn't take a break|no time to break)\b/.test(lower)) themes.push('no_breaks');
  if (/\b(long day|very long day|marathon day|10 hour|12 hour)\b/.test(lower)) themes.push('long_day_note');
  if (/\b(screen all day|screens all day|zoom fatigue|video calls)\b/.test(lower)) themes.push('screen_heavy');
  if (/\b(tired|exhausted|drained|wiped|burned out|burnout)\b/.test(lower)) themes.push('drained');
  return themes;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): CheckInEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CheckInEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: CheckInEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Narrative format: pattern (short), shaping (bullet lines), one thing to try. Note = reality; must explain effect + leverage. No banned phrases. */
function ruleBasedAnalysisFromMetrics(m: WorkDayMetrics): CheckInAnalysis {
  const notes = (m.notes || '').trim();
  const noteThemes = getWorkNoteThemes(notes);
  const hasConcreteNote = noteThemes.length > 0;
  const longDay = m.workHours >= 9;
  const lowFocus = m.focusSessions <= 1 && m.workHours >= 4;
  const lowBreaks = m.breaks <= 2 && m.workHours >= 5;
  const lowComfort = m.deskComfort <= 2;
  const highDistractions = m.distractions >= 4;
  const highInterruptions = m.interruptions >= 4;
  const energyDrop = m.energyEnd <= 2 && m.energyStart >= 3;
  const lowCompletion = m.taskCompletion <= 2;
  const meetingHeavy = m.meetingLoad === 'many' && m.focusSessions <= 2;

  let pattern: string;
  let shapingLines: string[];
  let oneThing: string;

  if (hasConcreteNote) {
    // Note-driven: at least one direct effect + one specific leverage. No name-check.
    if (noteThemes.includes('back_to_back_calls')) {
      pattern = 'Back-to-back calls create continuous mental load. Even if energy feels okay, focus usually degrades later in the day.';
      shapingLines = [
        'Calls leave little recovery time between tasks.',
        'Mental fatigue builds quietly without obvious stress.',
        'Focus often drops before energy does.',
      ];
      oneThing = 'Notice whether a short gap between calls changes focus later. Even 5 minutes of transition can reduce carryover fatigue.';
    } else if (noteThemes.includes('meetings_heavy')) {
      pattern = 'Meetings all day create sustained cognitive load and context switching. Deep work and recovery windows get squeezed.';
      shapingLines = [
        'Meeting load leaves little transition time between tasks.',
        'Mental fatigue and focus decay often show up after long meeting blocks.',
      ];
      oneThing = 'Observe if one meeting-free block (before or after the run) changes how focus and energy hold for the rest of the day.';
    } else if (noteThemes.includes('deadline')) {
      pattern = 'Deadline pressure adds cognitive load and often extends focus without recovery. Recovery debt usually shows up as lower energy or focus the next day.';
      shapingLines = [
        'Time pressure reduces natural break points.',
        'Mental fatigue builds even when energy feels high during the push.',
      ];
      oneThing = 'Notice whether one clear stop time or a short break before wind-down changes how you feel the next day.';
    } else if (noteThemes.includes('no_focus')) {
      pattern = 'Difficulty focusing often reflects attention fragmentation or upstream load (sleep, stress, or task structure).';
      shapingLines = [
        'Distractions and context switching fragment attention.',
        'Sleep and stress can reduce focus resilience.',
      ];
      oneThing = 'Observe if one protected focus block (e.g. 25 minutes with notifications off) changes how much gets done and how mental fatigue feels.';
    } else if (noteThemes.includes('interruptions')) {
      pattern = 'Constant interruptions fragment focus and add task-switching cost. Mental fatigue builds without obvious recovery windows.';
      shapingLines = [
        'Interruptions leave little sustained attention time.',
        'Focus often drops before energy does.',
      ];
      oneThing = 'Notice whether one Do Not Disturb window (even 20-30 minutes) changes how focus and completion feel later in the day.';
    } else if (noteThemes.includes('deep_work')) {
      pattern = 'Heads-down work adds productive load but long unbroken blocks can drain energy and leave little transition time.';
      shapingLines = [
        'Deep work is cognitively demanding; recovery after the block matters.',
        'A short transition before the next task can reduce carryover fatigue.',
      ];
      oneThing = 'Notice whether a short break or transition after the block changes how energy and focus hold for the rest of the day.';
    } else if (noteThemes.includes('overwhelm')) {
      pattern = 'When the day feels chaotic, cognitive load and task switching spike. Recovery windows disappear and mental fatigue builds fast.';
      shapingLines = [
        'Context switching and firefighting leave little sustained attention.',
        'One protected block or one clear stop can create a recovery window.',
      ];
      oneThing = 'Try one thing: block 20-30 minutes with Do Not Disturb, or set one hard stop time. Notice whether it changes how the rest of the day (or tomorrow) feels.';
    } else if (noteThemes.includes('no_breaks')) {
      pattern = 'No breaks mean no recovery between tasks. Mental fatigue and focus drop even when the workload feels manageable.';
      shapingLines = [
        'Back-to-back work without gaps amplifies cognitive load.',
        'Focus often drops before energy does when there are no transition windows.',
      ];
      oneThing = 'Notice whether one 5-10 minute gap (even between calls or tasks) changes how focus holds later in the day.';
    } else if (noteThemes.includes('long_day_note')) {
      pattern = 'Long days extend cognitive load without extra recovery. Energy and focus tomorrow often pay the cost.';
      shapingLines = [
        'Extended hours without more breaks increase recovery debt.',
        'A clear stop time or buffer before sleep can reduce next-day drag.',
      ];
      oneThing = 'Notice whether one hard stop time or a short wind-down before bed changes how you feel the next morning.';
    } else if (noteThemes.includes('screen_heavy')) {
      pattern = 'Screen-heavy days add sustained visual and cognitive load. Focus and energy often drop by late afternoon.';
      shapingLines = [
        'Continuous screen time reduces natural break points.',
        'Short off-screen breaks or one meeting-free block can create a reset.',
      ];
      oneThing = 'Observe if one 10-15 minute block away from screens (or one meeting-free window) changes how focus and energy hold.';
    } else if (noteThemes.includes('drained')) {
      pattern = 'Feeling drained or exhausted usually means recovery has been below what the load required. Cognitive and physical load both draw from the same pool.';
      shapingLines = [
        'Mental fatigue and low energy often reflect accumulated load and few recovery windows.',
        'One lever is timing: when you stop, and one short break earlier tomorrow.',
      ];
      oneThing = 'Notice whether one earlier stop today or one short break earlier tomorrow changes how drained you feel. No extra load; just one recovery lever.';
    } else {
      pattern = 'Your note points to a specific work pattern. Cognitive load and recovery windows are the main levers.';
      shapingLines = ['Task structure and breaks often shape focus and mental fatigue.', 'This looks cumulative, not acute.'];
      oneThing = 'Notice whether one short gap or break between blocks changes how focus holds later.';
    }
    shapingLines.push('This looks cumulative, not acute.');
  } else {
    // Metric-driven: reference actual numbers so it feels tailored, not generic.
    const hrs = m.workHours;
    const focusSessions = m.focusSessions ?? 0;
    const breaks = m.breaks ?? 0;
    const patternParts: string[] = [];
    if (longDay && (energyDrop || lowCompletion)) {
      patternParts.push(`With ${hrs} hours and ${breaks} break${breaks !== 1 ? 's' : ''}, focus and mental fatigue are tightly linked. Energy often drops when recovery windows are few.`);
    } else if (lowFocus && hrs >= 4) {
      patternParts.push(`${focusSessions} focus session${focusSessions !== 1 ? 's' : ''} in ${hrs} hours usually means high context switching. Cognitive load and mental fatigue tend to track that.`);
    } else if (highDistractions || highInterruptions) {
      patternParts.push('Distractions and interruptions are the main levers today. They fragment focus and add task-switching cost.');
    } else if (lowBreaks && hrs >= 5) {
      patternParts.push(`${breaks} break${breaks !== 1 ? 's' : ''} in ${hrs} hours leaves little recovery between tasks. Mental fatigue often builds by end of day.`);
    } else if (energyDrop) {
      patternParts.push('Energy dropped from start to end of day. That often links to hours, breaks, or meeting load rather than workload alone.');
    } else if (meetingHeavy) {
      patternParts.push('Meeting load is high and focus blocks are few. Context switching and mental fatigue usually follow.');
    } else if (lowComfort) {
      patternParts.push('Desk or posture comfort may be adding background load. It often shows up as extra fatigue even on moderate days.');
    } else {
      patternParts.push(`Your numbers (${hrs}h, ${focusSessions} focus block${focusSessions !== 1 ? 's' : ''}, ${breaks} break${breaks !== 1 ? 's' : ''}) point to one lever below.`);
    }
    pattern = patternParts.join(' ');

    shapingLines = [];
    if (lowFocus && hrs >= 4) shapingLines.push('Few deep-work blocks often increase mental fatigue and flatten energy.');
    if (highDistractions) shapingLines.push('Distractions cut into focus quality and add cognitive load.');
    if (highInterruptions) shapingLines.push('Interruptions fragment focus and reduce sustained attention.');
    if (lowBreaks && hrs >= 5) shapingLines.push('Fewer breaks amplify mental fatigue even on moderate workload days.');
    if (energyDrop) shapingLines.push('Energy drop from start to end often links to hours, breaks, or meeting load.');
    if (meetingHeavy) shapingLines.push('Meeting load limits focus blocks and can increase task friction.');
    if (lowComfort) shapingLines.push('Desk or posture strain can add to perceived fatigue.');
    if (shapingLines.length === 0) shapingLines.push('One specific lever below can shift focus or energy.');
    shapingLines.push('This looks cumulative, not acute.');

    oneThing = lowFocus && hrs >= 4
      ? 'Notice whether one or two 25-30 minute focus blocks tomorrow (notifications off) change how mental fatigue and energy hold.'
      : lowBreaks && hrs >= 5
      ? 'Notice whether one 5-10 minute break earlier in the day (e.g. before noon) changes how focus holds in the afternoon.'
      : highDistractions
      ? 'Observe if turning off one distraction source (e.g. notifications or one extra tab) for 30 minutes changes focus quality.'
      : highInterruptions
      ? 'Observe if one 20-30 minute Do Not Disturb window changes how much gets done and how focus feels.'
      : energyDrop && hrs >= 6
      ? 'Notice whether one clear stop time or a 15-minute buffer before sleep changes tomorrow\'s energy.'
      : lowCompletion
      ? 'Notice whether picking one priority and timeboxing it (e.g. 45 minutes) changes how focus and completion feel.'
      : meetingHeavy
      ? 'Observe if one meeting-free block (even 30 minutes before or after the run) changes flow and mental fatigue.'
      : lowComfort
      ? 'Notice whether one small desk or chair tweak changes comfort and focus over the next few days.'
      : longDay && hrs >= 10
      ? 'Notice whether one hard stop time when you can changes recovery and next-day energy.'
      : 'Observe if one short break earlier in the day or one 25-minute protected block changes how focus and energy hold.';
  }

  const shaping = shapingLines.map((line) => '• ' + line).join('\n');
  const assessment = pattern;
  const quickWins = shapingLines.slice(0, -1);
  return { assessment, quickWins, pattern, shaping, oneThing };
}

/** Legacy: analysis from question responses (for old entries). Uses same narrative shape when possible. */
function ruleBasedAnalysisFromResponses(responses: Record<string, QuestionResponse>): CheckInAnalysis {
  const quickWins: string[] = [];
  const sleep = responses['1']?.score ?? 2;
  const energy = responses['2']?.score ?? 2;
  const stress = responses['5']?.score ?? 2;
  const focus = responses['6']?.score ?? 2;
  if (sleep <= 2) quickWins.push('Sleep may be the main driver. Aim for 7-8 hours when you can.');
  if (energy <= 2) quickWins.push('Energy is low. Often links to sleep, movement, or breaks.');
  if (stress >= 3) quickWins.push('Stress may be adding load.');
  if (focus <= 2) quickWins.push('Focus sessions are limited. One block can help.');
  const scores = Object.values(responses).map((r) => r.score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 2.5;
  let assessment: string;
  if (avg >= 3.5) assessment = 'Signals are in a good range. One lever below can help keep focus and energy stable.';
  else if (avg >= 2.5) assessment = 'Sleep, focus, or breaks are the main levers. One specific experiment below.';
  else assessment = 'Focus on one lever tomorrow: sleep or one focus block. Build from there.';
  const shaping = quickWins.length > 0 ? quickWins.map((l) => '• ' + l).join('\n') + '\n• This looks cumulative.' : '';
  const oneThing = sleep <= 2 ? 'Notice whether 7-8 hours of sleep changes how tomorrow feels.'
    : focus <= 2 ? 'Notice whether one 25-minute focus block (notifications off) changes how completion feels.'
    : 'Notice whether one short break or stretch changes how energy responds.';
  return { assessment, quickWins, pattern: assessment, shaping, oneThing };
}

export function getCheckIns(): CheckInEntry[] {
  return [...loadEntries()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** Add a new-format check-in (work-day metrics, slide form). */
export function addWorkDayCheckIn(metrics: WorkDayMetrics): CheckInEntry {
  const analysis = ruleBasedAnalysisFromMetrics(metrics);
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const entry: CheckInEntry = {
    id: generateId(),
    timestamp: now.toISOString(),
    timeOfDay,
    analysis,
    metrics: { ...metrics },
  };
  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  return entry;
}

/** Legacy: add check-in from question responses. */
export function addCheckIn(
  responses: Record<string, QuestionResponse>,
  answers: Record<string, string>
): CheckInEntry {
  const analysis = ruleBasedAnalysisFromResponses(responses);
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const entry: CheckInEntry = {
    id: generateId(),
    timestamp: now.toISOString(),
    responses: { ...responses },
    answers: { ...answers },
    analysis,
    timeOfDay,
  };
  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  return entry;
}

export function getLatestCheckIn(): CheckInEntry | undefined {
  const entries = loadEntries();
  return entries[0];
}

const TODAY = (): string => new Date().toISOString().slice(0, 10);

/** True if the latest check-in is from today (by date). */
export function hasRoutineToday(): boolean {
  const latest = getLatestCheckIn();
  if (!latest) return false;
  return latest.timestamp.slice(0, 10) === TODAY();
}

/** 0-100 score from a check-in's metrics; null if no metrics. */
export function getScoreForCheckIn(entry: CheckInEntry): number | null {
  const m = entry.metrics;
  if (!m) return null;
  const energyStart = m.energyStart ?? 3;
  const energyEnd = m.energyEnd ?? 3;
  const taskCompletion = m.taskCompletion ?? 3;
  const deskComfort = m.deskComfort ?? 3;
  const distractions = m.distractions ?? 3;
  const interruptions = m.interruptions ?? 3;
  const avg = (energyStart + energyEnd + taskCompletion + deskComfort + (5 - distractions) + (5 - interruptions)) / 6;
  const score = Math.round(((avg - 1) / 4) * 100);
  return Math.max(0, Math.min(100, score));
}

/** 0-100 score from today's check-in metrics; null if no check-in today. */
export function getTodayRoutineScore(): number | null {
  const latest = getLatestCheckIn();
  if (!latest || latest.timestamp.slice(0, 10) !== TODAY()) return null;
  return getScoreForCheckIn(latest);
}

export function getWeeklyProgress(): { count: number; percent: number } {
  const entries = loadEntries();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const week = entries.filter((e) => new Date(e.timestamp) >= cutoff);
  const uniqueDays = new Set(week.map((e) => new Date(e.timestamp).toDateString())).size;
  return { count: uniqueDays, percent: Math.min(100, Math.round((uniqueDays / 7) * 100)) };
}

/** Check-ins within the last N days, sorted by date descending (newest first). */
export function getCheckInsForRange(days: number): CheckInEntry[] {
  const entries = loadEntries();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return entries
    .filter((e) => new Date(e.timestamp) >= cutoff)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
