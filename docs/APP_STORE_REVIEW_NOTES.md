# App Store Review Notes (draft)

Paste into App Store Connect → App Review Information → Notes when the native binary is ready.

---

## Demo accounts (web / TestFlight)

All passwords: `TestPass123!`

| Role | Email |
| ---- | ----- |
| Owner | `owner@pulseflow.site` |
| Manager | `manager@pulseflow.site` |
| Staff | `employee@pulseflow.site` |
| Guest | `guest@pulseflow.site` |

**Fast path (no password):** open https://app.pulseflow.site → welcome → **Try the {role} demo**.

**Sign-in path:** https://app.pulseflow.site/login with any row above.

Suggested walkthrough:

1. Owner demo → Home, Jobs, Team chat (⋯ → Report / Block on a teammate message).
2. Guest demo → Support thread with host.
3. Settings → Delete account (demo signs out; production deletes auth user).
4. Public legal (no login): `/privacy`, `/terms`, `/support`.

---

## UGC (Guideline 1.2)

- **Report:** ⋯ on any team-chat or Support message from another person → Report → stored in `content_reports` (demo acknowledges locally).
- **Block:** same menu → Block → hides their messages; Settings → Blocked people → Unblock.
- **Contact:** support@pulseflow.site · https://app.pulseflow.site/support

---

## Account deletion (Guideline 5.1.1)

Settings → Delete account → confirm → `POST /api/account/delete`. Also documented on `/support`.

---

## Screenshots

Welcome frost/dark shots: `docs/welcome-shots/` and marketing site assets. Prefer logged-in Home / Jobs / Messages once native build is stable for Store listing sizes (6.7", 6.5", 5.5").

---

## Native path (Step 0D)

No App Store binary yet. Distribution today: PWA at `app.pulseflow.site`. Native iOS (SwiftUI or React Native with real native hooks—not a bare WebView) is required before first Connect submission. See `docs/APPLE_APP_STORE_PREP.md`.
