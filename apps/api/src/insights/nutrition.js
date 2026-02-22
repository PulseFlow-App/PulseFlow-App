/**
 * Nutrition: AI insights for the Nutrition block "saved" screen.
 * Uses nutrition-system-prompt.md. Calls Gemini; returns pattern, shaping, oneThing.
 * Requires meal timing + hydration; optional: body handoff, work handoff, reflections, fridge.
 */
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../../../../ai-engine/prompts/nutrition-system-prompt.md');

function getSystemPrompt() {
  try {
    return fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
  } catch {
    return FALLBACK_SYSTEM_PROMPT;
  }
}

const FALLBACK_SYSTEM_PROMPT = `You are the Nutrition AI inside PulseFlow. You read the user's nutrition log (meal timing, hydration, fridge inference) and identify patterns that connect to energy, stress, digestion, and recovery. You connect findings to body signals and work routine if those blocks were logged.

Reason about timing, consistency, and physiological context. No diet quality, calories, or food "goodness." No dietitian advice. Explain mechanisms.

Output format (strict JSON only):
- "pattern": One to two sentences. Interpret eating pattern in context; if body/work available, name the main nutrition-body or nutrition-work connection.
- "shaping": Three to five bullet lines. At least one bullet per available prior block with explicit connection. Use "\\n" between lines; each line may start with "• ".
- "oneThing": One experiment. Timing or hydration specific. Not food quality. Tied to root nutrition pattern.

No calorie commentary, no good/bad foods, no portion sizes, no specific diets.`;

function buildUserMessage(nutrition, bodyHandoff, workHandoff) {
  const parts = ['Nutrition block data (today):', JSON.stringify(nutrition, null, 2)];
  if (bodyHandoff && typeof bodyHandoff === 'object') {
    parts.push('', 'Body block handoff (use for cross-block connection):', JSON.stringify(bodyHandoff, null, 2));
  }
  if (workHandoff && typeof workHandoff === 'object') {
    parts.push('', 'Work block handoff (use for cross-block connection):', JSON.stringify(workHandoff, null, 2));
  }
  parts.push('', 'Respond with only a single JSON object with keys: pattern (string), shaping (string, 3-5 bullet lines separated by \\n, each line may start with •), oneThing (string). No markdown, no code fence.');
  return parts.join('\n');
}

function parseResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') return null;
    const pattern = typeof parsed.pattern === 'string' ? parsed.pattern.trim() : '';
    const shaping = typeof parsed.shaping === 'string' ? parsed.shaping.trim() : '';
    const oneThing = typeof parsed.oneThing === 'string' ? parsed.oneThing.trim() : '';
    if (!pattern && !shaping && !oneThing) return null;
    return { pattern: pattern || '', shaping: shaping || '', oneThing: oneThing || '' };
  } catch {
    return null;
  }
}

/**
 * Call Gemini for nutrition insights. Returns { pattern, shaping, oneThing } or { error }.
 */
async function computeNutritionInsights(nutrition, bodyHandoff, workHandoff) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return { error: 'GEMINI_API_KEY is not set.' };
  }

  const systemPrompt = getSystemPrompt();
  const systemWithJson = systemPrompt + '\n\n---\nOutput: Respond with only a JSON object, no markdown or code fence. Keys: pattern (string), shaping (string, 3-5 bullet lines separated by newline, each line may start with •), oneThing (string).';
  const userMessage = buildUserMessage(nutrition, bodyHandoff, workHandoff);

  const body = {
    system_instruction: { parts: [{ text: systemWithJson }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || data?.message || res.statusText;
    return { error: message || 'Nutrition insights request failed' };
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  const text = textPart?.text?.trim();
  if (!text) return { error: 'No response from model' };

  const parsed = parseResponse(text);
  if (!parsed) return { error: 'Invalid JSON in response' };
  return parsed;
}

module.exports = { computeNutritionInsights, parseResponse };
