# PulseFlow — User Stories & Golden Data
`apps/ai-engine/prompts/user-stories-golden-data.md`

Three archetypes that define the range of cross-block reasoning we want. Use for prompt tuning, evals, and screenshot/demo flows.

---

## Archetypes

| User | Archetype | What the AI must show |
|------|-----------|------------------------|
| **Maya** | "I feel fine but I'm not" | Hidden structural problem: 3pm wall is morning meetings + late lunch + no recovery, not "more sleep" |
| **James** | "I know something's off but I don't know what" | Root is cortisol loop across all three blocks; reframe from "deadline stress" to meal timing + work structure |
| **Sofia** | "I'm trying hard but it's not working" | Reframe: effort is there but recovery quality isn't (sleep quality 2, breaks not real recovery); CTA to add Nutrition |

---

## User 1 — Maya (Product Manager)

**Story:** Thinks she's having a normal week. Energy feels fine. Can't figure out why afternoons fall apart.

### Log this

**Body:** Sleep 6.5h, quality 3, Energy 4, Mood 3, Hydration 3, Stress 3, Appetite 4, Digestion 3. Note: *"Feeling okay but afternoons feel heavy, like I hit a wall around 3pm every day"*

**Work:** Start 8:30, end 6:30, Breaks 1, Break quality 2, Focus 3, Mental load 4, Meetings 6. Note: *"Back to back meetings most of the morning, tried to do deep work after but couldn't really focus"*

**Nutrition:** Meals 7:15, 1:45, 7:30. Notes: *"Coffee and toast in the morning, big lunch at desk during a meeting, dinner was fine"*. Hydration: *"2 coffees, water bottle but didn't finish it"*. Note: *"Ate lunch late because meetings ran over"*

### Pulse should surface

- **Synthesis:** Six morning meetings with no real break + lunch at 1:45 (5h unfueled during peak load) + eating at desk in stress state → 3pm wall is the predictable endpoint; one problem (demand outpaced recovery from the first hour), not three.
- **Recommendations:** (1) Move lunch before 1pm, away from screen on heavy-meeting days; (2) One 20-minute gap in the morning, no task; watch 3pm energy.

---

## User 2 — James (Freelance Designer)

**Story:** Knows he's not okay. Exhausted on waking, mood low, can't train. Assumes deadline stress. AI finds the real root.

### Log this

**Body:** Sleep 5h, quality 2, Energy 4, Mood 2, Hydration 2, Stress 4, Appetite 4, Digestion 2. Note: *"I can't push myself to train, feel exhausted as soon as I wake up"*

**Work:** Start 10:00, end 23:30, Breaks 0, Break quality 1, Focus 2, Mental load 5, Meetings 1. Note: *"Deadline project, worked straight through, couldn't get into a flow, kept getting distracted"*

**Nutrition:** Meals 13:00, 21:30. Notes: *"Skipped breakfast, grabbed food when I remembered, ate dinner late while still working"*. Hydration: *"3 coffees, some water, not much"*. Note: *"Not really thinking about food, just eating when I notice I'm hungry"*

### Pulse should surface

- **Synthesis:** Sleep fragmentation + 13.5h work with no breaks + no food until 1pm (with 3 coffees) = one sustained cortisol state. Training avoidance isn't motivation — body has no resources. Energy 4 vs "exhausted on waking" = cortisol-driven dissociation (name it).
- **Recommendations:** (1) Eat within 90 min of waking, before coffee; (2) One non-negotiable 10-min stop, step away from screen. Watch mood at mid-morning.

---

## User 3 — Sofia (Teacher) — two blocks only

**Story:** Actively trying (exercise, food, bed on time). Feels flat; effort isn't working.

### Log this (Body + Work only; no Nutrition)

**Body:** Sleep 7.5h, quality 2, Energy 2, Mood 3, Hydration 4, Stress 3, Appetite 2, Digestion 4. Note: *"I went to bed early, slept 7.5 hours, but still woke up feeling unrefreshed. Exercise feels harder lately even though I'm keeping up with it"*

**Work:** Start 7:30, end 15:30, Breaks 3, Break quality 2, Focus 3, Mental load 3, Meetings 4. Note: *"Decent day, nothing unusual. Supervising kids during breaks so they don't really feel like breaks"*

### Pulse should surface (two-block)

- **Synthesis:** 7.5h at quality 2 = duration right, restorative quality wrong. Three breaks at low quality (supervising = same alert state as teaching) = no real nervous system recovery. Exercise harder = recovery quality gap, not effort.
- **Recommendations:** (1) Log nutrition tomorrow — appetite 2 with this pattern often traces to meal timing and overnight recovery; (2) One 5-minute break with no cognitive demand before first class. Watch sleep quality.
- **CTA:** → Add Nutrition to complete your Pulse picture.

---

## Screenshot cheat sheet

| User | Sleep | Energy | Stress | Mood | Key note |
|------|-------|--------|--------|------|----------|
| Maya | 6.5h / Q3 | 4 | 3 | 3 | "Hit a wall around 3pm every day" |
| James | 5h / Q2 | 4 | 4 | 2 | "Can't push myself to train, exhausted on waking" |
| Sofia | 7.5h / Q2 | 2 | 3 | 3 | "Slept 7.5h but woke unrefreshed, exercise feels harder" |

---

## Eval use

- Use these payloads as **golden inputs** to body, work, nutrition, and aggregation prompts.
- Compare model output to the "Pulse should surface" text (synthesis, recommendations, tomorrow's signal).
- Tune prompts or add few-shot examples until output matches or closely approximates the intended quality.
