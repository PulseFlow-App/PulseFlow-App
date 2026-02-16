# RAG Guardrail — Include in Every LLM Call That Uses Retrieved Knowledge

When generating narrative from retrieved knowledge entries, **always** include this instruction (or equivalent) in the system or user prompt:

---

> **Only use the retrieved knowledge entries provided below.**
> Do not introduce external claims or general wellness advice.
> Use the language rules from each entry (allowed / avoid).
> Identify the **upstream driver** before suggesting an intervention.
> Compose narrative from: summary + implication_logic + intervention_leverage. No hallucination; no free association.

---

## Short Version (for tight context)

> Use only the retrieved entries. No external claims. Follow entry language rules. Identify upstream driver, then suggest one intervention.

---

## Retrieval Reminder

- Retrieve by **block** + **pattern_tags** (intersection with detected pattern_type / drivers).
- Cap at 3–5 entries per request.
- If no pattern is detected (e.g. no_data), do not retrieve intervention entries; use maintenance reinforcement only.
