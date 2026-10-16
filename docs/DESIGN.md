# Pulse Flow Design Bible — Horizon

> **Source of truth for every design decision** on the marketing site and the Pulse Flow app.
> Agents: read this file first before changing UI, copy, colour, type, motion, or components.
> Visual companion: [`docs/design-brief.html`](docs/design-brief.html)

**Language name:** Horizon  
**Product:** Pulse Flow — the pulse of your rental operations  
**Feeling:** energetic + serious · light · airy · inspiring · professional · competitive  
**Primary audience:** Israeli property owners and operators (remote control of villas / short-term rentals), with managers, field staff, and guests as secondary roles.

---

## 0. Agent rules (non-negotiable)

1. **Read this file first** for any visual or UX change (site or app).
2. **Reuse tokens and components.** Do not invent new hex colours, radii, shadows, or button styles.
3. **No raw colours in UI code.** Use CSS variables / theme tokens only.
4. **Less is more.** If a section can lose an element without losing meaning, remove it.
5. **One job per section.** One headline, one short lead, one primary action when possible.
6. **Hero budget:** brand + one H1 + one supporting line + one CTA group + one dominant property visual. No stat strips, badge piles, or promo chips in the first viewport.
7. **Mobile-first.** Design phone first; desktop is an expansion, not the default.
8. **RTL-ready.** Hebrew and Arabic must work; never assume LTR-only layout.
9. **Property-connected visuals only.** Real villas, pools, decks, keys, work on site — not abstract purple blobs or stock “team smiling at laptop.”
10. **When unsure:** open `docs/design-brief.html`, match what you see there, then implement with tokens below.

---

## 1. Whiteboard — what users should feel

| Feel | Means in UI |
| --- | --- |
| Energetic | Orange CTAs, amber highlights, purposeful micro-motion |
| Serious | Deep ink `#023047`, clear hierarchy, no emoji decoration |
| Light / airy | Cool white surfaces, sky washes, generous whitespace |
| Inspiring | Horizon hero, property photography, “I want to open the app” |
| Professional | Tight type scale, consistent components, competitive calm |
| In control | Status clarity, money attached to property, no chat chaos |

**Promise in one line:**  
*Out of the group chat — into a clear day over your properties.*

---

## 2. Principles (ruthless elimination)

1. **Clarity beats cleverness.** Israeli operators skim; lead with outcome, not features.
2. **Eliminate before decorate.** Whitespace is a feature.
3. **Role = screen.** Don’t invent permission UI; each role has its own surface.
4. **Chat stays; ops leave the chat.** Design never pretends to replace WhatsApp — it picks up where chat fails.
5. **Motion serves presence.** 2–3 intentional motions per major surface; no ambient noise.
6. **Trust is visual.** Show property photo + status + money trail. Don’t hide operations behind illustrations alone.
7. **Selective trends only.** Adopt mobile-first, airy heroes, meaningful micro-interactions. Skip VR/AR, brutalism, maximalist noise, purple SaaS clichés.

