# Nutrition -Recipe from fridge (3 photos)

Production-ready **structured multimodal prompt** for generating non-generic recipes from three fridge images: **Freezer**, **Main compartment**, **Veggie drawer**. Use with Gemini or any vision model.

**Canonical prompt (single source of truth):** `nutrition-fridge-system-prompt.md`  
**Implementation (focus, constraints, personalization):** `apps/web/src/blocks/Nutrition/prompts/recipeFromFridge.ts`

---

## Quick reference

| Item | Location |
|------|----------|
| **System prompt (full)** | `nutrition-fridge-system-prompt.md`; string in code: `RECIPE_FROM_FRIDGE_SYSTEM_PROMPT` |
| **User prompt builder** | `buildRecipeFromFridgeUserPrompt()` in Nutrition block |
| **Anti-hallucination** | Baked into system prompt; also `ANTI_HALLUCINATION_INSTRUCTION` for user prompt if needed |
| **Ingredient grouping** | Baked into system prompt (required reasoning step); also `INGREDIENT_GROUPING_INSTRUCTION` |
| **Focus / constraint options** | `RECIPE_FOCUS_OPTIONS`, `RECIPE_CONSTRAINT_OPTIONS` |
| **Pulse-style personalization** | `RecipePersonalization` (lowEnergy, heavyWorkout, lateNightPlanned) passed to builder |

---

## Output structure (enforced in system prompt)

1. **Ingredient Summary** -What you see, by compartment; mark uncertain as "possibly X".
2. **Recipe Options** -2–4 options, short step-based instructions; note which compartment each ingredient is from.
3. **Why These Work** -Brief: waste-minimizing, uses what's there, fits constraints if any.
4. **Optional Add-ons** -Only if user has basics; e.g. "If you have garlic and olive oil…".

---

## Constraints (improve recipe quality)

Expose in UI and append to user prompt when selected: Cooking time under 30 min; One-pan only; No oven; Max 5 ingredients; High-protein; Kid-friendly; Post-workout recovery meal.

---

## Pulse-style personalization (optional)

If user logs are available, add to user prompt (no medical claims):

- Low energy → energy-supporting meals.
- Heavy workout logged → recovery-oriented meals.
- Late night planned → lighter, digestion-friendly meals.
