# PulseFlow — Complete AI Prompt System
`apps/ai-engine/prompts/`

This directory defines all four prompts in the PulseFlow AI pipeline:

1. **body-signals-system-prompt.md** — Block 1
2. **work-routine-system-prompt.md** — Block 2
3. **nutrition-system-prompt.md** — Block 3
4. **pulse-aggregation-prompt.md** — Final synthesis

Each block prompt produces a **self-contained insight** for its own screen, plus a structured `aggregation_handoff` object the Pulse page consumes. The aggregation prompt receives all available handoffs and produces one unified view.

---

## Flow Logic

```
User logs Block 1 (Body)
  → body-signals-system-prompt runs
  → Output renders on Body Signals screen
  → "Complete your Pulse → Log Work Routine" CTA appears

User logs Block 2 (Work)
  → work-routine-system-prompt runs
  → Output renders on Work Routine screen
  → pulse-aggregation-prompt runs with Body + Work handoffs
  → Pulse page shows combined synthesis (Body + Work)
  → "Add Nutrition for a fuller picture → Log Nutrition" CTA appears

User logs Block 3 (Nutrition)
  → nutrition-system-prompt runs
  → Output renders on Nutrition screen
  → pulse-aggregation-prompt runs with all three handoffs
  → Pulse page shows full synthesis (Body + Work + Nutrition)
  → No further CTA — Pulse is complete
```

The Pulse page **never renders block outputs side by side.** It only ever shows the aggregation layer's unified output.

---

## File structure

```
apps/ai-engine/prompts/
  body-signals-system-prompt.md     ← Prompt 1
  work-routine-system-prompt.md     ← Prompt 2
  nutrition-system-prompt.md        ← Prompt 3
  pulse-aggregation-prompt.md       ← Prompt 4
```

---

## Rendering rules (frontend)

- Each block screen renders its own block output only (three-section format).
- The Pulse page renders **only** aggregation output — never individual block outputs.
- CTAs are appended by the AI output, not hardcoded in the UI (so the prompt controls the flow).
- "From Body Signals" / "From Work Routine" section labels must be removed from Pulse page UI.

---

## Call sequence

```
Block logged → block prompt called → block output stored
                                   → aggregation_handoff stored

If blocks_logged.length >= 2:
  → pulse-aggregation-prompt called with all available handoffs
  → Pulse page updated with new aggregation output
```

---

## Prompt consistency rules

All four prompts share:

- Same three-section block output format: **Today's pattern** / **What's shaping** / **One thing to observe**
- Same language rules: observational, causal, no prescriptive language
- Same quality checklist structure
- Same JSON handoff contract shape: `block`, `primary_driver`, `key_signals`, `cross_block_flags`, `experiment`, `confidence`

When editing one prompt, check all four for consistency.
