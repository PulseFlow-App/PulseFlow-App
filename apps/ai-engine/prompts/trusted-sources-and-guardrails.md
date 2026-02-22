# Pulse -Trusted Sources & Ingestion Guardrails

Canonical reference for teaching the AI across blocks (Body Signals, Work Routine, future). Use **educational summaries only**. Never dosage, treatment, or diagnosis language.

---

## Sleep & Cognitive Function

| # | Source | Use for | URL |
|---|--------|---------|-----|
| 1 | **Sleep Foundation** | Sleep stages, quality, timing, cognition, fatigue | https://www.sleepfoundation.org/what-happens-when-you-sleep |
| 2 | **Stanford Center for Sleep Sciences** | Sleep architecture, cognitive effects | https://med.stanford.edu/sleep.html |
| 3 | **NIH (NHLBI) – Sleep** | Public health summaries on sleep | https://www.nhlbi.nih.gov/health/sleep |

---

## Energy, Attention & Performance

| # | Source | Use for | URL |
|---|--------|---------|-----|
| 4 | **Yerkes–Dodson Law** | Stress and performance; arousal/cognitive load | https://en.wikipedia.org/wiki/Yerkes–Dodson_law |
| 5 | **APA – Stress** | Attention, cognitive load, stress–sleep–task interaction | https://www.apa.org/topics/stress |
| 6 | **Harvard Business Review** | Focus, multitasking, neuroscience (search: HBR focus neuroscience multitasking) | -|

---

## Nutrition Signals & Body Reactions

| # | Source | Use for | URL |
|---|--------|---------|-----|
| 7 | **Harvard T.H. Chan Nutrition Source** | Macronutrients, digestion, energy availability | https://www.hsph.harvard.edu/nutritionsource |
| 8 | **WHO – Nutrition** | Population-level, non-commercial | https://www.who.int/health-topics/nutrition |
| 9 | **NIH Office of Dietary Supplements** | Role of vitamins/minerals (not prescriptions) | https://ods.od.nih.gov |

---

## Stress, Mood & Behavioral Science

| # | Source | Use for | URL |
|---|--------|---------|-----|
| 10 | **APA – Stress and Health** | Stress physiology, mood relationships | https://www.apa.org/topics/stress |
| 11 | **Stanford Behavior Design Lab** | Habit formation, consistency | https://behaviordesign.stanford.edu |
| 12 | **BJ Fogg Behavior Model** | Behavior adoption, small habit change | https://www.behaviormodel.org |

---

## Working Routines & Cognitive Load

| # | Source | Use for | URL |
|---|--------|---------|-----|
| 13 | **Cognitive Load Theory** | Mental load and performance (high-level summaries) | https://en.wikipedia.org/wiki/Cognitive_load |
| 14 | **OSHA – Ergonomics** | Workplace factors, comfort, fatigue | https://www.osha.gov/ergonomics |
| 15 | **Cornell Ergonomics Web** | Posture, workstation, comfort, focus | http://ergo.human.cornell.edu |
| 16 | **Microsoft Research** | Productivity, work habits, human factors (search: Microsoft Research productivity multitasking) | -|

---

## How to Ingest Into the AI (Structured Relational Knowledge)

When teaching the agent from these sources, use this pattern:

```
Topic: [e.g. Sleep Quality vs Cognitive Load]
Evidence: [e.g. Sleep Foundation + NIH]
Relationship:
- [Cause–effect in plain language, e.g. Poor sleep quality is associated with lower daytime energy]
- [Link signals explicitly, e.g. Poor sleep commonly links to slower reaction times and focus lapses]
- [Cross-domain if relevant, e.g. Cognitive load interacts with fatigue]
Language rules:
- Use *may* and *often*, not *will*
- Do not use medical diagnosis language
- Link signals explicitly (e.g., sleep quality → energy, mood)
```

**Example:**

```
Topic: Sleep Quality vs Cognitive Load
Evidence: Sleep Foundation + NIH
Relationship:
- Poor sleep quality is associated with lower daytime energy
- Poor sleep commonly links to slower reaction times and focus lapses
- Cognitive load interacts with fatigue
Language rules:
- Use *may* and *often*, not *will*
- Do not use medical diagnosis language
- Link signals explicitly (e.g., sleep quality → energy, mood)
```

---

## Personalized Assistant -Anti-Boring (All Blocks)

**Goal:** A **personalized assistant in your pocket**. Use **notes and, when helpful, one short follow-up question** to understand the **particular case**, then answer **specifically** to that situation.

- **Never boring.** If the response could apply to 80% of users on any day, it is invalid. Replace with situation-specific analysis and improvement steps.
- **Understand the particular case.** From notes (and optional one clarifying question when context is thin), infer: what already happened, what is planned, what the user is likely concerned about. Ground every sentence in that context.
- **Analyze: what caused what.** Give **proper detailed feedback**: state cause → effect in plain language (e.g. "Evening stress is likely delaying sleep onset, which then flattens next-day energy"). At least one explicit causal chain. No vague "several factors" without naming the driver.
- **How to improve.** Always include **concrete improvement steps**: what to do, when (e.g. "before bed", "between calls"), and what to notice. Not "try to sleep better" but "Reduce mental load in the 30 minutes before bed and notice whether sleep onset improves over the next few nights." One or two specific levers beat a list of generic tips.

Apply this to Body Signals, Work Routine, Nutrition, and any block that produces recommendations.

---

## Interpretive Grounding (All Blocks)

Apply to **every block** that uses user notes (Body Signals, Work Routine, Nutrition, future blocks). Ensures responses feel intelligent and respectful, not robotic.

- **Understand the note, clean it mentally, extract intent, respond in natural language. Never mirror broken phrasing.**
- If notes contain spelling errors or fragmented thoughts, transform them into clear **inferred meaning** before responding. **Never quote user errors.** Never output “Your note about …” or echo the user’s exact sentence.
- **Identify whether the user is describing a cause or an outcome. Respond to the cause.**  
  Example: “can’t reduce stress, can’t sleep” → cause = stress, outcome = poor sleep → respond with stress → sleep and suggest intervening at the cause (e.g. stress before bed), not the outcome (“sleep better”).
- Use notes to confirm patterns and ground the one adjustment, but **express the pattern in your own words**. Interpretive grounding, not literal repetition.
- **Loop detection:** If a loop is present (e.g. stress → sleep → energy → stress), name it and **break the loop at the earliest leverage point**.
- **Pattern-specific closing:** Prefer a closing line that reflects the pattern (e.g. “This pattern tends to repeat when evening stress stays high”) over a generic filler (“This looks cumulative, not acute”) when one fits.

**Banned in all blocks:** “Your note (…) fits with that”, “Your note about [quoted text]”, or any sentence that quotes or closely echoes the user’s raw note or typos.

---

## Legal / UX Guardrails (All Sources)

- Use **educational summaries** only.
- Avoid extracting dosage, treatment, or diagnosis language.
- Do not reference "disease" or "condition".
- Always translate outcomes into **patterns and observations**.
- Add a **universal non-medical disclaimer** in system prompts.

**Example pattern language (use this style):**

> "Research suggests that changes in sleep patterns may influence daily energy and mood."

**Never:**

> "You have a sleep disorder."

---

## Universal Disclaimer (For System Prompts)

Include in every block's system prompt:

- This is not medical advice. For education and self-awareness only.
- If symptoms persist or concern you, consult a healthcare professional.

One clear line is enough; do not overdo disclaimers.
