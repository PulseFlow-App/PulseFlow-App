/**
 * Body Signals - AI insights on web.
 * Calls backend POST /insights/body-signals when VITE_API_URL is set.
 * Otherwise returns null → rule-based fallback in store.
 */
import type { BodyLogEntry, DailySignalsState } from './types';

export type AIInsightsResult = {
  insight: string;
  explanation: string;
  improvements: string[];
};

const MAX_IMPROVEMENTS = 3;

function getApiUrl(): string | undefined {
  const url = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
  if (typeof url !== 'string' || !url.trim()) return undefined;
  return url.trim().replace(/\/$/, '');
}

function parseAIResponse(text: string): AIInsightsResult | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Record<string, unknown>;
    const insight = typeof p.insight === 'string' ? p.insight.trim() : '';
    const explanation = typeof p.explanation === 'string' ? p.explanation.trim() : '';
    const raw = p.improvements;
    const improvements = Array.isArray(raw)
      ? (raw as unknown[])
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, MAX_IMPROVEMENTS)
      : [];
    if (!insight && !explanation && improvements.length === 0) return null;
    return {
      insight: insight || 'Your signals are in. Small tweaks may help.',
      explanation: explanation || 'Focus on one or two suggestions below.',
      improvements,
    };
  } catch {
    return null;
  }
}

/**
 * Request AI insights from backend (POST /insights/body-signals).
 * Same contract as mobile: { entry, score, trend, previousScore, frictionPoints } → { insight, explanation, improvements }.
 */
export async function fetchAIInsights(
  entry: BodyLogEntry,
  score: number,
  trend: string,
  state: DailySignalsState,
  previousScore?: number
): Promise<AIInsightsResult | null> {
  const base = getApiUrl();
  if (!base) return null;
  const url = `${base}/insights/body-signals`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry: {
          sleepHours: entry.sleepHours,
          sleepQuality: entry.sleepQuality,
          energy: entry.energy,
          mood: entry.mood,
          hydration: entry.hydration,
          stress: entry.stress,
          weight: entry.weight,
          notes: entry.notes,
        },
        score,
        trend,
        previousScore,
        frictionPoints: state.frictionPoints,
      }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return parseAIResponse(text);
  } catch {
    return null;
  }
}
