# PulseFlow -Daily Report System Prompt (PDF content generation)
`apps/ai-engine/prompts/daily-report-system-prompt.md`

---

## When it triggers

Available after any block is logged. Generates the fullest possible report based on what has been logged. If all three blocks are done, produces a complete day report. If one or two blocks, produces a partial report clearly labeled as such.

User-facing trigger: "Download today's report" button on the Pulse page.

---

## Report structure

The AI generates structured JSON. The report renderer (PDF service) converts it to a formatted PDF. AI does not generate the PDF directly - it generates the content.

---

## AI Output: Daily Report JSON

```json
{
  "report_date": "YYYY-MM-DD",
  "user_name": "string or 'You'",
  "blocks_logged": ["body", "work", "nutrition"],
  "report_type": "complete | partial",

  "pulse_summary": {
    "overall_score": 0,
    "score_framing": "string -score + one-line explanation of what drove it",
    "block_scores": {
      "body": { "score": 0, "label": "string -3-5 word descriptor" },
      "work": { "score": 0, "label": "string" },
      "nutrition": { "score": 0, "label": "string" }
    }
  },

  "synthesis": {
    "what_connected_today": "string -2-4 sentence cross-block narrative (from aggregation output)",
    "primary_driver": "string -root cause in one phrase",
    "chain": "string -causal chain direction e.g. 'sleep deficit → sustained work load → meal timing gap'"
  },

  "block_details": {
    "body": {
      "todays_pattern": "string",
      "drivers": ["string"],
      "raw_signals": {
        "sleep_hours": 0,
        "sleep_quality": 0,
        "energy": 0,
        "mood": 0,
        "stress": 0,
        "hydration": 0,
        "digestion": 0,
        "appetite": 0
      },
      "user_note": "string"
    },
    "work": {
      "todays_pattern": "string",
      "drivers": ["string"],
      "raw_signals": {
        "work_hours": 0,
        "breaks": 0,
        "focus_quality": 0,
        "mental_load": 0,
        "meetings": 0
      },
      "user_note": "string"
    },
    "nutrition": {
      "todays_pattern": "string",
      "drivers": ["string"],
      "raw_signals": {
        "first_meal_time": "HH:MM",
        "meal_count": 0,
        "hydration_log": "string",
        "meal_photo_insights": ["string"],
        "fridge_suggestions_used": "string or null"
      },
      "user_note": "string"
    }
  },

  "recommendations": [
    {
      "priority": 1,
      "action": "string",
      "observe": "string",
      "why": "string",
      "blocks_referenced": ["body", "work"]
    },
    {
      "priority": 2,
      "action": "string",
      "observe": "string",
      "why": "string",
      "blocks_referenced": ["nutrition"]
    }
  ],

  "tomorrow_signal": "string -one specific observable signal for tomorrow",

  "footer_note": "This report is for self-awareness and education only. It is not medical advice."
}
```

---

## PDF Layout Spec (for report renderer)

### Page 1 -Pulse Overview

**Header:** PulseFlow Daily Report -[Date]

**Visual: Three-circle layout**

Three score circles side by side (Body / Work / Nutrition), each with:

- Score number large
- Block name below
- 3-5 word descriptor below that (e.g. "Recovery deficit", "High sustained load", "Delayed timing")
- Color: green (70+), amber (40-69), red (<40)

**Visual: Combined Pulse score**

One larger circle in the center below the three, showing the overall score.

Label: "Your Pulse -[date]"

Below: `score_framing` text in small type.

**Section: What connected today**

`synthesis.what_connected_today` paragraph.

Below: `synthesis.chain` displayed as a simple arrow chain:

Sleep deficit → Sustained work load → Meal timing gap

---

### Page 2 -Block Details

Three sections, one per block. Each section:

**[Block name] -Score [X]**

Pattern: `block_details.[block].todays_pattern`

Signals table (two columns: signal name, value):

| Signal   | Today        |
|----------|--------------|
| Sleep    | 5h, quality 2/5 |
| Energy   | 4/5          |
| Stress   | 4/5          |
| ...etc   |              |

Key drivers (bulleted, from `drivers` array)

User note (if present): displayed in a light box -"Your note: [text]"

---

### Page 3 -Recommendations + Tomorrow

**Recommendations (Priority 1 and 2)**

Each displayed as a card:

- Action (bold)
- Observe: what to watch
- Why: one-sentence causal explanation
- Small tag showing which blocks it draws from

**Tomorrow's signal to watch**

Displayed as a callout box.

`tomorrow_signal` text.

**Footer**

`footer_note` text in small gray type.

PulseFlow logo + "Generated [date]"

---

## AI Prompt for Report Generation

```
You are generating a PulseFlow Daily Report for [date].

You have access to:
- All block outputs from today (body, work, nutrition -whichever were logged)
- The aggregation handoff objects from each block
- The Pulse aggregation synthesis output (if two or more blocks were logged)
- Any meal photo insights generated today
- Any fridge photo suggestions generated today

Your job is to produce the Daily Report JSON object defined in the spec.

Rules:
1. Do not generate new insights -use the outputs already produced by block and aggregation prompts. Compile and structure them.
2. The synthesis.what_connected_today field should come directly from the aggregation output's what_connects field -do not rewrite it.
3. The block_details.[block].todays_pattern fields should come from each block's output -do not rewrite them.
4. Recommendations should be the aggregation layer's recommendations, not new ones.
5. If a block was not logged, set its value to null and set report_type to "partial".
6. score_framing must explain the score causally, not mathematically. Never say "average of."
7. synthesis.chain must be a readable arrow-chain of 3-5 steps showing cause-to-effect direction.
8. Keep all text fields concise -this is a report, not a conversation. The user can see their chat for context.

Output only the JSON object. No preamble, no explanation.
```
