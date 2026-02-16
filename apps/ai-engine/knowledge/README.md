# RAG Knowledge Base — Architecture

Evidence-grounded reasoning for Nutrition, Body Signals, Stress, Sleep, Hydration, Energy, Mood, and Fridge → Recipes. The LLM composes **only** from retrieved chunks; no free association.

---

## Flow

```
User data → Pattern detection (rule-based or ML)
         → Retrieve relevant knowledge chunks (by block + pattern_tags)
         → LLM generates narrative using ONLY retrieved entries
```

The LLM is not “thinking freely.” It composes using structured domain evidence.

---

## Schema (Universal)

Every entry follows the shape in `schema.ts`:

| Field | Purpose |
|-------|--------|
| `id` | Unique key (e.g. `nutrition_meal_timing_01`) |
| `block` | Which product block this supports |
| `topic` | Human-readable domain name |
| `summary` | Evidence summary (non-diagnostic) |
| `mechanisms` | How it works (optional) |
| `observed_patterns` | Cause–effect patterns (optional) |
| `implication_logic` | “If X, then Y” for reasoning |
| `intervention_leverage` | Where to act first |
| `language_rules` | allowed / avoid phrases |
| `evidence_level` | low | moderate | high |
| `references` | Traceability only |
| `pattern_tags` | For retrieval: late_dinner, reactive_hydration, stress_sleep, etc. |

---

## Storage

- **Location:** `knowledge/entries/<block>.json` — one JSON file per block, array of entries.
- **Tagged by:** `block` + `topic` + `pattern_tags`.
- **Retrieval:** By pattern tags, signal mismatches (e.g. low sleep + high stress), or log-frequency triggers. Load `entries/<block>.json`, filter by `pattern_tags` ∩ detected patterns.

Future: vectorized embeddings over `summary` + `implication_logic` + `observed_patterns` for semantic retrieval; still filter by `block` and optionally `pattern_tags`.

---

## Retrieval Rules

1. **Pattern tags** — Rule engine outputs `pattern_type` and `drivers`. Map them to `pattern_tags` (e.g. `late_first_meal_low_energy` → `late_first_meal`, `low_energy`; `reactive_hydration` → `reactive_hydration`, `low_hydration`).
2. **Signal mismatches** — e.g. stress high + sleep low → retrieve stress_sleep and sleep_stress entries.
3. **Log frequency** — e.g. “no logs this week” → do not retrieve intervention entries; use maintenance-only copy.

Return only entries whose `pattern_tags` intersect with detected patterns. Cap at 3–5 entries per request to keep context bounded.

---

## LLM Guardrail (Critical)

Include in every prompt that uses retrieved knowledge. **Canonical text:** `apps/ai-engine/prompts/rag-guardrail.md`

> Only use the retrieved knowledge entries below. Do not introduce external claims. Use the language rules from each entry (allowed / avoid). Identify the upstream driver before suggesting an intervention.

---

## Blocks and Entry Files

| Block | File | Domains (examples) |
|-------|------|--------------------|
| Nutrition | `entries/nutrition.json` | Meal timing, hydration, fiber, glycemic load, protein adequacy, recovery |
| Sleep | `entries/sleep.json` | Duration, consistency, onset latency, stress–sleep |
| Stress | `entries/stress.json` | Evening arousal, rumination, stress–sleep, stress–digestion |
| Energy | `entries/energy.json` | Cumulative load, sleep-driven fatigue, glycemic swings |
| Mood | `entries/mood.json` | Sleep–mood, stress resilience, glucose variability |
| Hydration | `entries/hydration.json` | Cognitive energy, timing, busy-day patterns |
| Body Signals | `entries/body_signals.json` | Cross-signal loops, interpretation of notes |
| Fridge | `entries/fridge.json` | Protein completion, fiber, vegetable density, UPF (no disease claims) |

---

## Relation to Existing Nutrition Markdown

The `nutrition/` folder contains markdown SKB files (meal_timing.md, hydration.md, etc.). The canonical programmatic source is `entries/nutrition.json`. Markdown can remain as human-readable reference; new entries and updates should be added to the JSON and kept in sync with language rules and pattern_tags.
