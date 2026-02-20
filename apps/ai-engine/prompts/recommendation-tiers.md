# Recommendation Tiers: Basic vs Advanced

Canonical definition for how recommendations are split between **basic** (free) and **advanced** (paid **subscription**, fiat). Wallet connection is separate (on-chain points, rewards). Both tiers stay valuable; advanced is gated by **paid subscription**, not wallet.

---

## Definitions

### Basic recommendations (free users)

- **What:** One primary, concrete **how to improve** step. Actionable and tied to today’s signals or notes.
- **Quality:** Same standard as advanced: what to do, when, what to notice. No fluff, no generic tips.
- **Who sees it:** Everyone (free and paid).
- **Example:** "Reduce mental load in the 30 minutes before bed; notice whether sleep onset improves over the next few nights."
- **Purpose:** Deliver real value so free users get a clear, usable lever every time.

### Advanced recommendations (paid subscription — fiat)

- **What:** A **second lever** or **another angle**: a different intervention, a “what to notice over time” angle, or a supporting lever that reinforces the first.
- **Quality:** Same concrete style. Must add new information, not repeat the basic step.
- **Who sees it:** Users with an **active paid subscription** (fiat: Stripe, IAP, etc.). Not gated by wallet; wallet is for on-chain points and rewards only.
- **Example:** Basic = "Reduce mental load before bed…" Advanced = "Over the next few nights, keep bed and wake times within a narrow window; consistency supports the wind-down effect."
- **Purpose:** Give paying subscribers a second, complementary lever so they can choose or combine.

---

## How it looks by user type

### Free users

- **Today’s pattern** — Full.
- **What’s shaping your Pulse** — Full (what caused what).
- **How to improve** — **One step (basic).** Concrete, valuable.
- **CTA:** "**Upgrade to Premium** for advanced recommendations (a second lever tailored to your signals)." Optionally a separate line: "Connect your wallet for on-chain points and rewards."

### Paid subscribers (active subscription)

- **Today’s pattern** — Full.
- **What’s shaping your Pulse** — Full.
- **How to improve** — **One step (basic).**
- **Another angle (advanced)** — **Second step** when available (different lever or supporting lever).
- No upgrade CTA; they already have access. Wallet CTA can still show if they haven’t connected (for points).

---

## Rules

1. **Basic is never a downgrade.** It is always one full, concrete recommendation. Free users should never feel they got “half” advice.
2. **Advanced is additive.** It is a second lever or angle, not a replacement. If we only have one strong lever, we return one (basic) and no advanced.
3. **Same language rules.** Both tiers follow trusted-sources and guardrails: causal language, no medical claims, “what to do, when, what to notice.”
4. **Blocks:** This tier model applies to Body Signals first. Nutrition and Work Routine can use the same idea (one primary adjustment for all; optional second lever or deeper mechanism for paid).

---

## API / data shape

- **Body Signals API** returns:
  - `improvements`: array of 1 or 2 strings. `[0]` = basic (always shown). `[1]` = advanced (shown only to **paid subscribers** when present).
- **Subscription status:** Backend exposes `GET /subscription/status` (auth required). Returns `{ hasActiveSubscription: boolean }`. Set from your fiat payment provider (e.g. Stripe webhook). See `docs/fiat-subscription-integration.md`.
- **Frontend:** Free users render `improvements[0]` and the upgrade CTA. **Subscribers** render `improvements[0]` and, if `improvements[1]` exists, `improvements[1]` under "Another angle (advanced)".

---

## Nutrition block (optional)

- **Basic (free):** Today’s pattern + What connects + **How to improve** (one adjustment). Full value.
- **Advanced (paid subscription):** Optional second lever or “what to notice over the next few days” when we have enough context. Same tier rule: basic is complete; advanced is additive. UI can show a CTA: "Upgrade to Premium for advanced nutrition levers." Recipe ideas from fridge can remain gated by Premium or by wallet depending on product choice.
