/**
 * Structured multimodal prompt for recipe generation from 3 fridge photos.
 * Use with Gemini (or any vision model). Reduces hallucination via strict rules and optional constraints.
 */
import type { RecipeConstraint, RecipeFocusPreference, RecipePersonalization, RecoverySituation } from '../types';

/**
 * System prompt: recipe generator from 3 fridge photos.
 * Canonical source: apps/ai-engine/prompts/nutrition-fridge-system-prompt.md
 * Anti-hallucination and ingredient grouping are baked in so the model always reasons from what it sees.
 */
export const RECIPE_FROM_FRIDGE_SYSTEM_PROMPT = `You are a practical home cook assistant.
Your task is to generate realistic recipes strictly based on visible ingredients from three uploaded images:

1. Freezer
2. Main fridge compartment
3. Vegetable drawer

Rules:

* Only use ingredients clearly visible in the photos.
* If unsure about an item, label it as "possibly" and ask for confirmation.
* Do not invent pantry items unless explicitly allowed.
* Assume basic kitchen staples only if user confirms (salt, oil, pepper).
* Prioritize minimizing waste.
* Prefer simple, efficient recipes.
* Suggest 2–4 recipe options max.
* Keep instructions concise and step-based.
* Highlight which ingredients from which compartment are used.

If ingredients are insufficient for full meals, suggest combinations, snacks, or prep ideas.

Anti-hallucination: If you cannot clearly identify items in the image, ask clarifying questions before generating recipes. Do not guess.

Reasoning step (required): Group ingredients into proteins, vegetables, sauces, frozen items, and leftovers before suggesting recipes. Base suggestions only on what you actually see.

Always structure output as:

1. Ingredient Summary (what you see, by compartment; mark uncertain items as "possibly X")
2. Recipe Options (2–4 options, short step-based instructions; note which compartment each ingredient comes from)
3. Why These Work (brief: waste-minimizing, uses what's there, fits constraints if any)
4. Optional Add-ons (only if user indicated they have basics)

Recipes are for inspiration and home cooking only. Not medical or nutritional advice.`;

/** Anti-hallucination: ask before guessing. */
export const ANTI_HALLUCINATION_INSTRUCTION = `If you cannot clearly identify items in the image, ask clarifying questions before generating recipes.`;

/** Forces reasoning over guessing: group before suggesting. */
export const INGREDIENT_GROUPING_INSTRUCTION = `Group ingredients into proteins, vegetables, sauces, frozen items, and leftovers before suggesting recipes.`;

/** Focus preference labels for UI. */
export const RECIPE_FOCUS_OPTIONS: { value: RecipeFocusPreference; label: string }[] = [
  { value: 'quick_meal', label: 'Quick meal' },
  { value: 'high_protein', label: 'High protein' },
  { value: 'low_carb', label: 'Low carb' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'comfort_food', label: 'Comfort food' },
  { value: 'meal_prep', label: 'Meal prep' },
  { value: 'creative', label: 'Something creative' },
];

/** Constraint labels for advanced mode. */
export const RECIPE_CONSTRAINT_OPTIONS: { value: RecipeConstraint; label: string }[] = [
  { value: 'under_30_min', label: 'Cooking time under 30 min' },
  { value: 'one_pan', label: 'One-pan only' },
  { value: 'no_oven', label: 'No oven' },
  { value: 'max_5_ingredients', label: 'Max 5 ingredients' },
  { value: 'high_protein', label: 'High-protein' },
  { value: 'kid_friendly', label: 'Kid-friendly' },
  { value: 'post_workout_recovery', label: 'Post-workout recovery meal' },
];

export type BuildRecipeUserPromptOptions = {
  /** User has basic staples (salt, oil, pepper). */
  hasStaples: boolean;
  /** Optional extra staples to mention (e.g. "garlic, soy sauce"). */
  staplesNote?: string;
  /** Single focus preference. */
  focusPreference?: RecipeFocusPreference;
  /** Optional constraints for better output. */
  constraints?: RecipeConstraint[];
  /** Optional Pulse-style context. */
  personalization?: RecipePersonalization;
  /** Optional recovery situation (from getRecoverySituation()). */
  recoverySituation?: RecoverySituation;
  /** If true, include ingredient-grouping instruction. */
  useIngredientGrouping?: boolean;
  /** If true, include anti-hallucination instruction. */
  useAntiHallucination?: boolean;
};

/**
 * Build the user prompt for recipe-from-fridge. Image labels are fixed (Image 1: Freezer, etc.).
 * Caller sends this text plus the 3 images to the vision model.
 */
export function buildRecipeFromFridgeUserPrompt(options: BuildRecipeUserPromptOptions): string {
  const {
    hasStaples,
    staplesNote,
    focusPreference,
    constraints = [],
    personalization,
    recoverySituation,
    useIngredientGrouping = true,
    useAntiHallucination = true,
  } = options;

  const staplesLine = hasStaples
    ? `I have basic staples: yes${staplesNote ? ` — ${staplesNote}` : ''}.`
    : 'I have basic staples: no.';

  const focusLine = focusPreference
    ? `Focus preference: ${RECIPE_FOCUS_OPTIONS.find((o) => o.value === focusPreference)?.label ?? focusPreference}`
    : 'Focus preference: (any)';

  const constraintBlock =
    constraints.length > 0
      ? `\nConstraints: ${constraints.map((c) => RECIPE_CONSTRAINT_OPTIONS.find((o) => o.value === c)?.label ?? c).join('; ')}.`
      : '';

  const personalizationBlock = personalization && (personalization.lowEnergy || personalization.heavyWorkout || personalization.lateNightPlanned)
    ? [
        personalization.lowEnergy && 'User logs suggest low energy — suggest energy-supporting meals.',
        personalization.heavyWorkout && 'Heavy workout logged — suggest recovery-oriented meals.',
        personalization.lateNightPlanned && 'Late night planned — suggest lighter, digestion-friendly meals.',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  const recoveryLabels: Record<RecoverySituation, string> = {
    gym_day: 'Gym / workout day — recovery-focused meals.',
    party_night: 'Party / going out — light before, hydrate; gentle next day.',
    travel_day: 'Travel day — easy meals and hydration on the go.',
    deadline_day: 'Deadline / big day — steady energy with regular small meals.',
    poor_sleep_night: 'Poor sleep last night — lighter meals may help tonight.',
    normal: 'Normal day.',
  };
  const recoveryBlock = recoverySituation && recoverySituation !== 'normal'
    ? `Today's context: ${recoveryLabels[recoverySituation]}`
    : '';

  const parts = [
    `You will receive 3 images:`,
    `Image 1: Freezer`,
    `Image 2: Main fridge`,
    `Image 3: Veggie drawer`,
    ``,
    `Goal: Create realistic meal ideas using what you see.`,
    `Avoid generic recipes. Base everything on the photos.`,
    ``,
    staplesLine,
    ``,
    focusLine,
    constraintBlock,
    personalizationBlock ? `\n${personalizationBlock}` : '',
    recoveryBlock ? `\n${recoveryBlock}` : '',
    ``,
    `Now analyze the images and suggest recipes.`,
  ];

  if (useIngredientGrouping) {
    parts.push('', INGREDIENT_GROUPING_INSTRUCTION);
  }
  if (useAntiHallucination) {
    parts.push('', ANTI_HALLUCINATION_INSTRUCTION);
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
