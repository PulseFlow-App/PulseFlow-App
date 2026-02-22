/**
 * Fridge Photo AI: one photo of fridge/pantry, returns ingredient inventory + 2-3 meal suggestions.
 * Uses fridge-photo-system-prompt.md. Optional body_signals for context.
 */
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../../../../ai-engine/prompts/fridge-photo-system-prompt.md');

function getSystemPrompt() {
  try {
    return fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
  } catch {
    return FALLBACK_SYSTEM_PROMPT;
  }
}

const FALLBACK_SYSTEM_PROMPT = `You are the Fridge/Pantry AI inside PulseFlow. The user submits one photo of their fridge or pantry. You identify what's visible and suggest 2-3 concrete meals they could make with those ingredients. Do not suggest buying anything. Connect to their logged signals (recovery, energy, stress) if provided.

Output strict JSON only. Keys:
- whatsVisible (string): Brief inventory grouped by category (proteins, vegetables, dairy, grains, etc.). If something is unclear, say so.
- meals (array): 2-3 objects, each with: name (string), description (string, one sentence), steps (array of strings, 2-3 brief steps), signalConnection (string, optional, one sentence connecting to today's signals).`;

function dataUrlToPart(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return null;
  const base64 = dataUrl.slice(comma + 1).trim();
  const mime = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
  return { inline_data: { mime_type: mime, data: base64 } };
}

function buildUserMessage(bodySignals) {
  const lines = ['Analyze this fridge/pantry photo. Respond with a JSON object: whatsVisible (string), meals (array of objects with name, description, steps, signalConnection).'];
  if (bodySignals && typeof bodySignals === 'object' && Object.keys(bodySignals).length > 0) {
    lines.push('', 'Body signals today (use to connect at least one meal):', JSON.stringify(bodySignals, null, 2));
  }
  lines.push('', 'Respond with only that JSON. No markdown, no code fence.');
  return lines.join('\n');
}

function parseMeal(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  const steps = Array.isArray(raw.steps)
    ? (raw.steps).filter((s) => typeof s === 'string').map((s) => String(s).trim()).filter(Boolean)
    : [];
  const signalConnection = typeof raw.signalConnection === 'string' ? raw.signalConnection.trim() : undefined;
  if (!name) return null;
  return { name, description, steps, signalConnection };
}

function parseResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') return null;
    const whatsVisible = typeof parsed.whatsVisible === 'string' ? parsed.whatsVisible.trim() : '';
    const rawMeals = Array.isArray(parsed.meals) ? parsed.meals : [];
    const meals = rawMeals.map(parseMeal).filter(Boolean);
    if (!whatsVisible && meals.length === 0) return null;
    return { whatsVisible, meals };
  } catch {
    return null;
  }
}

/**
 * Analyze one fridge photo. Returns { whatsVisible, meals } or { error }.
 */
async function computeFridgePhotoInsights(imageDataUrl, bodySignals) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return { error: 'GEMINI_API_KEY is not set.' };
  }

  const imagePart = dataUrlToPart(imageDataUrl);
  if (!imagePart) {
    return { error: 'Invalid image data.' };
  }

  const systemPrompt = getSystemPrompt();
  const systemWithJson = systemPrompt + '\n\n---\nOutput: Respond with only a JSON object. Keys: whatsVisible (string), meals (array of objects with name, description, steps array, optional signalConnection). No markdown, no code fence.';
  const userMessage = buildUserMessage(bodySignals);

  const parts = [{ text: userMessage }, imagePart];

  const body = {
    system_instruction: { parts: [{ text: systemWithJson }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
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
    return { error: message || 'Fridge photo analysis failed' };
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  const text = textPart?.text?.trim();
  if (!text) return { error: 'No response from model' };

  const parsed = parseResponse(text);
  if (!parsed) return { error: 'Invalid JSON in response' };
  return parsed;
}

module.exports = { computeFridgePhotoInsights, parseResponse };
