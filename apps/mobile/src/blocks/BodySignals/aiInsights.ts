/**
 * Body Signals - AI-powered insights for MVP.
 * Tries: 1) Backend API (API_URL), 2) Google AI / Gemini (EXPO_PUBLIC_GOOGLE_AI_API_KEY), 3) OpenAI (EXPO_PUBLIC_OPENAI_API_KEY), 4) null → rule-based fallback.
 * Pulse Score stays deterministic (never LLM-generated).
 */
import type { BodyLogEntry, DailySignalsState } from './types';

export type AIInsightsResult = {
  insight: string;
  explanation: string;
  improvements: string[];
};

const MAX_IMPROVEMENTS = 3;

function getApiUrl(): string | undefined {
  return typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
    ? String(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '')
    : undefined;
}

function getGoogleAIKey(): string | undefined {
  return typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_AI_API_KEY
    ? String(process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY).trim()
    : undefined;
}

function getOpenAIKey(): string | undefined {
  return typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_OPENAI_API_KEY
    ? String(process.env.EXPO_PUBLIC_OPENAI_API_KEY).trim()
    : undefined;
}

function buildSignalsSummary(entry: BodyLogEntry, score: number, trend: string, state: DailySignalsState): string {
  const parts: string[] = [];
  if (entry.sleepHours != null) parts.push(`Sleep: ${entry.sleepHours}h`);
  if (entry.sleepQuality != null) parts.push(`Sleep quality (1-5): ${entry.sleepQuality}`);
  if (entry.energy != null) parts.push(`Energy (1-5): ${entry.energy}`);
  if (entry.mood != null) parts.push(`Mood (1-5): ${entry.mood}`);
  if (entry.hydration != null) parts.push(`Hydration (1-5): ${entry.hydration}`);
  if (entry.stress != null) parts.push(`Stress (1-5): ${entry.stress}`);
  if (entry.weight != null) parts.push(`Weight: ${entry.weight} kg`);
  if (entry.notes?.trim()) parts.push(`Notes (context only): ${entry.notes.trim()}`);
  return [
    `Today's signals: ${parts.join(', ')}.`,
    `Pulse Score (0-100): ${score}. Trend: ${trend}.`,
    `Friction points: ${state.frictionPoints.length ? state.frictionPoints.join(', ') : 'none'}.`,
  ].join(' ');
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
      ? raw
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

const SYSTEM_PROMPT = `You are a supportive, non-medical lifestyle coach for the Pulse app. You only give general wellness suggestions. You NEVER diagnose, prescribe, or give medical advice.

Rules:
- Use words like "may", "likely", "suggests". No absolute claims.
- Output exactly 3 short improvement suggestions (actionable, calm). Max 3.
- Do not reference diseases or conditions. If the user mentions feeling unwell, suggest rest, hydration, and lighter activity only.
- Keep insight and explanation each to 1-2 short sentences.
- Respond with valid JSON only, no markdown: {"insight": "...", "explanation": "...", "improvements": ["...", "...", "..."]}`;

/**
 * Request AI insights from backend (POST /insights/body-signals).
 * Payload: { entry, score, trend, previousScore, frictionPoints }.
 * Expects: { insight, explanation, improvements }.
 */
async function fetchViaAPI(
  entry: BodyLogEntry,
  score: number,
  trend: string,
  previousScore: number | undefined,
  state: DailySignalsState
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

/**
 * Request AI insights from Google AI (Gemini). Use EXPO_PUBLIC_GOOGLE_AI_API_KEY in .env.
 * Get a key at https://aistudio.google.com/app/apikey
 */
async function fetchViaGoogleAI(
  entry: BodyLogEntry,
  score: number,
  trend: string,
  state: DailySignalsState
): Promise<AIInsightsResult | null> {
  const apiKey = getGoogleAIKey();
  if (!apiKey) return null;

  const userContent = buildSignalsSummary(entry, score, trend, state);
  const fullPrompt = `${SYSTEM_PROMPT}\n\nUser data:\n${userContent}`;
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
        encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return null;
    return parseAIResponse(text.trim());
  } catch {
    return null;
  }
}

/**
 * Request AI insights from OpenAI (client-side). Use EXPO_PUBLIC_OPENAI_API_KEY in .env.
 */
async function fetchViaOpenAI(
  entry: BodyLogEntry,
  score: number,
  trend: string,
  state: DailySignalsState
): Promise<AIInsightsResult | null> {
  const apiKey = getOpenAIKey();
  if (!apiKey) return null;

  const userContent = buildSignalsSummary(entry, score, trend, state);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 400,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;
    return parseAIResponse(content);
  } catch {
    return null;
  }
}

/**
 * Get AI-generated insight, explanation, and improvements (max 3).
 * Tries: backend API → Google AI (Gemini) → OpenAI. Returns null on failure → rule-based fallback.
 */
export async function fetchAIInsights(
  entry: BodyLogEntry,
  score: number,
  trend: string,
  state: DailySignalsState,
  previousScore?: number
): Promise<AIInsightsResult | null> {
  const viaApi = await fetchViaAPI(entry, score, trend, previousScore, state);
  if (viaApi) return viaApi;
  const viaGoogle = await fetchViaGoogleAI(entry, score, trend, state);
  if (viaGoogle) return viaGoogle;
  return fetchViaOpenAI(entry, score, trend, state);
}
