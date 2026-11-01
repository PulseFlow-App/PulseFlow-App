# Pulse Flow Services — data model and migration plan

Pulse Flow Services is a directory of local professionals on top of Pulse Flow. The public site is `services.pulseflow.site`. The same pages are linked from the main app at `/pros`. Signed-in work (a task, a request, assigning someone) stays in the existing app and uses the same account.

This replaces the unpublished Services marketplace draft. Do not apply `066_services_marketplace.sql`. That file is removed. `066_pulse_pros.sql` is the migration for this product.

The running MVP keeps directory activity in the browser (`pulseflow.pros.v1`) so a manager can use it before the migration is applied. The tables below are the production model. Category and area slugs match the client catalog.

## What is reused

| Need | Existing Pulse Flow piece |
| --- | --- |
| Sign-in | Supabase auth and `profiles`. Sending a request requires this account. Browsing and the professional reply link do not. |
| Vendors | `contacts`. A profile may point at one contact. Name, phone, and LINE / WhatsApp are copied from that contact. The contact row is not rewritten. |
| Property work | `tasks`. A request may store `task_id`, `org_id`, and `villa_id`. Assigning writes a short note block on the task. If the contact is already linked to a Pulse Flow user, `tasks.assigned_to` is set to that user. |
| Jobs | Existing service orders stay as they are. A verified Pros job is a separate public count, created only when a linked task or request is completed. |
| Alerts | `notifications` kind `appointment` when a matched professional already has `contacts.linked_profile_id`. Everyone else is reached by a LINE, WhatsApp, or SMS link the manager sends. |
| Languages | App locale. Launch copy is English, Thai, Russian, and Hebrew. Other locales fall back to English. |
| Translation | Existing `/api/translate`. Original text stays. A translation is stored beside it. |

Organisation chat (`messages`) is not used for quote threads. The professional replies on a signed link, without a password.

## New tables

No existing column is dropped.

- `pro_categories`, `pro_category_translations` — slug, icon, sort, active, localized name and description.
- `pro_areas`, `pro_area_translations` — `country_code`, parent, level (`country` | `region` | `locality` | `district`), optional public centroid. Koh Phangan, Koh Samui, and Koh Tao are seed rows under Surat Thani. Only Koh Phangan is marked `demo_market`. None of them is hardcoded as the only market.
- `pro_profiles` — optional `contact_id` and `org_id`. Display name, description and its language, photo, up to 3 portfolio photos, languages, private phone / LINE / WhatsApp, `visibility` (`private` default, or `public`), `status` (`active` | `suspended`), availability flag, consent (`consent_at`, `consent_by`, `consent_note`), claim token, `listing_tier` (`free`, unused by search).
- Verification is three nullable timestamps: `phone_verified_at`, `identity_checked_at`, `business_checked_at`. A badge is shown only when the timestamp is set.
- `pro_profile_categories`, `pro_profile_areas` — a professional can list several trades and several areas. There is no home-address column.
- `pro_requests` — category, title, description, `original_locale`, `translations`, photos, area, urgency, preferred time, language, optional task link. Status: `requested`, `offers_received`, `chosen`, `scheduled`, `in_progress`, `awaiting_approval`, `completed`, `cancelled`.
- `pro_offers` — price, message, proposed time, status (`pending` | `accepted` | `declined`). `token` is the unguessable reply link.
- `pro_jobs` — one verified job per completed request or task. Public display is the count and the trade only.
- `pro_reviews` — one per completed request or task. Overall stars and a comment. Original locale kept.
- `pro_reports` — profile or review.
- `pro_events` — `request_created`, `offer_sent`, `offer_chosen`, `assigned`, `job_verified`, `report`. For later conversion measurement. No billing.
- `pro_admins` — who may suspend, verify, and edit the catalog.

`listing_tier` is stored so a later release can mark a featured listing. Search sorts by real review average, then name, and ignores the tier.

Phone, LINE, and WhatsApp are columns on `pro_profiles` and are excluded from `pro_directory`, the view anonymous visitors can read.

## Reply without an account

`submit_pro_reply(token, action, amount, currency, message, proposed_time, locale)` is `security definer`. The token is the only credential. Actions are `quote`, `decline`, and `time`. The function does not reveal other offers or any private address.

Creating a profile on someone's behalf requires `consent_at`. The vendor later opens `/pros/claim/[token]` and the row records `claimed_at`. Claiming does not create a Pulse Flow user.

Deleting a profile removes the Pros row. The original contact stays.

## Migration plan

1. Apply `supabase/migrations/066_pulse_pros.sql` after `065`. It adds tables, the public directory view, the reply function, RLS, and seed categories plus demonstration geography.
2. Do not insert sample professionals, reviews, or job counts in SQL. The demo client builds private profiles from the existing demo vendor contacts, and publishes two of those vendors so the directory is not empty. They have no ratings and no verified jobs.
3. Grant admin by inserting `profiles.id` into `pro_admins`. Demo owner and manager seats can open the in-app admin before that table exists.
4. Rollback: drop the `pro_*` objects. Tasks, contacts, bills, and notifications are unchanged. A task note between `— Pulse Flow Services —` and `— End Pulse Flow Services —` is plain text and can be removed by hand. Older notes may still say Pulse Pros.

## Product map

| Phase | Where it lives |
| --- | --- |
| 1. Vendor profile, claim, private/public, find from a task | Contacts → profile editor. “Find a professional” on an open task. Completed task writes `pro_jobs`. |
| 2. Public directory and requests | `/pros`, `/pros/c/[slug]`, `/pros/a/[slug]`, `/pros/p/[id]`, `/pros/request`, `/pros/reply/[token]` |
| 3. Reviews, checks, reports | After a completed request or task. Admin sets the three checks. |
| 4. Admin counts | `/pros/admin` |

## Also adopted

These pieces come from the broader marketplace spec and fit the current product:

- Two ways to ask: **direct** (the request goes only to the professional the customer opened) and **open** (everyone who matches the trade, area, and language).
- Saved professionals and a recent list, so a manager can ask the same person again. Saving does not change search order.
- Agreed price, a final amount, and a “paid directly” mark. Pulse Flow Services does not collect or hold the money.
- Email and qualification checks, shown only after an admin records them.

Still out of this release: taking payment, instant booking, video, live GPS, multi-part ratings, AI matching, and charging for leads.
