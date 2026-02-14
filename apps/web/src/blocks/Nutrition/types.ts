/**
 * Nutrition block types.
 * Fridge logging: 3 slots for best result — freezer, main compartment, veggie drawer/container.
 */

/** Single fridge photo. dataUrl for local display; photoUri when uploaded to API. Max 2 MB per image (see lib/photoLimit). */
export type FridgePhoto = {
  dataUrl: string;
  caption?: string;
  /** Set after upload to API (e.g. /users/me/photos/:id). */
  photoUri?: string;
};

/** Fridge zones for structured logging. */
export type FridgeSlot = 'freezer' | 'main' | 'veggie';

/** One fridge log entry: up to 3 photos (freezer, main, veggie). All optional; best result with all 3. */
export type FridgeLogEntry = {
  id: string;
  timestamp: string; // ISO
  /** Freezer compartment */
  freezer?: FridgePhoto;
  /** Main fridge compartment */
  main?: FridgePhoto;
  /** Veggie drawer / container */
  veggie?: FridgePhoto;
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
