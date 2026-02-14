/**
 * Body Signals - AI insights on web.
 * Calls backend POST /insights/body-signals when VITE_API_URL is set.
 * Otherwise returns null → rule-based fallback in store.
 */
import type { BodyLogEntry, DailySignalsState, FactorImpact } from './types';

export type AIInsightsResult = {
  insight: string;
  explanation: string;
  improvements: string[];
  factors?: FactorImpact[];
};

const MAX_IMPROVEMENTS = 3;

function getApiUrl(): string | undefined {
  const url = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
  if (typeof url !== 'string' || !url.trim()) return undefined;
  return url.trim().replace(/\/$/, '');
}

function parseFactors(raw: unknown): FactorImpact[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map((x) => ({
      factor: typeof x.factor === 'string' ? x.factor : '',
      impact: (x.impact === 'high' || x.impact === 'medium' || x.impact === 'low' ? x.impact : 'medium') as FactorImpact['impact'],
      affects: Array.isArray(x.affects) ? (x.affects as unknown[]).filter((a): a is string => typeof a === 'string') : [],
      note: typeof x.note === 'string' ? x.note : undefined,
    }))
    .filter((x) => x.factor);
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
    const factors = parseFactors(p.factors);
    if (!insight && !explanation && improvements.length === 0 && factors.length === 0) return null;
    return {
      insight: insight || 'Your signals are in. Small tweaks may help.',
      explanation: explanation || 'Focus on one or two suggestions below.',
      improvements,
      factors: factors.length ? factors : undefined,
    };
  } catch {
    return null;
  }
}

export type FetchAIInsightsResult =
  | { result: AIInsightsResult; error: null }
  | { result: null; error: string };

/**
 * Request insights from backend (POST /insights/body-signals).
 * Returns result + error reason so UI can show why AI was not fetched.
 */
export async function fetchAIInsights(
  entry: BodyLogEntry,
  score: number,
  trend: string,
  state: DailySignalsState,
  previousScore?: number,
  recentEntries?: BodyLogEntry[]
): Promise<FetchAIInsightsResult> {
  const base = getApiUrl();
  if (!base) {
    return {
      result: null,
      error: 'VITE_API_URL is not set. Set it in your app build environment (e.g. Vercel → Environment Variables) and redeploy. The API is used for AI recommendations.',
    };
  }
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
          appetite: entry.appetite,
          digestion: entry.digestion,
          notes: entry.notes,
        },
        score,
        trend,
        previousScore,
        frictionPoints: state.frictionPoints,
        recentEntries: (recentEntries || []).slice(0, 7).map((e) => ({
          date: e.date,
          sleepHours: e.sleepHours,
          sleepQuality: e.sleepQuality,
          energy: e.energy,
          mood: e.mood,
          hydration: e.hydration,
          stress: e.stress,
          appetite: e.appetite,
          digestion: e.digestion,
          notes: e.notes,
        })),
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      const snippet = text.slice(0, 80);
      if (res.status === 403) {
        return {
          result: null,
          error: 'API rejected the request. Ensure the API allows your app origin: set CORS_ORIGIN or CORS_ORIGINS on the API to your PWA URL.',
        };
      }
      return { result: null, error: `API error: ${res.status} ${res.statusText}. ${snippet}` };
    }
    const parsed = parseAIResponse(text);
    if (!parsed) {
      return { result: null, error: 'API returned invalid or empty response.' };
    }
    return { result: parsed, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isNetwork = /failed to fetch|network|connection refused|load failed/i.test(msg);
    const baseError = isNetwork
      ? `Can't reach the API at ${base}. Check that the API is running and allows this origin (CORS). For PWA: set CORS_ORIGIN (or CORS_ORIGINS) on the API to your app URL.`
      : `Request failed: ${msg}`;
    const devHint = import.meta.env.DEV && isNetwork
      ? ' Local API: run "cd apps/api && npm run dev" and use VITE_API_URL=http://localhost:3002 (port 3002, not 3000).'
      : '';
    return { result: null, error: baseError + devHint };
  }
}
