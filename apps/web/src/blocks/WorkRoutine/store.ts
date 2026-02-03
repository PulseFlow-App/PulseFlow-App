import type { CheckInEntry, CheckInAnalysis, QuestionResponse } from './types';
import { WORK_ROUTINE_QUESTIONS } from './questions';

const STORAGE_KEY = '@pulse/work_routine_checkins';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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

function ruleBasedAnalysis(responses: Record<string, QuestionResponse>): CheckInAnalysis {
  const scores = WORK_ROUTINE_QUESTIONS.map((q) => {
    const r = responses[q.id.toString()];
    return r ? r.score : 2;
  });
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sleep = responses['1']?.score ?? 2;
  const energy = responses['2']?.score ?? 2;
  const stress = responses['5']?.score ?? 2;
  const focus = responses['6']?.score ?? 2;

  const quickWins: string[] = [];
  if (sleep <= 2) quickWins.push('Aim for 7–8 hours of sleep tonight.');
  if (energy <= 2) quickWins.push('Take a short walk or stretch to boost energy.');
  if (stress >= 3) quickWins.push('Take 5 deep breaths or a 2-minute break.');
  if (focus <= 2) quickWins.push('Block one 25-minute focus session later today.');
  if (quickWins.length === 0) quickWins.push('Keep up the good habits.');

  let assessment: string;
  if (avg >= 3.5) assessment = 'Strong day overall. Keep the momentum.';
  else if (avg >= 2.5) assessment = 'Solid baseline. Small tweaks can lift your routine.';
  else assessment = 'Focus on one area tomorrow - sleep or movement - and build from there.';

  return { assessment, quickWins };
}

export function getCheckIns(): CheckInEntry[] {
  return [...loadEntries()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function addCheckIn(
  responses: Record<string, QuestionResponse>,
  answers: Record<string, string>
): CheckInEntry {
  const analysis = ruleBasedAnalysis(responses);
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const entry: CheckInEntry = {
    id: generateId(),
    timestamp: now.toISOString(),
    responses,
    answers,
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

export function getStreak(): number {
  const entries = loadEntries();
  if (entries.length === 0) return 0;
  const days = new Set(
    entries.map((e) => {
      const d = new Date(e.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  const sorted = Array.from(days).sort((a, b) => b - a);
  const today = getTodayStart().getTime();
  let streak = 0;
  let cursor = today;
  if (!days.has(today)) {
    cursor = today - 24 * 60 * 60 * 1000;
    if (!days.has(cursor)) return 0;
  }
  for (const t of sorted) {
    if (t === cursor) {
      streak++;
      cursor -= 24 * 60 * 60 * 1000;
    } else if (t < cursor) break;
  }
  return streak;
}

export function getWeeklyProgress(): { count: number; percent: number } {
  const entries = loadEntries();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const week = entries.filter((e) => new Date(e.timestamp) >= cutoff);
  const uniqueDays = new Set(week.map((e) => new Date(e.timestamp).toDateString())).size;
  return { count: uniqueDays, percent: Math.min(100, Math.round((uniqueDays / 7) * 100)) };
}
