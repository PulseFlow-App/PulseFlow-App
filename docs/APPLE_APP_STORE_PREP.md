# Apple App Store registration & review prep (Pulse Flow)

Checklist for getting Pulse Flow ready for Apple Developer enrollment and (if you choose) App Store review.  
Source of truth for rules: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (last checked against Apple’s public page, updated June 8, 2026).

Use this as a **decision workbook**: each step lists options, what Apple cares about, and what Pulse Flow already has vs still needs.

---

## Pulse Flow today (baseline)


| Area             | Current state                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Delivery         | Web app + installable **PWA** at `app.pulseflow.site` (not a native App Store binary yet) |
| Auth             | Email/password + optional passkeys (Face ID)                                              |
| Monetization     | Company **Stripe** subscription / trial (web); Personal free                              |
| Legal            | In-app `/terms` and `/privacy` + support email                                            |
| UGC              | Team chat, guest Support, photos, endorsements, notes                                     |
| Account deletion | **In-app** Settings → Delete account (`POST /api/account/delete`) + public `/support`     |
| Support URL      | Public [`/support`](https://app.pulseflow.site/support) (help, delete, billing, legal)    |
| Report/block     | **Done (MVP):** ⋯ on team chat + Support → Report / Block; Settings → Blocked people; APIs + migration `057_safety_report_block.sql` |


### PWA / “Add to Home Screen” readiness (web, not Store binary)

These are the installable-web checks that map to common App Store / Play a11y expectations when you stay on path **A** (web + PWA) or ship a thin wrapper later:

| Check | Status |
| ----- | ------ |
| Pinch-zoom allowed (no `maximum-scale=1` / `user-scalable=no`) | Done (`viewport` in `src/app/layout.tsx`) |
| Web app manifest (`name`, `icons` 192/512, maskable, `start_url`, `scope`, `display`) | Done (`public/manifest.webmanifest`) |
| Apple touch icon + `appleWebApp` metadata | Done |
| Public Privacy + Terms + Support without login | Done (`/privacy`, `/terms`, `/support`) |
| In-app account deletion | Done (Settings → Delete) |
| Safe-area padding on auth / shell | Present on login and app chrome |
| UGC report / block (Apple 1.2 / Play UGC) | **Done (MVP)** — apply migration `057` before production use |
| Native binary + IAP / Play Billing | **Not started** — required only for App Store / Play Console listing |

**Google Play:** same baseline — Play does not review a pure PWA URL. A Play listing needs a signed Android App Bundle (TWA / Capacitor / native), Data safety form, and (if digital goods are sold in-app) Play Billing. Until then, Android users install via Chrome → Add to Home screen on `app.pulseflow.site`.

---



## Step 0 — Decide the distribution path

Apple’s guidelines apply to **App Store (and notarized) apps**. A Safari/PWA site is “the open Internet” and is **not** reviewed like an App Store app—but users cannot find you in the App Store without a binary.


| Option                                                     | What you do                                                         | Pros                            | Cons / Apple risk                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **A. Stay web + PWA only**                                 | Keep `app.pulseflow.site`; Add to Home Screen                       | No App Review, no IAP rules     | No App Store discovery; iOS push/install friction                                                            |
| **B. Thin native wrapper (WebView / Capacitor / Cordova)** | Ship WKWebView shell that loads the web app                         | Faster “get into Store”         | High risk of **4.2 Minimum Functionality** rejection (“repackaged website”) unless you add real native value |
| **C. Hybrid**                                              | Native shell + push, Face ID, camera, deep links; core UI still web | Better chance than pure WebView | Still need clear native differentiation; billing rules still apply                                           |
| **D. Native iOS (SwiftUI / React Native)**                 | Rebuild or share logic; StoreKit for paid digital features          | Best review fit long-term       | Highest build cost                                                                                           |
| **E. Unlisted / Custom App / enterprise**                  | Limited distribution via Apple Business                             | Less public scrutiny            | Not for open consumer signup                                                                                 |


**Recommended decision order for Pulse Flow**

1. If goal is **only** “users can use the product on iPhone” → **A** is already live.
2. If goal is **App Store listing + brand** → prefer **C or D**, not a bare WebView (**B**).
3. Pick billing strategy (Step 4) **before** you write a line of native code—Stripe-in-app vs IAP changes product design.

**Decision (fill in):** `D`

---



## Step 1 — Apple Developer Program membership


| Option           | Who enrolls          | Notes                                                                                                                |
| ---------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Individual**   | You as a person      | Display name = your legal name; simpler; some categories (VPN, crypto wallets, highly regulated) prefer Organization |
| **Organization** | Company with D-U-N-S | Needed for most B2B brands; legal entity on agreements; better for “enterprise services” framing                     |


Actions:

1. Enroll at [developer.apple.com/programs](https://developer.apple.com/programs/) (~USD 99/year).
2. Complete identity verification (ID / D-U-N-S for org).
3. Accept Apple Developer Program License Agreement.
4. Create App Store Connect access for people who will submit.


| Option                           | Act                                                       |
| -------------------------------- | --------------------------------------------------------- |
| Enroll now, ship later           | Pay + verify while building native shell                  |
| Enroll only when binary is ready | Delay cost; blocks TestFlight until enrolled              |
| Use existing org account         | Reuse if you already have one under the same legal entity |


**Pulse Flow note:** Company billing and B2B ops → **Organization** enrollment is the safer long-term choice if a company entity exists.

**Decision:** Individual — legal name: Anastasia Boltrushevich

---



## Step 2 — Legal entity, trademarks, and contact (Guidelines 1.5, 5.2, 5.6.2)

Apple needs a reachable developer and accurate identity.


| Requirement            | Options                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Support URL**        | Dedicated page on `pulseflow.site` · Formspree/Typeform · Intercom · mailto page that stays online |
| **Marketing URL**      | `https://pulseflow.site` (recommended)                                                             |
| **Privacy Policy URL** | Public `https://app.pulseflow.site/privacy` (already exists) — keep reachable without login        |
| **Contact email**      | Use the same as in-app legal (`brand.supportEmail`) — monitor it during review                     |
| **Trademark**          | Confirm “Pulse Flow” is clear to use · rename if conflict · register mark later                    |


Checklist:

- [x] Support page answers “how do I get help / delete data / cancel subscription” → `/support`  
- [x] Privacy + Terms not behind login  
- [ ] Counsel review of Terms/Privacy (flagged in `docs/PRODUCTION.md` as still open)  
- [ ] No Apple logos / “for iPhone only” marketing that implies Apple endorsement (5.2.4)

---



## Step 3 — What product you submit (roles & demo access) (2.1 App Completeness)

Reviewers must reach **full features**. Pulse Flow is multi-role.


| Option                                    | How reviewer tests                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **A. Seeded demo accounts** (recommended) | Provide Owner + Manager + Staff + Guest logins in Review Notes; backend live                      |
| **B. Built-in demo mode**                 | In-app “Explore demo” with no password (needs prior Apple approval if used *instead of* accounts) |
| **C. Invite QR / join token**             | Extra for guest/staff join flows; still need password accounts for main review                    |
| **D. Video walkthrough**                  | Supplement only—does **not** replace working demo access                                          |


Prepare and paste into **App Review Notes**:

```
Demo accounts (production or staging mirrored):
Owner:   email / password
Manager: email / password
Staff:   email / password
Guest:   email / password  (with an accepted stay + quoted request ready)

Notes:
- Personal vs Company workspaces: …
- Company Full/trial unlocks Reports & Staff search
- Guest Support appears after confirmed stay
- Agent/MCP settings are for owners/managers; optional for review
```

Also:

- [ ] Staging or production backend **up** during review  
- [ ] No placeholder “Lorem” screens  
- [ ] Stripe test mode vs live: document which; don’t break checkout mid-review  

---



## Step 4 — Business model & payments (Guideline 3.1) — critical

Pulse Flow sells **digital SaaS access** (company Full / trial / reports). That is usually **not** “physical goods outside the app” (3.1.3e). Guest stays are booked *through* the host; host subscription is digital.

### Options for monetization in an iOS App Store binary


| Option                                     | Description                                                                                                                   | When it fits                                                                | Risks                                                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. StoreKit IAP / subscriptions**        | Sell Company Full via Apple IAP; sync entitlement to Supabase                                                                 | Default for unlocking digital features **inside** the app                   | Apple fee; must rebuild billing; dual Stripe+IAP sync                                                                                            |
| **2. Multiplatform (3.1.3b)**              | Sell on web (Stripe); iOS app lets users **use** what they bought elsewhere; **also** offer same subscriptions via IAP in-app | Common SaaS pattern                                                         | Must offer IAP for the same digital unlocks **in the app**; cannot *only* Stripe inside iOS app                                                  |
| **3. Free stand-alone companion (3.1.3f)** | iOS app has **zero** purchase UI / CTAs; all subscribe on web                                                                 | Softest engineering                                                         | **No** “Upgrade”, “Subscribe”, Stripe buttons, or links that steer to buy (except where US/entitlement rules allow); easy to violate by accident |
| **4. Enterprise services (3.1.3c)**        | Sold only to organizations/groups for employees                                                                               | If you stop consumer Personal signup in the app and only sell B2B contracts | Personal free + self-serve company signup on App Store **conflicts** with pure enterprise path                                                   |
| **5. Reader / external link entitlements** | Not a fit—Pulse Flow is not magazines/music/video “reader” content                                                            | —                                                                           | Don’t rely on this                                                                                                                               |
| **6. Stay web-only for paid flows**        | Keep PWA for billing; App Store app free ops client with no paywall                                                           | Same as option 3 in practice                                                | Same CTA restrictions                                                                                                                            |


**Practical Pulse Flow recommendation**


| Goal                                               | Pick                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| Fastest App Store listing, minimal billing rewrite | **3** — free iOS app, **no** in-app upgrade CTAs; subscribe only on web/PWA |
| Correct long-term SaaS on iOS                      | **1** or **2** — implement StoreKit auto-renewable “Company Full”           |
| Only B2B invoice customers                         | Explore **4** with counsel + Apple notes explaining org-only sales          |


**Do not:** put Stripe Checkout inside the iOS binary to unlock Full/reports without IAP (classic 3.1.1 rejection).

**Decision:** `_____` (1–6)  
**If 3:** list every screen that currently shows Plan/Billing and plan to **hide or replace** on iOS.

---



## Step 5 — Privacy nutrition labels & account deletion (5.1)



### Privacy Policy & App Privacy questionnaire


| Data you likely declare                      | Collected?     | Linked to user? | Used for tracking?        |
| -------------------------------------------- | -------------- | --------------- | ------------------------- |
| Contact info (name, email, phone)            | Yes            | Yes             | Usually No                |
| User content (chat, photos, notes)           | Yes            | Yes             | No                        |
| Identifiers (user ID)                        | Yes            | Yes             | No                        |
| Purchases (subscription status)              | Yes (company)  | Yes             | No                        |
| Location (talent map / near me / villa pins) | Optional       | Yes if saved    | No (unless ads—you don’t) |
| Diagnostics                                  | If Sentry etc. | Often Yes       | No                        |


Options:


| Option             | Act                                                                                |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Minimal**        | Only declare what you collect today; no ATT (no cross-app tracking)                |
| **With analytics** | Add analytics SDK → declare; get consent where required                            |
| **ATT**            | Only if you **track** across apps/sites (Ads/IDFA)—Pulse Flow likely **skips ATT** |




### Account deletion (5.1.1(v)) — hard requirement if account creation exists


| Option                                       | Implementation                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| **A. In-app Delete account** (required path) | Settings → Delete account → confirm → wipe/anonymize profile + auth user        |
| **B. Web-only delete**                       | **Not enough** alone if the iOS app creates accounts                            |
| **C. Support email delete**                  | Allowed as *part of* process, but Apple still expects initiation **in the app** |


Also offer:

- [ ] Export or explain retention (bills/stays may need legal hold—document it)  
- [ ] Company owner leaving vs deleting org (define behavior)

**Gap today:** Privacy mentions request deletion; **build in-app delete before Store submission.**

---



## Step 6 — Sign-in & Sign in with Apple (5.1.1)


| Current                                          | Email + password + passkeys                                        |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| **If you add** Google / Facebook / etc. as login | You must also offer **Sign in with Apple** (equivalent prominence) |
| **If you stay** email + passkey only             | Sign in with Apple **not** mandatory                               |


Options:


| Option                  | Act                                        |
| ----------------------- | ------------------------------------------ |
| Keep email/passkey only | No SIWA work                               |
| Add Google later        | Add SIWA at the same time                  |
| SIWA as primary         | Nice for iOS UX; still keep email fallback |


---



## Step 7 — User-generated content & messaging (1.2)

Pulse Flow has chat, photos, guest notes, endorsements → treat as UGC.

Apple requires:

1. Filter / prevent obvious abuse (block words, attach limits, or human moderation path)
2. **Report** offensive content
3. **Block** abusive users
4. Published contact information


| Option                      | How to satisfy                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Minimal viable**          | Report button on messages/profiles → email/support ticket; block user hides their messages; support@ monitored |
| **Stronger**                | Admin moderation queue; auto-filters; rate limits                                                              |
| **Host-only guest Support** | Still UGC—guest↔host messages need report/block too                                                            |


**Status:** MVP shipped in web app — Report / Block on team chat + guest Support; block list in Settings; `content_reports` + `user_blocks` (migration `057`). Monitor `support@pulseflow.site`. Stronger admin queue still optional.

---



## Step 8 — Age rating & Kids (1.3, 2.3.6, 5.1.4)

Pulse Flow is **adult ops / guest stays**, not for children.


| Option                   | Choice                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Kids Category            | **No**                                                                                                          |
| Age rating questionnaire | Answer honestly: UGC / messaging → typically **12+** or **17+** depending on unrestricted chat; no mature media |
| Metadata                 | Do **not** say “For Kids”                                                                                       |


---



## Step 9 — Permissions & purpose strings (2.5.14, 5.1.5)

Only request what you use; explain clearly in `Info.plist`:


| Permission             | Pulse Flow use                                  | Options                                            |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Camera / Photo Library | Villa photos, receipts, stay photos, task proof | Request at moment of use                           |
| Location               | Talent near-me / map pin (optional)             | Don’t force for core login; allow manual area text |
| Notifications          | Push alerts                                     | Optional; never gate core app on allowing push     |
| Face ID                | Passkeys / LocalAuthentication                  | Already aligned with 2.5.13 spirit                 |


---



## Step 10 — Design / minimum functionality (4.2)

If you wrap the website:


| Option                        | How to avoid “repackaged website” rejection                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Native value pack**         | Push notifications, Face ID unlock, share sheet, offline cache for today’s jobs, camera capture pipeline, home-screen widgets |
| **Role-specific native home** | Different first screens for Owner / Staff / Guest (not one generic WebView)                                                   |
| **Do not**                    | Ship only a full-screen `WKWebView` with Safari chrome removed and no native features                                         |


---



## Step 11 — App Store Connect metadata (2.3)

Prepare assets:


| Item                   | Options / tips                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| **Name** (≤30 chars)   | `Pulse Flow`                                                                                           |
| **Subtitle**           | e.g. `Villa ops for owners & staff`                                                                    |
| **Category**           | Primary: **Business** · Secondary: **Productivity**                                                    |
| **Keywords**           | villa, rental, property management, housekeeping—no competitor trademark stuffing                      |
| **Description**        | Role-based value; mention Personal free vs Company subscription **accurately** for your billing option |
| **Screenshots**        | Real in-app UI (Home, Jobs, Guest Stay, Messages)—**not** only login/splash (2.3.3)                    |
| **App icon**           | Same family as PWA icons; no Apple marks                                                               |
| **Privacy Policy URL** | `https://app.pulseflow.site/privacy`                                                                   |
| **Support URL**        | Dedicated help page                                                                                    |
| **What’s New**         | Specific feature list each version                                                                     |


Storefronts:


| Option       | Act                               |
| ------------ | --------------------------------- |
| Global       | All territories                   |
| Soft launch  | Thailand + selected markets first |
| Geo-restrict | Only if legal reason              |


---



## Step 12 — App Privacy, encryption, and export


| Item              | Options                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Encryption        | Standard HTTPS only → answer export compliance accordingly (usually exempt) |
| Third-party SDKs  | List Supabase, Stripe, push vendor, analytics—if any                        |
| Data deletion URL | Can match support/privacy page                                              |


---



## Step 13 — TestFlight before App Review (2.2)


| Option              | Act                                                        |
| ------------------- | ---------------------------------------------------------- |
| Internal TestFlight | Team only                                                  |
| External TestFlight | Beta users; still guideline-compliant; no paid beta access |
| Skip to App Review  | Riskier; use only if QA is solid                           |


---



## Step 14 — Submit for Review — Notes template

Copy/adapt:

```
Pulse Flow is a multi-role villa operations app (owners, managers, field staff, guests).

BUSINESS MODEL:
[Pick one and delete others]
- Free iOS client; subscriptions only on the website; no purchase CTAs in the iOS app (3.1.3f).
- OR: Company Full is an auto-renewable IAP; web Stripe users can restore multiplatform access (3.1.3b).
- OR: Enterprise-only org sales; consumer Personal signup disabled in this binary (3.1.3c).

DEMO ACCOUNTS: (see Step 3)

UGC: Team chat and guest Support — ⋯ menu → Report or Block; unblock in Settings → Blocked people.
ACCOUNT DELETION: Settings → Delete account (also /support).
LOCATION/CAMERA: optional job/photo capture; purpose strings TBD for native.
See docs/APP_STORE_REVIEW_NOTES.md for demo logins.

Contact: support@pulseflow.site
```

---



## Step 15 — After submit (Apple’s “After You Submit”)


| Situation            | Options                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| Waiting              | Watch App Store Connect status; keep backend up                           |
| Rejection            | Reply in Resolution Center with fixes · or Appeal · or Guideline feedback |
| Metadata-only issues | Fix screenshots/text and resubmit                                         |
| Binary issues        | New build + notes what changed                                            |
| Need speed           | Expedited review only for real deadlines (don’t abuse)                    |
| Approved, not live   | Check release date / phased release                                       |


---



## Master gap list for Pulse Flow (do before first submission)

Must-have if shipping an App Store binary:

1. [x] Choose distribution path (Step 0) → **D Native** (decision logged)  
2. [ ] Choose billing path (Step 4)  
3. [ ] Organization (or Individual) Developer enrollment  
4. [x] In-app **Delete account** (Settings + API)  
5. [x] Chat **Report** + **Block** (MVP; monitor support@)  
6. [x] Stable **demo accounts** for all roles (`owner|manager|employee|guest@pulseflow.site` / `TestPass123!` + welcome demos)  
7. [x] Support URL page live (`/support`)  
8. [ ] Privacy questionnaire filled to match real data  
9. [ ] If free-companion billing: **strip** Stripe upgrade CTAs from iOS build  
10. [ ] If IAP billing: StoreKit products + server receipt/entitlement sync  
11. [ ] Screenshots + description for Store sizes — welcome frost/dark in `docs/welcome-shots/`; still need logged-in Home/Jobs/Messages for listing; do **not** claim a full Airbnb/Booking.com API  

12. [ ] Counsel pass on Terms/Privacy  
13. [ ] Native iOS app (not bare WebView) — aligns with Step 0D 

Nice-to-have:

- [ ] Sign in with Apple (if adding other social logins)  
- [ ] Soft-launch storefronts  
- [ ] Widget / rich push for native differentiation  

---



## Suggested phased plan


| Phase  | Action                                                         |
| ------ | -------------------------------------------------------------- |
| **P0** | Decide: PWA-only vs App Store; if Store → billing option 1/2/3 |
| **P1** | Enroll Developer Program (Organization if possible)            |
| **P2** | ~~Build delete-account + report/block + support page~~ **done** |
| **P3** | Native shell or RN/Swift app with real native hooks            |
| **P4** | TestFlight internal → external                                 |
| **P5** | App Review with full demo notes                                |
| **P6** | Soft launch → global                                           |


---



## Quick “which billing option?” flowchart

```
Need App Store listing?
├─ No  → Stay PWA (Step 0A). Stop.
└─ Yes → Will users buy Company Full inside the iOS app?
         ├─ Yes → Implement StoreKit (Option 1 or 2).
         └─ No  → Free companion (Option 3):
                  remove all subscribe/upgrade CTAs from iOS binary;
                  keep Stripe on website/PWA only.
```

---



## References

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)  
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)  
- [Offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/)  
- Pulse Flow role guide: `[FEATURE_GUIDES_BY_AUDIENCE.md](./FEATURE_GUIDES_BY_AUDIENCE.md)`  
- Company paid features: `[COMPANY_FEATURES.md](./COMPANY_FEATURES.md)`  
- Production checklist: `[PRODUCTION.md](./PRODUCTION.md)`

---



## Decision log (fill as you go)


| Step                      | Choice                         | Owner | Date       |
| ------------------------- | ------------------------------ | ----- | ---------- |
| 0 Distribution            | D Native                       |       | 2026-10-16 |
| 1 Enrollment              | Individual — Anastasia Boltrushevich | Anastasia Boltrushevich | 2026-10-21 |
| 2 Support URL             | `/support` shipped             |       | 2026-10-16 |
| 4 Billing                 |                                |       |            |
| 5 Account deletion design | In-app Settings → Delete       |       | 2026-10-16 |
| 7 UGC moderation          |                                |       |            |
| 11 Categories / age       |                                |       |            |
| First TestFlight          |                                |       |            |
| First App Review submit   |                                |       |            |


