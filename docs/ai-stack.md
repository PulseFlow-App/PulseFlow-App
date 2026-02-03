# Recommended AI Stack for Pulse

This stack is designed to support **data-first reasoning**, **personal baselines**, and **progressive intelligence**, while staying flexible for MVP → long-term evolution.

**Principle:**  
Start simple, stay modular, and let intelligence grow with data.

---

## 1. Core Architecture Overview

**Flow**

```
User Input → Normalization → Feature Extraction → Reasoning → Signal → Recommendation
```

Each layer is isolated so models can be swapped without rewriting the system.

---

## 2. Input & Data Processing Layer

### Data Types

- Text (meals, mood, notes)
- Images (fridge photos, food, body metrics)
- Structured data (sleep hours, steps, weight, labs)

### Tools

- **Image Parsing**
  - GPT-4 Vision or equivalent multimodal model
  - Used only for extraction, not reasoning
- **Text Normalization**
  - Lightweight LLM calls for:
    - Ingredient extraction
    - Activity classification
    - Sentiment / energy tagging
- **Rule-Assisted Parsing**
  - Deterministic rules for units, timestamps, ranges

**Why:** Keeps raw data clean. Prevents hallucinations at reasoning stage.

---

## 3. Feature Extraction Layer (Non-LLM)

Critical for long-term scalability.

### Techniques

- Rolling averages
- Z-score normalization per user
- Day-over-day deltas
- Weekly aggregates
- Time-of-day weighting

### Stack

- Python (NumPy, Pandas)
- Background workers (Celery / Temporal / Cloud Tasks)

**Output:** User-specific feature vectors. No raw text or images past this layer.

---

## 4. Reasoning & Recommendation Layer

### MVP 1 — Lightweight Reasoning

- **Single-call LLM reasoning**
- Prompted with:
  - Today's feature vector
  - Yesterday's deltas
  - User constraints (time, energy, goals)

**Models:** GPT-4 / GPT-4-mini, Claude / Mistral as secondary fallback

**Use cases:** Daily Pulse explanation, simple recommendations, meal suggestions from ingredients

### MVP 2 — Adaptive Reasoning

- **Two-stage reasoning**
  1. Pattern analysis (non-LLM)
  2. Narrative & suggestion generation (LLM)

**Capabilities:** Personal baseline awareness, context-aware insights, multi-input synthesis

**Prompt strategy:** System prompt defines non-medical boundaries. User prompt receives historical aggregates, personal baseline shifts, current-day anomaly flags.

---

## 5. Pulse Score Engine (Deterministic)

**Important:** The Pulse score must **never** be LLM-generated.

### Implementation

- Weighted scoring function
- Inputs: Sleep delta vs baseline, nutrition consistency, movement balance, recovery indicators
- Output: 0–100 score, confidence band

**Stack:** Python service, versioned scoring formulas, backtestable logic

---

## 6. Personal Baseline Modeling

### MVP 1

- 7–14 day rolling baseline
- Simple mean + variance

### MVP 2

- Exponential moving averages
- Seasonality detection
- Context segmentation (workdays vs weekends)

**Stack:** Python, optional DuckDB for fast analytics, feature store pattern (Feast-like, lightweight)

---

## 7. Trend & History Analysis

### Data Storage

- Time-series optimized tables
- Immutable raw data + derived metrics

**Tools:** PostgreSQL + TimescaleDB extension, or DuckDB for local-first / edge setups

---

## 8. Token-Gated AI Access Layer

### Logic

- Token balance / lock status checked **before** AI calls
- Request limits enforced at gateway level

**Stack:** On-chain check (read-only) for $PULSE on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump), off-chain cache (Redis), rate limiter (IP + wallet). No token contract to deploy.

---

## 9. Safety & Boundaries Layer

### Non-Medical Enforcement

- Hard constraints in system prompts
- Automatic disclaimer injection
- Red-flag detection for sensitive inputs

**Techniques:** Rule-based filters, LLM output validators, content classifiers

---

## 10. Model Ops & Evolution

### Observability

- Prompt versioning
- Output diffing
- Recommendation feedback loop

### A/B Testing

- Score formula variants
- Prompt variants
- Recommendation tone variants

**Stack:** OpenTelemetry, feature flags, experiment tracking (lightweight)

---

## One-Line Summary

> Pulse uses **AI to interpret**, **math to decide**, and **history to personalize** — not the other way around.

---

📖 See also: [Roadmap](./roadmap.md) | [Product](./product.md) | [Data Model / Privacy](../data-model/privacy.md)
