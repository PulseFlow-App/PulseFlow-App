# Work Routine: Block 2 Spec & AI Guidance

This skill defines what **Work Routine** means in Pulse, how it connects to Body Signals, and how the AI (or rule-based engine) should reason. Use it when writing or tuning Work Routine prompts, analysis logic, or UI copy.

---

## 1. What Work Routine Means in Pulse

In Pulse, **working routine is not productivity advice**.

It is:

> How **cognitive load**, **posture**, **environment**, **timing**, and **task structure** interact with body signals.

**We do not teach or say:**

- "Wake up at 5am"
- "Grind harder"
- "Optimize like a CEO"
- "Your productivity is low"

**We teach and say:**

- Focus quality
- Mental fatigue
- Task friction
- Recovery during work

This keeps the block compliant, grounded, and useful. No hype.

---

## 2. Core Working Routine Inputs (MVP)

**User inputs (one-tap or simple sliders):**

| Concept           | Current mapping (Block 2)              | Notes                    |
|------------------|----------------------------------------|--------------------------|
| Focus quality    | focusSessions, distractions, interruptions | Few blocks + high distractions = low focus |
| Mental fatigue   | energyEnd, energyStart, taskCompletion | Drop + low completion = fatigue |
| Workload intensity | workHours, meetingLoad              | Long days, many meetings |
| Breaks           | breaks (1–5)                          | Few = strain             |
| Work posture     | deskComfort (1–5)                     | Poor = background load   |
| Work environment | workspace, distractions               | Noisy/chaotic = strain   |
| Screen time      | screenHours (optional)                | Blocks: optional later   |

**Optional notes (free text):**

- "Back to back calls"
- "Could not focus all day"
- "Deadline pressure"
- "Worked late again"

That is enough to reason deeply. Start small.

---

## 3. How Work Routine Connects to Body Signals

**Real, research-backed relationships** the AI can use (observational only):

| Body signal | Work routine link |
|-------------|-------------------|
| **Sleep ↔ Work** | Poor sleep → lower focus, higher mental fatigue. Late work → delayed sleep onset. High cognitive load → lighter sleep quality. |
| **Energy ↔ Work structure** | Long unbroken work blocks → energy drop. No breaks → mental fatigue accumulates. Morning overload → afternoon crash. |
| **Mood ↔ Work environment** | Noisy/chaotic setup → mood strain. Constant task switching → irritability. Lack of task closure → low satisfaction. |
| **Stress ↔ Task design** | Unclear tasks → higher stress. Time pressure → digestion and appetite changes. Cognitive overload → tension and poor recovery. |
| **Hydration & posture ↔ Fatigue** | Dehydration → perceived mental fatigue. Poor posture → energy drain and discomfort. Screen-heavy days → headaches, eye strain (non-medical framing). |

The AI should say **why** (cause–effect), not just what.

---

## 4. Trusted Sources (Non-Medical)

**Canonical list (all 16 sources), ingestion pattern, and legal guardrails:** `apps/ai-engine/prompts/trusted-sources-and-guardrails.md`.

**Work-routine–relevant:** Cognitive Load Theory, OSHA Ergonomics, Cornell Ergonomics Web, Microsoft Research (productivity / human factors). Also: Yerkes–Dodson, APA (stress), HBR (focus), Stanford Sleep, NIH (circadian). Do **not** use medical journals or productivity-guru content.

**Ingestion:** When teaching from these sources, use **structured relational knowledge**: Topic + Evidence + Relationship (cause–effect bullets; link signals) + Language rules (use *may* and *often*; no diagnosis; link signals explicitly).

**Guardrails:** Educational summaries only. No dosage, treatment, or diagnosis. No "disease" or "condition". Translate outcomes into **patterns and observations**. Example: "Research suggests that cognitive load may influence focus and fatigue." Never: "You have a disorder."

---

## 5. How the AI Should Reason

**Observational, never judgmental.**

**Bad:** "Your productivity is low."

**Good:** "Your focus and energy are moving together today, which usually means cognitive load is high or breaks are missing."

**Good:** "Late screen time and mental fatigue often show up together the next day."

**Phrasing:** Use "often", "usually", "can", "may", "suggests". Never diagnose. Never tell the user they are underperforming.

---

## 6. Output Structure (Pulse-Style)

Three sections only. Short. No fluff.

**Today's work pattern**

- One short narrative. Connect 2+ signals (e.g. focus and mental fatigue; energy and screen blocks).
- Reference notes when present.

**What's shaping this**

- Bullet rhythm. Each line adds a signal, cause, or relationship.
- Link to body signals where relevant (e.g. "Lighter sleep often reduces focus resilience").

**One thing to observe**

- One experiment. "Notice whether…", "Observe if…". Specific to today's data.

**Example:**

- *Today's work pattern:* Focus and mental fatigue are tightly linked today. Energy appears to drop alongside longer screen blocks.
- *What's shaping this:* Lighter sleep often reduces focus resilience. Fewer breaks can amplify mental fatigue even on moderate workload days.
- *One thing to observe:* Notice whether a short break earlier in the day changes how focus holds in the afternoon.

---

## 7. Architecture Notes

- Work Routine is a **signal group** that shares context with Body Signals (sleep, energy, stress).
- Pattern engine can use: today vs previous workdays, repeating friction points.
- Premium evolution: AI can remember typical focus windows, break tolerance, cognitive fatigue patterns; recommendations adapt over time.

---

## 8. Compliance & Boundaries

- Not medical advice. Not productivity coaching.
- No motivational or guru language. No "optimize", "grind", "CEO habits".
- Directly tied to body signals and real inputs. Highly personal. Hard to replicate without real data.
- **Universal disclaimer:** Include in system prompts: "This is not medical advice. For education and self-awareness only. If symptoms persist or concern you, consult a healthcare professional." One line is enough.

For narrative rules (concise, no em dashes, bullet rhythm, each sentence adds information), see also `body-signals-physiology` skill.
