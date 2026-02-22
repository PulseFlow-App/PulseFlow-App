/**
 * Meal Photo AI: analyze one meal image with optional body signals context.
 * Uses meal-photo-system-prompt.md. Returns whatsOnPlate, approximateNutrition, oneSuggestion.
 */
const path = require('path');
const fs = require('fs');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../../../../ai-engine/prompts/meal-photo-system-prompt.md');

function getSystemPrompt() {
  try {
    return fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
  } catch {
    return FALLBACK_SYSTEM_PROMPT;
  }
}

const FALLBACK_SYSTEM_PROMPT = `You are the Meal Photo AI inside PulseFlow. When a user submits a photo of their meal, you do three things: acknowledge what they ate honestly, estimate approximate nutritional value in ranges, and offer one concrete, non-judgmental suggestion (or say the meal is well-balanced). You are not a dietitian. Use body signals when provided to contextualize.

Output strict JSON only, no other text. Keys:
- whatsOnPlate (string): One sentence describing what you see.
- approximateNutrition (string): One short paragraph with calorie and macro ranges; include "Photo estimates have a meaningful margin - this is an approximation."
- oneSuggestion (string): One paragraph - either a positive acknowledgment if balanced, or one observation if there is a relevant gap. Connect to logged signals if available.`;

function dataUrlToPart(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return null;
  const base64 = dataUrl.slice(comma + 1).trim();
  const mime = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
  return { inline_data: { mime_type: mime, data: base64 } };
}

function buildUserMessage(bodySignals) {
  const lines = ['Analyze this meal photo and respond with exactly three sections as JSON.'];
  if (bodySignals && typeof bodySignals === 'object' && Object.keys(bodySignals).length > 0) {
    lines.push('', 'The user has logged body signals today; use them to contextualize your response:', JSON.stringify(bodySignals, null, 2));
  }
  lines.push('', 'Respond with only a JSON object with keys: whatsOnPlate (string), approximateNutrition (string), oneSuggestion (string). No markdown, no code fence.');
  return lines.join('\n');
}

function parseResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') return null;
    const whatsOnPlate = typeof parsed.whatsOnPlate === 'string' ? parsed.whatsOnPlate.trim() : '';
    const approximateNutrition = typeof parsed.approximateNutrition === 'string' ? parsed.approximateNutrition.trim() : '';
    const oneSuggestion = typeof parsed.oneSuggestion === 'string' ? parsed.oneSuggestion.trim() : '';
    if (!whatsOnPlate && !approximateNutrition && !oneSuggestion) return null;
    return { whatsOnPlate, approximateNutrition, oneSuggestion };
  } catch {
    return null;
  }
}

/**
 * Analyze one meal photo. Returns { whatsOnPlate, approximateNutrition, oneSuggestion } or { error }.
 */
async function computeMealPhotoInsights(imageDataUrl, bodySignals) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return { error: 'GEMINI_API_KEY is not set.' };
  }

  const imagePart = dataUrlToPart(imageDataUrl);
  if (!imagePart) {
    return { error: 'Invalid image data.' };
  }

  const systemPrompt = getSystemPrompt();
  const systemWithJson = systemPrompt + '\n\n---\nOutput: Respond with only a JSON object. Keys: whatsOnPlate (string), approximateNutrition (string), oneSuggestion (string). No markdown, no code fence.';
  const userMessage = buildUserMessage(bodySignals);

  const parts = [{ text: userMessage }, imagePart];

  const body = {
    system_instruction: { parts: [{ text: systemWithJson }] },
    contents: [{ role: 'user', parts }],
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
    return { error: message || 'Meal photo analysis failed' };
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  const text = textPart?.text?.trim();
  if (!text) return { error: 'No response from model' };

  const parsed = parseResponse(text);
  if (!parsed) return { error: 'Invalid JSON in response' };
  return parsed;
}

module.exports = { computeMealPhotoInsights, parseResponse };
