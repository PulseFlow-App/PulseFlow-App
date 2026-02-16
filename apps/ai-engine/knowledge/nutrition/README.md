# Nutrition — Structured Knowledge Base (SKB)

This folder contains **structured knowledge entries** for the Nutrition block. Use for RAG retrieval or as context when calling an LLM. The rule engine remains the **decision layer**; the LLM adds **interpretation depth** within these constraints.

## Purpose

- Ground model reasoning in evidence summaries (not raw papers or web search).
- Enforce allowed/disallowed language to avoid medical liability.
- Support mechanism-based output: explain *why* (relationships), not generic advice.

## Architecture

```
Signals → Rule engine detects pattern (pattern_type, drivers, context)
       → Optional: retrieve relevant SKB chunks by pattern_type
       → LLM adds interpretation (narrative, causal depth) within SKB + prompt constraints
       → Never override core logic; never add medical/supplement/fasting/detox advice
```

## Files

| File | Domain | Use when |
|------|--------|----------|
| `meal_timing.md` | Meal timing & circadian rhythm | late_meal, late_first_meal, irregular_timing, sleep_meal |
| `hydration.md` | Hydration & cognitive performance | reactive_hydration, busy_day_low_hydration, dehydration_fatigue |
| `stress_digestion.md` | Stress & appetite/digestion | stress_appetite, stress_digestion, high_stress |
| `recovery.md` | Recovery nutrition (workout, travel, overload) | gym_day, party_night, travel_day, poor_sleep |
| `protein_energy.md` | Protein & energy stability (macro-light) | under_fueled, appetite_swings, satiety |

## Format (each .md)

- **Topic** — Domain name.
- **Evidence summary** — Short, non-diagnostic summary of relationships (for model context).
- **Relationships** — Bullet cause–effect links (e.g. late first meal → afternoon energy dip).
- **Allowed language** — "may contribute", "often associated with", "can influence".
- **Disallowed** — Disease claims, diagnosis, treatment, dosing, calorie targets, fasting protocols, detox.

## Sources (traceability)

See each file’s **Sources** section. Do not dump full text of papers into the model; use the structured summaries in these files. URLs are for human review and updates.
