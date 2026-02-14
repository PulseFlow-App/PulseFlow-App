# Nutrition Block — Design (Pulse-Connected)

Nutrition inside Pulse is **not** “snap fridge → get recipes.” It connects to **body signals, recovery, energy, work routine, and sleep** in layers: **Awareness → Pattern detection → Adjustment → Personalization over time.**

---

## Design principles

- **Non-generic:** Insights like “On days with back-to-back calls and late dinner, your energy drop is 2x more likely” instead of “Eat balanced meals.”
- **Low friction:** No calorie counting. Simple yes/no, time of day, or 1–5 scales.
- **Cross-block:** Nutrition insights use Body Signals (sleep, energy, stress, appetite, hydration), Work Routine (load, focus, breaks), and eventually Recovery/Movement.

---

## Layers

| Layer | Purpose |
|-------|--------|
| **1. Awareness** | User logs meal timing, hydration timing, post-meal feel, situational context. |
| **2. Pattern detection** | System correlates with sleep, stress, workload, workout days. |
| **3. Adjustment** | Contextual suggestions: recovery support, light digestion, energy stabilization. |
| **4. Personalization** | “Your system tends to…” — metabolic and behavioral patterns over time. |

---

## MVP feature set (priority order)

### 1. Smart Meal Timing Tracker (low friction)

- **First meal time** (optional time)
- **Last meal time** (optional time)
- **Biggest meal:** morning / afternoon / evening
- **Late-night eating:** yes / no

**Why:** Late eating ↔ sleep quality. Skipped breakfast ↔ afternoon crash. Irregular timing ↔ appetite fluctuations. Connects directly to existing body signals.

---

### 2. Appetite pattern insights

Body Signals already has **appetite (1–5)**. Connect it to:

- Sleep quality
- Stress
- Workout days (from notes or Movement block)
- Workload intensity (from Work Routine)

**Example insight:** “Hunger tends to rise after short-sleep days” / “Appetite drops on high-stress days.” Makes nutrition **predictive**, not reactive.

---

### 3. Hydration intelligence

Body Signals already has **hydration (1–5)**. Upgrade with:

- **When** do you hydrate? (before coffee / during work / around workout / after alcohol / etc.)
- Patterns: low hydration + low energy cluster; hydration drops on busy workdays.

Hydration is a hidden lever for energy and sleep.

---

### 4. Post-meal reflection (“Food → Signal” loop)

Occasionally ask, **60–90 min after a logged meal:**

- How do you feel? **Energized / Heavy / Sleepy / Focused / Bloated**

Over time: AI detects personal trigger patterns. No calorie counting. Becomes premium gold.

---

### 5. Recovery mode (situational nutrition)

Detect **situations** from logs and notes:

- Gym day / Party night / Travel day / Deadline day / Poor sleep night

Then suggest:

- Recovery support meals  
- Stabilization meals  
- Light digestion meals  
- Energy stabilization meals  

Uses Work Routine + Body Signals + Nutrition timing to be **contextual**.

---

## Additional concepts (post-MVP)

| Concept | Description |
|--------|-------------|
| **Smart grocery suggestions** | Foods that support sleep timing, stabilize appetite, easy recovery, workday snacks — from fatigue/stress/gym patterns. |
| **Weekly Nutrition Stability Score** | Regularity, meal-timing consistency, hydration stability, appetite predictability. Stability > perfection. |
| **Energy crash detector** | If energy low + hunger high + stress moderate + sleep short → detect crash pattern; e.g. “Your energy dips often appear 3–4h after late first meals.” |
| **Macro-free protein awareness** | Protein at breakfast? (y/n). Protein at last meal? (y/n). Simple, powerful for energy. |
| **Nutrition Load score** | Heavy vs light digestion day; recovery support day; stability day. Digestive load affects sleep, stress, energy. |
| **Personal metabolic profile (premium)** | “Your system tends to…” — responds to earlier meals, sensitive to late-night eating, appetite spikes after poor sleep, etc. |

---

## Integration map: Nutrition ↔ Sleep ↔ Work

| Nutrition input | Body Signals used | Work Routine used | Output |
|-----------------|-------------------|-------------------|--------|
| Meal timing | Sleep quality, energy, appetite | Day intensity, breaks | Timing insights, crash risk |
| Appetite (already in Body) | Sleep, stress, energy | Load, focus | Appetite pattern insights |
| Hydration timing | Hydration 1–5, energy | Busy vs deep-work days | Hydration intelligence |
| Post-meal feel | Energy, digestion | — | Food→signal patterns |
| Fridge + note | Energy, stress, digestion | — | Recipe/grocery suggestions |
| Recovery mode | Sleep, energy, stress | Workload, notes (gym, deadline) | Situational meal suggestions |

---

## Data model (MVP)

- **Meal timing log (per day):** firstMealTime?, lastMealTime?, biggestMeal?, lateNightEating?
- **Hydration timing (optional):** when they hydrate (multi-select or tags).
- **Post-meal reflection:** mealLogId? or date+time, feeling (energized/heavy/sleepy/focused/bloated).
- **Recovery mode:** Derived from Body + Work Routine (gym, party, travel, deadline, poor sleep); no separate “recovery log” required for MVP — situational flags from existing blocks.

Fridge logs (existing) stay; they become one input among many for suggestions.

---

## Free vs premium (to define)

- **Free:** Meal timing, basic appetite/hydration pattern hints, fridge + recipe (with caps?).
- **Premium:** Post-meal reflection loop, Energy Crash Detector, Personal Metabolic Profile, Nutrition Stability Score, Smart Grocery, deeper Recovery Engine.

---

## Technical notes

- **Stores:** Nutrition block has `fridge` (existing); add `mealTiming`, `hydrationTiming`, `postMealReflection` (or single `nutritionLog` per day).
- **Insights:** Can be rule-based first (e.g. “late last meal + poor sleep last night → suggest lighter evening next time”), then AI when API is available.
- **Recovery Engine:** Logic tree: if (gym day) → recovery support; if (party night) → stabilization + hydration; if (deadline + stress) → energy stabilization, etc. Uses `getPulseContextForRecipes()`-style helper fed from Body + Work Routine.

---

## Summary

- **Fridge snaps:** Fun, not the core. One input for recipes/grocery.
- **Core:** Meal timing, appetite patterns, hydration timing, post-meal reflection, recovery mode — all wired to Body Signals and Work Routine so Nutrition feels **intelligent and contextual**, not generic.
