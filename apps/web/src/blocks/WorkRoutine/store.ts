/**
 * Work Routine — check-ins and narrative analysis.
 * Logic aligned with: .cursor/skills/work-routine/SKILL.md and apps/ai-engine/prompts/work-routine-system-prompt.md.
 * Work routine = cognitive load, focus quality, mental fatigue, environment, timing (not productivity advice).
 */
import type { CheckInEntry, CheckInAnalysis, QuestionResponse, WorkDayMetrics } from './types';

const STORAGE_KEY = '@pulse/work_routine_checkins';

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

/** Narrative format: pattern (short), shaping (bullet lines), one thing to try. Concise, causal, no clichés. */
function ruleBasedAnalysisFromMetrics(m: WorkDayMetrics): CheckInAnalysis {
  const notes = (m.notes || '').trim();
  const hasNotes = notes.length > 0;
  const longDay = m.workHours >= 9;
  const lowFocus = m.focusSessions <= 1 && m.workHours >= 4;
  const lowBreaks = m.breaks <= 2 && m.workHours >= 5;
  const lowComfort = m.deskComfort <= 2;
  const highDistractions = m.distractions >= 4;
  const highInterruptions = m.interruptions >= 4;
  const energyDrop = m.energyEnd <= 2 && m.energyStart >= 3;
  const lowCompletion = m.taskCompletion <= 2;
  const meetingHeavy = m.meetingLoad === 'many' && m.focusSessions <= 2;

  // Today's work pattern: focus quality, mental fatigue, cognitive load. Observational, not productivity language.
  const patternParts: string[] = [];
  if (longDay && (energyDrop || lowCompletion)) {
    patternParts.push('Focus and mental fatigue are tightly linked today. Energy appears to drop alongside longer work blocks.');
  } else if (lowFocus || highDistractions || highInterruptions) {
    patternParts.push('Focus quality and cognitive load look like the main levers today.');
  } else {
    patternParts.push('Your work day looks balanced on the surface.');
  }
  if (hasNotes) {
    const notePreview = notes.length > 60 ? notes.slice(0, 57) + '...' : notes;
    patternParts.push(`Your note (${notePreview}) fits with that.`);
  }
  if (lowBreaks && longDay) patternParts.push('Fewer breaks often show up as lower energy by end of day.');
  if (lowComfort) patternParts.push('Posture or space comfort may be adding background load.');
  const pattern = patternParts.join(' ');

  // What's shaping this: bullet rhythm. Link to body signals where relevant (sleep, breaks, workload).
  const shapingLines: string[] = [];
  if (lowFocus && m.workHours >= 4) shapingLines.push('Focus sessions are the main driver. Few deep-work blocks often increase mental fatigue and flatten energy.');
  if (highDistractions) shapingLines.push('Distractions may be cutting into focus quality.');
  if (highInterruptions) shapingLines.push('Interruptions often fragment focus and add cognitive load.');
  if (lowBreaks && m.workHours >= 5) shapingLines.push('Fewer breaks can amplify mental fatigue even on moderate workload days.');
  if (energyDrop) shapingLines.push('Energy dropped from start to end. Often links to hours, breaks, or meeting load.');
  if (meetingHeavy) shapingLines.push('Meeting load is limiting focus blocks and can increase task friction.');
  if (lowComfort) shapingLines.push('Desk or posture strain can add to perceived fatigue.');
  if (shapingLines.length === 0) shapingLines.push('Signals are in a moderate range. One small experiment may move the needle.');
  shapingLines.push('This looks cumulative, not acute.');
  const shaping = shapingLines.map((line) => '• ' + line).join('\n');

  // One thing to observe: one experiment, specific to data. "Notice whether…", "Observe if…"
  let oneThing: string;
  if (lowFocus && m.workHours >= 4) oneThing = 'Notice whether one or two deep focus sessions tomorrow change how mental fatigue and energy hold.';
  else if (lowBreaks && m.workHours >= 5) oneThing = 'Notice whether a short break earlier in the day changes how focus holds in the afternoon.';
  else if (highDistractions) oneThing = 'Observe if reducing one distraction source (e.g. notifications or tab count) changes focus quality.';
  else if (highInterruptions) oneThing = 'Observe if protecting one focus block with a Do Not Disturb window changes how much gets done.';
  else if (energyDrop && m.workHours >= 6) oneThing = 'Notice whether winding down a bit earlier or adding a buffer before sleep changes tomorrow\'s energy.';
  else if (lowCompletion) oneThing = 'Notice whether picking one priority and timeboxing it changes how focus and completion feel.';
  else if (meetingHeavy) oneThing = 'Observe if one meeting-free focus block changes flow and mental fatigue.';
  else if (lowComfort) oneThing = 'Notice whether one small tweak to desk or chair changes comfort and focus over the week.';
  else if (longDay && m.workHours >= 10) oneThing = 'Notice whether capping focused work hours when you can changes recovery and next-day energy.';
  else oneThing = 'Notice what helps focus or energy most over the next few days. One small change is enough.';

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
  if (sleep <= 2) quickWins.push('Sleep may be the main driver. Aim for 7–8 hours when you can.');
  if (energy <= 2) quickWins.push('Energy is low. Often links to sleep, movement, or breaks.');
  if (stress >= 3) quickWins.push('Stress may be adding load.');
  if (focus <= 2) quickWins.push('Focus sessions are limited. One block can help.');
  const scores = Object.values(responses).map((r) => r.score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 2.5;
  let assessment: string;
  if (avg >= 3.5) assessment = 'Strong day overall. Your signals look balanced.';
  else if (avg >= 2.5) assessment = 'Solid baseline. One small tweak can lift your routine.';
  else assessment = 'Focus on one lever tomorrow: sleep or one focus block. Build from there.';
  const shaping = quickWins.length > 0 ? quickWins.map((l) => '• ' + l).join('\n') + '\n• This looks cumulative.' : '';
  const oneThing = sleep <= 2 ? 'Observe just one change: Aim for 7–8 hours of sleep. Notice how tomorrow feels.'
    : focus <= 2 ? 'Observe just one change: Block one 25-minute focus session. See how completion feels.'
    : 'Observe just one change: One short walk or stretch. Notice how energy responds.';
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

/** 0–100 score from today's check-in metrics; null if no check-in today. */
export function getTodayRoutineScore(): number | null {
  const latest = getLatestCheckIn();
  if (!latest || latest.timestamp.slice(0, 10) !== TODAY()) return null;
  const m = latest.metrics;
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

export function getWeeklyProgress(): { count: number; percent: number } {
  const entries = loadEntries();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const week = entries.filter((e) => new Date(e.timestamp) >= cutoff);
  const uniqueDays = new Set(week.map((e) => new Date(e.timestamp).toDateString())).size;
  return { count: uniqueDays, percent: Math.min(100, Math.round((uniqueDays / 7) * 100)) };
}
