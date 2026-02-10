# Notifications: 9am & 9pm local time

Pulse can remind users to check in at **9am and 9pm in their local timezone**.

---

## What’s implemented (PWA)

- **Profile → Notifications:** Toggle “Daily reminders (9am & 9pm local time)”. When enabled, the app requests browser notification permission.
- **When the app is open:** A timer runs every minute. If the current local time is 9:00–9:05 or 21:00–21:05 and we haven’t already sent that slot today, the app shows a local notification (“Good morning” / “Evening check-in”).
- **Preference:** Stored in `localStorage` under `@pulse/notifications_9_21`. “Already sent today” for 9am and 9pm is stored in `@pulse/notifications_last_9am` and `@pulse/notifications_last_9pm`.

So **9am and 9pm are in the user’s local time** (based on the device clock). Notifications only fire when the logic runs (e.g. app open in foreground or background, depending on the browser).

---

## Limitations (web)

- **No true “wake at 9am”:** Browsers don’t let a web app schedule a notification for an exact future time. So we only fire when our code runs (e.g. every minute while the app is loaded).
- **Background:** If the user closes the tab or the browser throttles the page, the timer may stop and they might not get 9am/9pm. For reliable delivery when the app isn’t open, you need **Web Push** (see below).

---

## Optional: Web Push for 9am & 9pm (backend)

For reminders that can fire even when the app is closed:

1. **VAPID keys:** Generate a key pair (e.g. `web-push generate-vapid-keys`) and store the public key in the PWA and the private key on the server.
2. **Subscribe in the PWA:** After the user enables notifications, use `registration.pushManager.subscribe()` with the public key and send the subscription (endpoint + keys) to your API.
3. **Store per user:** Save `user_id`, `subscription` (JSON), and **timezone** (e.g. from `Intl.DateTimeFormat().resolvedOptions().timeZone` or a user setting).
4. **Cron job:** Run a job every hour (or every 15 minutes). For each user who has notifications on and a stored timezone, check if it’s 9am or 9pm in that timezone; if so and you haven’t sent that slot today, send a Web Push payload to their subscription.
5. **Service worker:** In the PWA’s service worker, handle `push` events and show the notification with title/body.

Then 9am and 9pm are driven by the server using the user’s timezone, and users can get reminders even when the tab is closed.

---

## Summary

| Feature | Status |
|--------|--------|
| Toggle in Profile | Done |
| 9am & 9pm local when app is open | Done (timer every minute) |
| 9am & 9pm when app closed | Requires Web Push + backend cron |
