# Is Token-Gated Premium Allowed?

**Note:** Pulse has moved to a **policy-safe** model: Premium = IAP only in the app; $PULSE utility lives off-app (protocol credits, governance, Lab). See [Token utility (policy-safe)](./token-utility.md). This doc is kept for reference if you ever consider read-only token gating elsewhere.

---

Short answer: **yes on PWA (web)**; **likely OK on Google Play** if you stay read-only and declare; **no on the iOS App Store**.

---

## Your model (Pulse)

- **Premium tier** = user has locked $PULSE (or holds a certain amount).
- **App behavior** = read-only check of chain/wallet (e.g. lock balance or NFT); no in-app purchase of the token, no in-app swap/sell. User locks elsewhere (e.g. Pump.fun, your site); the app only verifies and unlocks features.

---

## 1. PWA (web only, no store)

- **Allowed.** No store policy. You can gate premium by token/NFT/locking as long as you comply with law (e.g. securities, consumer protection, privacy in your jurisdiction).
- Best from a “is it allowed?” perspective: PWA + optional Google Play (below).

---

## 2. Google Play (Android / TWA)

- **Generally compatible** with read-only token gating, but you must follow Play’s blockchain and payments rules.

**Blockchain-based content (Google Play):**

- Apps that **sell or let users earn** tokenized digital assets must declare **Financial features** in Play Console and follow the [Blockchain-based Content](https://support.google.com/googleplay/android-developer/answer/13607354) policy.
- Your app does **not** sell or distribute $PULSE; it only **reads** chain state to unlock premium. That’s closer to “membership gated by external proof” than “selling/earning tokens in the app.”
- **Cryptocurrency exchanges/wallets:** If the app only **displays** wallet/balance and **does not** facilitate purchase, exchange, or custody, you’re not in the “exchange/wallet” category. Linking out to lock elsewhere is typically OK if clearly disclosed.
- **Transparency:** In store listing and in-app, clearly state that “Premium is unlocked by locking $PULSE on Solana (lock for as long as you want the paid tier)” and where/how users do that (e.g. “Lock at …” link). Avoid implying that using the app itself earns or pays out tokens unless it does.

**Payments policy:**

- Google requires use of **Google Play Billing** for in-app purchases of digital goods/features **inside the app**. If premium is **only** unlocked by holding/locking a token (no in-app “Buy premium with card”), you are not selling a digital good through the app; you’re gating by an external condition. Many apps that gate by “connect wallet / hold X” do not use Play Billing for that gate.
- To reduce risk: don’t offer an explicit “Buy premium with real money” in-app alternative that bypasses Play Billing. If you later add a **paid** “Premium subscription” (USD/card), that must go through Play Billing.

**Practical steps for Google Play:**

1. In Play Console, complete **App content** (e.g. Privacy policy, Data safety). If asked about financial/crypto features, describe “read-only check of lock balance to unlock premium; no sale or exchange of crypto in the app.”
2. In store listing and in-app, be **transparent**: “Premium is unlocked by locking $PULSE (Solana) for as long as you want the paid tier. No in-app purchase of tokens.”
3. If your app ever **sells** or **rewards** tokenized assets, declare **Financial features** and follow the full [Blockchain-based Content](https://support.google.com/googleplay/android-developer/answer/13607354) and [Cryptocurrency Exchanges and Software Wallets](https://support.google.com/googleplay/android-developer/answer/16329703) policies.
4. When in doubt, request **policy guidance** via Play Console (Help → Contact support).

---

## 3. iOS App Store (you’re not shipping here)

- **Not allowed** for token/crypto gating of content or features.  
  Apple’s guidelines say apps may not use “their own mechanisms to unlock content or functionality,” including “cryptocurrencies and cryptocurrency wallets.” So using “hold or lock token X to unlock premium” would violate that.
- Staying **PWA + Google Play only** avoids this.

---

## 4. Legal / regulatory (all distribution)

- **Securities:** Depending on jurisdiction, $PULSE or “lock to get premium” could be scrutinized. Get legal advice if you’re not sure.
- **Consumer protection:** Clear, honest description of how premium is obtained (locking off-app, what $PULSE is, where to lock (lock for as long as you want the paid tier)) reduces risk.
- **Privacy:** If you read wallet addresses or chain data, say so in your privacy policy and Data safety / App content forms.

---

## Summary

| Distribution       | Token-gated premium (read-only check) |
|--------------------|----------------------------------------|
| **PWA (web)**      | Allowed; comply with local law.        |
| **Google Play**    | Allowed if read-only, transparent, no in-app sale of tokens; declare financial/crypto if required. |
| **iOS App Store**  | Not allowed (crypto cannot gate content/functionality). |

Your current design (read-only lock check, no in-app token sale) is aligned with what’s typically allowed on **PWA** and **Google Play**. Keep the app read-only for token/balance, be transparent in store and in-app, and declare any financial/crypto features in Play Console if the forms ask for it.