Inspired by: [Web design trends 2026](https://designmodo.com/web-design-trends/), [Design language](https://www.uxdesigninstitute.com/blog/create-a-design-language/), vibe-code consistency (tokens → components → no drift).

---

## 3. Mental image

Horizon is a **clear coastal morning over a villa portfolio**: sky blues, deep sea ink, sun-orange action. The page feels like opening shutters — light floods in, the day is organised, you want to operate.

Orange (`#f26a36`, logo mark) is the **action sun** — CTAs, focus, “do this now.”  
Navy (`#023047`) is **authority** — text, structure, seriousness.  
Sky (`#8ecae6` / `#219ebc`) is **air and calm** — atmosphere, secondary UI, trust.  
Amber (`#ffb703`) is **warm signal** — highlights, Pro, attention without alarm.

---

## 4. Colour tokens

### Core palette (locked)

| Token | Hex | Role |
| --- | --- | --- |
| `--sky-soft` | `#8ecae6` | Atmosphere, soft fills, charts (cool) |
| `--sky` | `#219ebc` | Links, info, secondary actions, focus rings (cool) |
| `--ink` | `#023047` | Primary text, headers, nav weight |
| `--sun` | `#ffb703` | Amber accent, Pro, highlights |
| `--action` | `#f26a36` | **Main** CTA, primary buttons, brand energy |

### Surfaces & neutrals

| Token | Hex / value | Role |
| --- | --- | --- |
| `--surface` | `#ffffff` | Cards, sheets |
| `--canvas` | `#f5fafc` | Page background (cool white, sky-tinted — **not** warm cream) |
| `--canvas-deep` | `#e8f4f8` | Alternate bands, soft panels |
| `--muted` | `#5a6d78` | Secondary text (on canvas) |
| `--border` | `rgba(2, 48, 71, 0.12)` | Hairlines |
| `--success` | `#2a9d8f` | Confirmed / paid (keep distinct from sky) |
| `--danger` | `#e63946` | Urgent / delete (sparingly) |

### Mapping from old Pulse tokens (migration)

| Old | New |
| --- | --- |
| `--primary` / coral `#f07a3a` | `--action` `#f26a36` |
| `--sand` warm cream | `--canvas` `#f5fafc` |
| `--ink` warm brown | `--ink` `#023047` |
| `--secondary` teal | Prefer `--sky` / `--success` by meaning |

### Usage rules

- **Primary button:** `--action` fill, white label, soft orange shadow.
- **Secondary button:** transparent or white, `--ink` text, `--border` stroke; hover sky-soft wash.
- **Text on orange / amber:** white or `#023047` only if contrast ≥ 4.5:1; prefer white on `--action`.
- **Never** use purple/indigo gradients, terracotta-on-cream, or broadsheet dense columns.
- **Never** put raw hex in components — only `var(--token)`.

---

## 5. Typography

Four tiers, every page. Nothing outside these.

| Tier | Role | Font · weight | Size token | Used for |
| --- | --- | --- | --- | --- |
| 1 | Headline | **Sora** 700, −0.02em | `--type-hero` (h1) · `--type-title` (h2) | H1, H2, brand wordmark, CTAs (600) |
| 2 | Subheading | **Heebo** 700, −0.01em | `--type-subtitle` (h3) · `1.0625rem` (h4, FAQ) | H3, H4, card / plan / flip titles, `<summary>` |
| 3 | Body | **Heebo** 500 | `--type-body` | Paragraphs, lists, hero lead (`.pf-sub` slightly larger) |
| 4 | Sign & note | **Heebo** 600 uppercase 0.1em · **Heebo** 500 | `--type-sign` · `--type-meta` | Eyebrows / kickers (sky) · captions, chips, footnotes (muted) |

**IBM Plex Mono** is reserved for code and tool names (`pulse_*`, config snippets). Never for labels or notes.

Weights above 700 are not loaded — never write `font-weight: 800/900` (the browser would fake-bold).  
RTL (`he`, `ar`): Sora has no Hebrew / Arabic glyphs, so tier 1 switches to Heebo 700 automatically; the scale is unchanged.

### Scale (mobile → desktop clamp)

| Token | Size |
| --- | --- |
| `--type-hero` | `clamp(2.25rem, 1.6rem + 2.5vw, 3.5rem)` |
| `--type-title` | `clamp(1.5rem, 1.2rem + 1vw, 2rem)` |
| `--type-subtitle` | `clamp(1.125rem, 1.05rem + 0.35vw, 1.3rem)` |
| `--type-body` | `1rem` (16px base) |
| `--type-meta` | `0.8125rem` |
| `--type-sign` | `0.75rem` (uppercase, tracked) |

**Weights:** Headline 700 · Subheading 700 · Body 500 · Signs 600 · Notes 500. Max loaded weight is 700.  
**Line height:** Hero ~1.1 · Title ~1.2 · Body ~1.55.  
**Avoid:** Inter, Roboto, Arial, system-ui as brand faces.

Hebrew copy: slightly denser line-height (`1.6`); keep the same scale.

---

## 6. Primary visuals

### Must

- Real **property photography** (villa, pool, deck, door, site work).
- Hero = **full-bleed or dominant edge-to-edge** property plane (marketing), or a living “horizon” atmosphere (soft sky gradient + slow breath) with property focal point.
- App screenshots: show **villa photo on cards** (jobs, properties) — never house-icon placeholders when a photo exists.

### Breathing / motion background

- Soft sky gradient (`--sky-soft` → `--canvas`) with slow opacity or translate on a horizon band (8–16s loop).
- Prefer CSS/`prefers-reduced-motion` respectful animation; pause when reduced motion is requested.

### Forbidden as main idea

- Abstract purple mesh, neon glow stacks, emoji rows, floating badge stickers on hero media.
- Inset rounded media cards as the *only* hero (unless the design system explicitly requires phone mockups for feature sections).

---

## 7. Design language — Horizon

### Voice (copy)

| Trait | Do | Don’t |
| --- | --- | --- |
| Direct | “Know what is happening without asking.” | “Unlock synergistic workflows.” |
| Serious energy | Short verbs: Start free, Open demo, Confirm | Soft fluff: “maybe,” “journey,” “magic” |
| Israeli-first | Respect Hebrew RTL; clear money & control language | US-startup slang as default |
| Trust | Show deposit, bill, confirmation states | Hide costs in metaphors |

**Audience motives (Israeli owners/operators):**

1. **Remote control** — see the day without calling the manager.  
2. **Money trail** — every shekel/baht tied to a property.  
3. **Staff reliability** — job accepted, not “maybe in WhatsApp.”  
4. **Language** — write once, team reads in their language.  
5. **Serious product** — looks like a tool you’d pay for, not a toy.

### Patterns

| Pattern | Spec |
| --- | --- |
| Radius card | `1rem` (`--radius-card`) |
| Radius control | `0.75rem` |
| Radius CTA | `999px` pill for primary CTAs only |
| Shadow soft | `0 1px 2px rgba(2,48,71,.04), 0 8px 24px rgba(2,48,71,.06)` |
| Shadow CTA | `0 8px 20px rgba(251,133,0,.28)` |
| Section gap | `clamp(3rem, 6vw, 5.5rem)` |
| Content max | `72rem` wrap; prose `40rem` |

### Components (reuse; don’t fork)

- **Button primary** — `--action`, pill, white text  
- **Button secondary** — outline ink  
- **Phone frame** — white bezel, soft shadow, real screenshot  
- **Audience card** — no heavy chrome; icon + title + one line + text CTA  
- **Status chip** — confirmed = success soft; awaiting = amber soft; urgent = danger soft  
- **Agent block** — sky-tinted panel, mono tools list, after “who it’s for”

### Motion language

| Motion | When |
| --- | --- |
| Horizon breath | Hero atmosphere only |
| Fade-up enter | Sections on scroll (once) |
| Button press | Scale 0.98 / 120ms |
| Agent demo replay | Scripted chat only |

No autoplaying video sound. Loom embeds stay user-initiated.

---

## 8. Layout & page architecture (site)

**Homepage order (fixed intent):**  
Problems → Features → Language → **Who it’s for (roles)** → **Connect your agent** → Plans → Referral → FAQ → Demo.

**Owners:** Videos (title only, no fluff lead) → Hero headline/CTA → Flagship features with phone shots → Agent note → Feature accordion → Demo.

**Brand test:** Remove the nav — the first viewport must still say Pulse Flow, not a generic ops SaaS.

---

## 9. App design notes (use this bible in the product)

Same tokens, type, and voice. Additional:

- Bottom nav / side nav weight uses `--ink`; active = `--action` or white disc on dark bar.  
- Property cards **always** prefer photo cover when available.  
- Lists: one primary action per row; secondary actions collapse.  
- Agent / Pro surfaces use `--sun` sparingly as “Pro” marker, `--sky` for connection/trust.  
- Demo banner: soft `--sky-soft` background, `--ink` text — never alarm red.

---

## 10. Anti-patterns (AI drift guards)

Reject or rewrite if you see:

- New hex values outside this file  
- Warm cream `#F4F1EA` / terracotta / purple-indigo themes  
- Inter / Roboto / Arial as brand fonts  
- Cards in the hero for decoration  
- Stat strips / pill clusters in first viewport  
- Duplicate button variants (“Primary Soft Alt 2”)  
- English-only assumptions that break `he` / `ar`  
- House silhouette placeholders instead of villa photos on jobs/properties  

---

## 11. Early verbal kit (copy anchors)

Use these as north stars; translate via `i18n`, don’t invent new English brands casually.

- **H1 (home):** Get your work out of the group chats  
- **Sub:** Properties, jobs, tasks, vendors, bills and guests in one workspace.  
- **H1 (owners):** Know what is happening without asking questions  
- **Horizon line (optional brand):** Clear day. Clear operations.  
- **CTA:** Start free · See the demo · Open app  
- **Agent:** Connect your agent  

---

## 12. Sources & references

- Feeling / process: user Horizon brief (whiteboard → principles → palette → visuals → language → master brief)  
- Trends (selective): https://designmodo.com/web-design-trends/  
- Design language method: https://www.uxdesigninstitute.com/blog/create-a-design-language/  
- AI consistency: tokens → components → no raw styles (vibe-coded UI discipline)  
- Living presentation: `docs/design-brief.html`

---

## 13. Change control

1. Propose token/component changes in this file first.  
2. Update `docs/design-brief.html` so humans can see it.  
3. Then implement in site CSS / app theme.  
4. Rebuild locales if marketing HTML/copy changes (`python3 scripts/build-locale-sites.py`).
