/**
 * Daily Report: compile block outputs into report JSON via AI.
 * Uses daily-report-system-prompt.md. Does not generate new insights.
 */
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../../../ai-engine/prompts/daily-report-system-prompt.md');

function getSystemPrompt() {
  try {
    return fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
  } catch {
    return FALLBACK;
  }
}

const FALLBACK = `You are generating a PulseFlow Daily Report. You receive block outputs from today (body, work, nutrition). Produce the Daily Report JSON object: report_date, user_name, blocks_logged, report_type (complete|partial), pulse_summary (overall_score, score_framing, block_scores), synthesis (what_connected_today, primary_driver, chain), block_details (body/work/nutrition with todays_pattern, drivers, raw_signals, user_note), recommendations (array of { priority, action, observe, why, blocks_referenced }), tomorrow_signal, footer_note. Do not invent insights - compile from the inputs. Output only valid JSON.`;

function buildUserMessage(payload) {
  return [
    'Generate the Daily Report JSON for the date in the payload.',
    'Use only the data provided. Do not generate new insights.',
    '',
    'Payload:',
    JSON.stringify(payload, null, 2),
    '',
    'Output only the JSON object. No markdown, no code fence, no preamble.',
  ].join('\n');
}

function parseResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

async function generateDailyReport(payload) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return { error: 'GEMINI_API_KEY is not set.' };
  }

  const systemPrompt = getSystemPrompt();
  const systemWithJson = systemPrompt + '\n\nOutput only the JSON object. No markdown, no code fence.';
  const userMessage = buildUserMessage(payload);

  const body = {
    system_instruction: { parts: [{ text: systemWithJson }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
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
    return { error: message || 'Report generation failed' };
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  const text = textPart?.text?.trim();
  if (!text) return { error: 'No response from model' };

  const report = parseResponse(text);
  if (!report || typeof report !== 'object') return { error: 'Invalid report JSON' };
  return report;
}

module.exports = { generateDailyReport };
