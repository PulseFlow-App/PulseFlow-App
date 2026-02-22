# Can We Deliver User-Story Quality AI Recommendations?

Short answer: **yes**, with the same API + LLM pipeline. It’s not a different “agent” or “bot” — it’s the right prompts, payload shape, and flow. The user stories (Maya, James, Sofia) are the spec; the four-prompt system is designed to hit that bar.

---

## What the user stories assume

1. **Block prompts** get **full context** when available (e.g. body sees body + work + nutrition so it can reference “lunch at 1:45 during meetings”).
2. Each block returns an **aggregation_handoff** (primary_driver, key_signals, cross_block_flags, experiment, confidence).
3. When **2+ blocks** are logged, a **separate aggregation step** runs: it receives all handoffs + raw data, runs `pulse-aggregation-prompt`, and produces one synthesis (What’s connecting, What’s driving your Pulse, Prioritized recommendations, Tomorrow’s signal).
4. The **Pulse page** shows **only** that aggregation output when 2+ blocks are logged (no “From Body” / “From Work” side-by-side). With 1 block, it shows that block’s output.

---

## Current state vs target

| Piece | Current | Target (user-story quality) |
|-------|---------|-----------------------------|
| **Body block** | Rule-based in `api/src/insights/bodySignals.js`. No LLM; returns insight, explanation, improvements, factors. | Run **LLM** with `body-signals-system-prompt.md` and **full payload** (body + work + nutrition when available). Return todays_pattern, pulse_drivers, experiment, aggregation_handoff. |
| **Work block** | **LLM** with `work-routine-system-prompt.md`; gets work + body. Returns pattern, shaping, oneThing. | Keep LLM. Ensure it receives **nutrition** when logged. Add **aggregation_handoff** to response and persist it. |
| **Nutrition block** | LLM in `computeNutritionInsights`; likely gets nutrition (+ body/work?). | Ensure **body + work handoffs** (or raw) when available. Return aggregation_handoff. |
| **Aggregation** | **None.** Pulse page stitches body narrative + optional work pattern + one “one thing to try” from body or work. Daily **report** (PDF) compiles block data via `daily-report-system-prompt` but does not do cross-block synthesis from handoffs. | **New step:** When blocks_logged ≥ 2, call **aggregation endpoint** with handoffs + raw. Run `pulse-aggregation-prompt.md`. Return what_connects, pulse_drivers, recommendations, tomorrow_signal, pulse_score_framing. Store per user per day. |
| **Pulse page** | Renders bodySnapshot.insight, bodySnapshot.explanation, bodySnapshot.improvements[0], and optionally routineEntry.analysis (pattern, shaping, oneThing). No single “What’s connecting today” narrative; no prioritized list of 2 recommendations; no “Tomorrow’s signal to watch.” | When 2+ blocks: **fetch aggregation result** and render only that (What’s connecting today, What’s driving your Pulse score, Prioritized recommendations, Tomorrow’s signal). When 1 block: show that block’s output. |

---

## What to build (no new “agent” product)

1. **Body insights via LLM (optional but recommended)**  
   - Add a path (e.g. when `GEMINI_API_KEY` is set) that calls Gemini with `body-signals-system-prompt.md` and the **full daily payload** (body + work + nutrition).  
   - Parse response into todays_pattern, pulse_drivers, experiment, aggregation_handoff.  
   - Map to current web shape (insight, explanation, improvements) for backward compatibility, and **store handoff** for aggregation.

2. **Work & nutrition**  
   - Already LLM-driven. Ensure they receive full context (work gets body + nutrition when available; nutrition gets body + work).  
   - Ensure each returns and **stores** an aggregation_handoff (primary_driver, key_signals, cross_block_flags, experiment, confidence).

3. **Aggregation endpoint**  
   - e.g. `POST /insights/pulse-aggregation` or `POST /report/pulse-synthesis`.  
   - Input: mode (two_block | three_block), handoffs (body, work, nutrition), raw block data, optional history.  
   - Call Gemini with `pulse-aggregation-prompt.md`; parse and return what_connects, pulse_drivers, recommendations, tomorrow_signal, pulse_score_framing, cta.  
   - **When to call:** After user saves a block, if blocks_logged ≥ 2, run aggregation and store result (e.g. by user + date).

4. **Pulse page**  
   - When 2+ blocks: request aggregation result for today; if present, render it as the single narrative (four sections).  
   - When 1 block: keep current behavior (that block’s output).  
   - Remove any “From Body Signals” / “From Work Routine” section labels; one story only.

5. **Quality and evals**  
   - Use `user-stories-golden-data.md` (Maya, James, Sofia) as **golden payloads**.  
   - Run body, work, nutrition, and aggregation with those inputs; compare output to the “Pulse should surface” text.  
   - Iterate on prompts (or add few-shot examples) until output matches the intended quality.

---

## Summary

- **Can we provide AI recommendations that well?** Yes. The prompts are written to produce Maya/James/Sofia-level synthesis and recommendations.
- **Is it an “AI agent” or “proper bot” job?** No. It’s the same API + LLM: the right prompts, full context per block, a dedicated aggregation call with handoffs, and the Pulse page showing only aggregation when 2+ blocks are logged.
- **Gaps today:** Body is rule-based (no LLM); no aggregation step; Pulse page composes block outputs instead of showing one synthesis. Closing those gaps gets you to user-story quality without a new product or architecture.
