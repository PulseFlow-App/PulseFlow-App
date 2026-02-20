# Fiat subscription integration

How to gate **advanced recommendations** (and other Premium features) on a **paid subscription** using fiat payments (e.g. Stripe), not wallet connection. Wallet remains for on-chain points and rewards.

---

## Goal

- **Free users:** One primary “how to improve” step (basic). Full value.
- **Paid subscribers:** Same plus “Another angle (advanced)” when available. Gating is by **subscription status**, not wallet.
- **Backend** knows who has an active subscription (from your payment provider). **Frontend** asks the API and gates UI accordingly.

---

## 1. Backend: subscription status

### Endpoint (already stubbed)

- **`GET /subscription/status`** — requires `Authorization: Bearer <accessToken>` (same JWT as other `/users/me` routes).
- **Response:** `{ hasActiveSubscription: boolean }`
- **Today:** Returns `false` until you wire a payment provider. No DB change required for the stub.

### When you add fiat payments

1. **Store subscription state per user**
   - Option A: Add a column to `users`, e.g. `subscription_status` (`'active' | 'canceled' | 'past_due' | null`) and optionally `stripe_customer_id`, `subscription_current_period_end`.
   - Option B: New table `subscriptions (user_id, status, stripe_subscription_id, current_period_end, ...)`.
2. **Set status from your payment provider**
   - **Stripe:** Create a Customer and Subscription per user (after sign-up or when they tap “Upgrade”). On `customer.subscription.updated` and `customer.subscription.deleted` webhooks, update your DB (match by `stripe_customer_id` or `metadata.user_id`).
   - **Apple/Google IAP:** Verify receipts on your backend; map to `userId` and set `subscription_status = 'active'` (and expiry if applicable).
3. **`GET /subscription/status`** reads from DB:
   - Resolve `userId` from JWT (already on `req.user`).
   - Query `subscription_status` (or `subscriptions`) for that user. If status is `active` and not expired → `hasActiveSubscription: true`, else `false`.

---

## 2. Payment provider: Stripe (example)

### Minimal flow

1. **Stripe Dashboard:** Create a Product and recurring Price (e.g. monthly Premium).
2. **Backend:**  
   - **POST /subscription/checkout** (or /create-checkout-session): create Stripe Checkout Session with `customer_email` or `client_reference_id` = your `userId`; return `session.url` for redirect.  
   - **Webhook** (e.g. `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`): identify user (from `client_reference_id` or Stripe Customer `metadata.user_id`), then insert/update your `users` or `subscriptions` table. Set `subscription_status = 'active'` or `'canceled'` / `'past_due'` as per Stripe.
3. **Frontend:** After redirect back from Checkout, call `GET /subscription/status` again; when `hasActiveSubscription === true`, show advanced recommendations and hide upgrade CTA.

### Webhook security

- Use Stripe’s signing secret; verify `stripe-signature` before updating DB.
- Idempotency: use Stripe event id to avoid applying the same event twice.

### Links

- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)  
- [Checkout Session](https://stripe.com/docs/api/checkout/sessions)  
- [Webhooks](https://stripe.com/docs/webhooks)

---

## 3. Frontend: how the app knows “subscriber”

- **Subscription context/hook:** On login (and when returning from payment), the app calls **GET /subscription/status** with the same `Authorization: Bearer <accessToken>` used for body logs and check-ins.
- **State:** e.g. `hasActiveSubscription: boolean`, `isLoading: boolean`. Default `false` when not logged in or API unavailable.
- **Usage:**  
  - **Body Signals result:** Show “Another angle (advanced)” only when `hasActiveSubscription && improvements.length > 1`.  
  - **CTA for non-subscribers:** “Upgrade to Premium for advanced recommendations (a second lever tailored to your signals).”  
  - **Wallet** can stay separate: “Connect your wallet for on-chain points and rewards.”

Implementation details: see `apps/web/src/contexts/SubscriptionContext.tsx` (or equivalent) and usage in `BodySignalsResult.tsx`, `NutritionOverview.tsx`.

---

## 4. Summary

| Piece              | Responsibility |
|--------------------|----------------|
| **Backend**        | `GET /subscription/status` (auth). Today: return `false`. With Stripe/IAP: read DB set by webhooks/receipt verification. |
| **Payment provider** | Stripe (or IAP) creates/updates/cancels subscriptions; your webhooks/receipt API update `subscription_status` per user. |
| **Frontend**       | Call `GET /subscription/status` when user is logged in; gate “advanced” UI and CTAs on `hasActiveSubscription`. |
| **Wallet**         | Unchanged: used for on-chain points and rewards, not for gating advanced recommendations. |

See also: `apps/ai-engine/prompts/recommendation-tiers.md`, `docs/next-steps.md` (Premium: subscription and backend).
