/**
 * Pulse aggregation: cross-block synthesis when 2+ blocks are logged.
 * Uses pulse-aggregation-prompt.md. Input: handoffs + raw block data. Output: one narrative for Pulse page.
 */
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const PROMPT_PATH = path.join(__dirname, '../../../../ai-engine/prompts/pulse-aggregation-prompt.md');

function getSystemPrompt() {
  try {
    return fs.readFileSync(PROMPT_PATH, 'utf8');
  } catch {
    return null;
  }
}

function buildUserMessage(input) {
  return [
    'Input (JSON):',
    JSON.stringify(input, null, 2),
    '',
    'Respond with only a single JSON object, no markdown or code fence. Keys: mode, pulse_score_framing, what_connects, pulse_drivers (array of strings), recommendations (array of { action, observe, why }), tomorrow_signal, cta.',
  ].join('\n');
}

function parseResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') return null;
    const mode = parsed.mode === 'two_block' || parsed.mode === 'three_block' ? parsed.mode : 'two_block';
    const pulse_score_framing = typeof parsed.pulse_score_framing === 'string' ? parsed.pulse_score_framing.trim() : '';
    const what_connects = typeof parsed.what_connects === 'string' ? parsed.what_connects.trim() : '';
    const pulse_drivers = Array.isArray(parsed.pulse_drivers)
      ? parsed.pulse_drivers.filter((s) => typeof s === 'string').map((s) => s.trim()).filter(Boolean)
      : [];
    const rawRecs = parsed.recommendations;
    const recommendations = Array.isArray(rawRecs)
      ? rawRecs
          .filter((r) => r && typeof r === 'object')
          .map((r) => ({
            action: typeof r.action === 'string' ? r.action.trim() : '',
            observe: typeof r.observe === 'string' ? r.observe.trim() : '',
            why: typeof r.why === 'string' ? r.why.trim() : '',
          }))
          .filter((r) => r.action || r.observe || r.why)
      : [];
    const tomorrow_signal = typeof parsed.tomorrow_signal === 'string' ? parsed.tomorrow_signal.trim() : '';
    const cta = parsed.cta != null && typeof parsed.cta === 'string' ? parsed.cta.trim() : null;
    return {
      mode,
      pulse_score_framing,
      what_connects,
      pulse_drivers,
      recommendations,
      tomorrow_signal,
      cta,
    };
  } catch {
    return null;
  }
}

/**
 * Run aggregation. Input: { mode, date, blocks_logged, handoffs: { body, work, nutrition }, raw: { body, work, nutrition }, yesterday?, history_7d? }.
 * Returns { mode, pulse_score_framing, what_connects, pulse_drivers, recommendations, tomorrow_signal, cta } or { error }.
 */
async function computePulseAggregation(input) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return { error: 'GEMINI_API_KEY is not set.' };
  }

  const systemPrompt = getSystemPrompt();
  if (!systemPrompt) {
    return { error: 'Pulse aggregation prompt not found.' };
  }

  const userMessage = buildUserMessage(input);
  const body = {
    system_instruction: { parts: [{ text: systemPrompt + '\n\n---\nOutput: Respond with only a JSON object. Keys: mode, pulse_score_framing, what_connects, pulse_drivers, recommendations, tomorrow_signal, cta. No markdown.' }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1536 },
  };

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || data?.message || res.statusText;
    return { error: message || 'Pulse aggregation request failed' };
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  const text = textPart?.text?.trim();
  if (!text) return { error: 'No response from model' };

  const parsed = parseResponse(text);
  if (!parsed) return { error: 'Invalid JSON in aggregation response' };
  return parsed;
}

module.exports = { computePulseAggregation };
