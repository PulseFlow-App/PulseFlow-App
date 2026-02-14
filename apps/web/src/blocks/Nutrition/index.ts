/**
 * Nutrition block: fridge, meal timing, post-meal reflection, recovery situation.
 * See docs/nutrition-block-design.md for full design (Pulse-connected, non-generic).
 */
export * from './types';
export * from './store';
export * from './mealTimingStore';
export * from './postMealReflectionStore';
export * from './hydrationTimingStore';
export * from './prompts/recipeFromFridge';
export { getNutritionPatternInsights } from './patternInsights';
export { getPulseContextForRecipes } from './pulseContextForRecipes';
export { getRecoverySituation } from './recoverySituation';
export { RecoveryContextCard } from './RecoveryContextCard';
export { NutritionOverview } from './NutritionOverview';
export { NutritionFridgeLog } from './NutritionFridgeLog';
export { NutritionMealTiming } from './NutritionMealTiming';
export { NutritionPostMealReflection } from './NutritionPostMealReflection';
export { NutritionHydrationTiming } from './NutritionHydrationTiming';
