/**
 * Recipe-from-fridge: call Gemini (or vision model) with 3 fridge images.
 * Requires GEMINI_API_KEY. Returns markdown-style ingredient summary + recipes.
 */
const RECIPE_SYSTEM_PROMPT = `You are a practical home cook assistant.
Your task is to generate realistic recipes strictly based on visible ingredients from three uploaded images:

1. Freezer
2. Main fridge compartment
3. Vegetable drawer

Rules:
* Only use ingredients clearly visible in the photos.
* If unsure about an item, label it as "possibly" and ask for confirmation.
* Do not invent pantry items unless explicitly allowed. Assume basic kitchen staples only (salt, oil, pepper) if user confirms.
* Prioritize minimizing waste. Prefer simple, efficient recipes.
* Suggest 2-4 recipe options max. Keep instructions concise and step-based.
* Highlight which ingredients from which compartment are used.

If ingredients are insufficient for full meals, suggest combinations, snacks, or prep ideas.

Anti-hallucination: If you cannot clearly identify items in the image, ask clarifying questions before generating recipes. Do not guess.

Reasoning step (required): Group ingredients into proteins, vegetables, sauces, frozen items, and leftovers before suggesting recipes. Base suggestions only on what you actually see.

Always structure output as:
1. Ingredient Summary (what you see, by compartment; mark uncertain items as "possibly X")
2. Recipe Options (2-4 options, short step-based instructions; note which compartment each ingredient comes from)
3. Why These Work (brief: waste-minimizing, uses what's there)
4. Optional Add-ons (only if user indicated they have basics)

Recipes are for inspiration and home cooking only. Not medical or nutritional advice.`;

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function dataUrlToPart(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return null;
  const base64 = dataUrl.slice(comma + 1).trim();
  const mime = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
  return { inline_data: { mime_type: mime, data: base64 } };
}

function buildUserPrompt(notes) {
  const lines = [
    'You will receive up to 3 images: Image 1 = Freezer, Image 2 = Main fridge, Image 3 = Veggie drawer.',
    'Goal: Create realistic meal ideas using what you see. Avoid generic recipes. Base everything on the photos.',
    'I have basic staples: yes (salt, oil, pepper).',
  ];
  if (notes && notes.trim()) {
    lines.push('', 'User note: ' + notes.trim());
  }
  lines.push('', 'Now analyze the images and suggest recipes.');
  return lines.join('\n');
}

/**
 * Call Gemini with images + prompt. Returns { text } or { error }.
 */
async function callGemini(images, notes) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return { error: 'GEMINI_API_KEY is not set. Set it in the API environment to enable recipe ideas from fridge photos.' };
  }

  const parts = [{ text: buildUserPrompt(notes) }];
  const order = ['Image 1: Freezer', 'Image 2: Main fridge', 'Image 3: Veggie drawer'];
  for (let i = 0; i < Math.min(3, images.length); i++) {
    const part = dataUrlToPart(images[i]);
    if (part) parts.push(part);
  }

  const body = {
    system_instruction: { parts: [{ text: RECIPE_SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.4,
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
    return { error: message || 'Vision API request failed' };
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
  const text = textPart?.text?.trim();
  if (!text) return { error: 'No recipe text in response' };
  return { text };
}

module.exports = { callGemini, buildUserPrompt };