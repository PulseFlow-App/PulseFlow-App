/**
 * Nutrition block types.
 * Fridge logging: 3 slots for best result: freezer, main compartment, veggie drawer/container.
 */

/** Single fridge photo. dataUrl for local display; photoUri when uploaded to API. Max 3 MB per image (see lib/photoLimit). */
export type FridgePhoto = {
  dataUrl: string;
  caption?: string;
  /** Set after upload to API (e.g. /users/me/photos/:id). */
  photoUri?: string;
};

/** Fridge zones for structured logging. */
export type FridgeSlot = 'freezer' | 'main' | 'veggie';

/** One fridge log entry: up to 3 photos (freezer, main, veggie) + optional notes. All optional; best result with all 3. */
export type FridgeLogEntry = {
  id: string;
  timestamp: string; // ISO
  /** Freezer compartment */
  freezer?: FridgePhoto;
  /** Main fridge compartment */
  main?: FridgePhoto;
  /** Veggie drawer / container */
  veggie?: FridgePhoto;
  /** User note: dietary needs, what they want to cook, etc. Used with Pulse context for recipe AI. */
  notes?: string;
};

/** User focus for recipe generation (single choice or unset). */
export type RecipeFocusPreference =
  | 'quick_meal'
  | 'high_protein'
  | 'low_carb'
  | 'vegetarian'
  | 'comfort_food'
  | 'meal_prep'
  | 'creative';

/** Optional constraints for recipe quality (multi). */
export type RecipeConstraint =
  | 'under_30_min'
  | 'one_pan'
  | 'no_oven'
  | 'max_5_ingredients'
  | 'high_protein'
  | 'kid_friendly'
  | 'post_workout_recovery';

/** Optional Pulse-style context for smarter suggestions (e.g. low energy → energy-supporting meals). */
export type RecipePersonalization = {
  lowEnergy?: boolean;
  heavyWorkout?: boolean;
  lateNightPlanned?: boolean;
};

// --- Nutrition Block MVP: meal timing, hydration, post-meal reflection (see docs/nutrition-block-design.md) ---

/** When the biggest meal of the day was. */
export type BiggestMeal = 'morning' | 'afternoon' | 'evening';

/** One day's meal timing (low friction: no calorie counting). */
export type MealTimingEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  /** Time of first meal (e.g. "08:30" or "08:00") */
  firstMealTime?: string;
  /** Time of last meal */
  lastMealTime?: string;
  biggestMeal?: BiggestMeal;
  lateNightEating?: boolean;
  /** Macro-free protein awareness: protein at breakfast? */
  proteinAtBreakfast?: boolean;
  /** Protein at last meal? */
  proteinAtLastMeal?: boolean;
};

/** Context when user hydrates (multi-select). */
export type HydrationContext =
  | 'before_coffee'
  | 'during_work'
  | 'around_workout'
  | 'after_alcohol'
  | 'morning'
  | 'afternoon'
  | 'evening';

/** One day's hydration timing (optional upgrade from Body hydration 1-5). */
export type HydrationTimingEntry = {
  id: string;
  date: string;
  when: HydrationContext[];
  notes?: string;
};

/** How user felt 60-90 min after eating (Food to Signal reflection loop). */
export type PostMealFeeling = 'energized' | 'heavy' | 'sleepy' | 'focused' | 'bloated';

/** Post-meal reflection: links meal timing (or time) to feeling. */
export type PostMealReflectionEntry = {
  id: string;
  timestamp: string; // ISO
  /** Optional link to meal timing entry for the day */
  date: string;
  feeling: PostMealFeeling;
  notes?: string;
};

/** Situational recovery mode (derived from Body + Work Routine; not a user log). */
export type RecoverySituation =
  | 'gym_day'
  | 'party_night'
  | 'travel_day'
  | 'deadline_day'
  | 'poor_sleep_night'
  | 'normal';

/** Stability label for nutrition (regulation support: stability vs friction). */
export type NutritionStabilityLabel =
  | 'stable'
  | 'compensating'
  | 'under_fueled'
  | 'overloaded'
  | 'recovery_needed'
  | 'no_data';

/** Situation mode for recommendation tone. */
export type NutritionSituationMode = 'maintain' | 'adjust' | 'recovery' | 'no_data';

/** Pattern type for RAG/LLM: maps to apps/ai-engine/knowledge/nutrition/*.md. */
export type NutritionPatternType =
  | 'no_data'
  | 'late_first_meal_low_energy'
  | 'reactive_hydration'
  | 'late_meal_low_sleep'
  | 'stress_low_appetite'
  | 'recovery_gym_day'
  | 'recovery_party_night'
  | 'recovery_overload'
  | 'stable';

/** Structured nutrition pattern block (Today's pattern / What connects / Smart leverage). Canonical: nutrition-regulation-system-prompt.md */
export type NutritionPatternBlock = {
  /** One short interpretation. */
  pattern: string;
  /** 2–3 causal bullet points (What connects). */
  influencing: string[];
  /** One specific, contextual adjustment (Smart leverage today). */
  oneAdjustment: string;
  stabilityLabel: NutritionStabilityLabel;
  mode: NutritionSituationMode;
  /** For RAG/LLM: which knowledge chunk(s) apply. */
  pattern_type: NutritionPatternType;
  /** Short driver tags (e.g. late_first_meal, low_energy). */
  drivers: string[];
  /** Work/life context when available (e.g. "back to back calls"). */
  context: string;
  /** For future LLM: first/last meal times today (HH:MM or empty). */
  nutrition_logs?: { firstMeal?: string; lastMeal?: string };
};
