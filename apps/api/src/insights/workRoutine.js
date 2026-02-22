/**
 * Work Routine: AI insights for the "Check-in saved" screen.
 * Uses work-routine-system-prompt.md. Calls Gemini; returns pattern, shaping, oneThing.
 */
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../../../../ai-engine/prompts/work-routine-system-prompt.md');

function getSystemPrompt() {
  try {
    const full = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
    return full;
  } catch {
    return FALLBACK_SYSTEM_PROMPT;
  }
}

const FALLBACK_SYSTEM_PROMPT = `You are the Work Routine AI inside PulseFlow. Your job is to read the user's work routine log and identify what in their work structure is affecting their energy, stress, and recovery. You connect what you find to their body signals if that block was already logged.

You reason like an occupational physiologist. Explain how work structure affects the nervous system and body, not productivity tips.

Output format (strict JSON only, no other text):
- "pattern": One sentence. What kind of day was this physiologically?
- "shaping": Two to three bullet lines. Format: [driver] → [effect] - [mechanism]. Use "\\n" between lines; each line can start with "• ".
- "oneThing": One paragraph. One experiment, specific action, specific signal to watch. Target the root work-structure driver.

If body signals were provided, reference at least one explicit connection between work data and body signals in shaping.
No productivity advice, no generic stress management, no ergonomics unless user note mentions physical discomfort.`;

function buildUserMessage(work, bodyEntry) {
  const parts = ['Work block data (today):', JSON.stringify(work, null, 2)];
  if (bodyEntry && typeof bodyEntry === 'object') {
    parts.push('', 'Body block (logged today; use for cross-block connection):', JSON.stringify(bodyEntry, null, 2));
  }
  parts.push('', 'Respond with only a single JSON object with keys: pattern (string), shaping (string, 2-3 bullet lines separated by \\n, each line may start with •), oneThing (string). No markdown, no code fence.');
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
    return {
      pattern: pattern || '',
      shaping: shaping || '',
      oneThing: oneThing || '',
    };
  } catch {
    return null;
  }
}

/**
 * Call Gemini for work routine insights. Returns { pattern, shaping, oneThing } or { error }.
 */
async function computeWorkRoutineInsights(work, bodyEntry) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return { error: 'GEMINI_API_KEY is not set.' };
  }

  const systemPrompt = getSystemPrompt();
  const systemWithJson = systemPrompt + '\n\n---\nOutput: Respond with only a JSON object, no markdown or code fence. Keys: pattern (string), shaping (string, 2-3 bullet lines separated by newline, each line may start with •), oneThing (string).';
  const userMessage = buildUserMessage(work, bodyEntry);

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
    return { error: message || 'Work routine insights request failed' };
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  const text = textPart?.text?.trim();
  if (!text) return { error: 'No response from model' };

  const parsed = parseResponse(text);
  if (!parsed) return { error: 'Invalid JSON in response' };
  return parsed;
}

module.exports = { computeWorkRoutineInsights, parseResponse };
