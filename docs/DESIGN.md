# Pulse Flow design

Read this file before any visual, UX, colour, type, motion, or component change. The tokens live in `packages/pulse-tokens/`. Do not invent a second palette.

This replaces the Horizon bible (Sora, Heebo, sky washes, cream-adjacent canvas). Live screens still paint with the old variables until the adoption pass in the plan below. New work uses these tokens.

Mood: bright, confident, orange and navy, bento layouts, big friendly type. Do not copy another product's layout.

## Surfaces

| Surface | Host | What it is |
| --- | --- | --- |
| Property ops | app.pulseflow.site | PWA for owners, managers, and staff |
| Services | services.pulseflow.site | Local marketplace, also shipping to the App Store |
| Marketing | pulseflow.site | Public site for property ops |
| Services marketing | pulseflow.site/services | Public site for the marketplace |

The brief wrote `service.pulseflow.site`. The host in production is `services.pulseflow.site`. Use that host.

One account works on both app and services subdomains. Language and theme are the same settings on both.

## Colour

Orange is sampled from `public/brand/pulse-mark.svg`, the start stop of the logo gradient: `#F26A36`. The PNG is a blend, so a pixel sample is not the brand orange. The gradient end `#D94E1B` is the pressed orange only. The suggested start `#F26A2E` was not used.

| Token | Hex | Use |
| --- | --- | --- |
| orange-500 | `#F26A36` | One solid orange tile, or one primary button, per screen |
| orange-700 | `#D94E1B` | Pressed orange |
| navy-900 | `#0B1F5C` | Ink: headings, key numbers, nav |
| navy-600 | `#3D4F8A` | Secondary text, and the Order button fill |
| slate-400 | `#8A94AD` | Large type and non-text marks only |
| slate-ink | `#62709B` | Tertiary text |
| peach-100 | `#FFE6D6` | Light-mode highlights and status washes. Not a dark-mode selected surface |
| yellow-300 | `#FFD95E` | Small highlights and status washes |
| page | `#F5F7FC` | Cool white page |
| card | `#FFFFFF` | Cards |
| line | `#E3E8F3` | Borders |
| panel | `#0E1530` | At most one dark panel per light screen |
| success | `#1FA971` | Fill and icons, not small text |
| success-ink | `#157A52` | Success text |
| warning | `#F5A524` | Fill and icons, not small text |
| warning-ink | `#946000` | Warning text |
| danger | `#E5484D` | Fill and icons, not small text |
| danger-ink | `#C4232A` | Danger text |

CSS custom properties use the `--pf-` prefix (`--pf-orange-500`). That keeps this file from overwriting the old `--ink` and `--surface` names while both exist.

### Contrast

Checked as WCAG AA. Small text needs 4.5:1. Large text needs 3:1.

| Pair | Ratio | Small text |
| --- | --- | --- |
| navy-900 on page, card, peach-100, yellow-300 | 11.2 to 15.4 | Pass |
| navy-900 on orange-500 | 5.05 | Pass |
| white on orange-500 | 3.05 | Fail for small text. Still the button label. See Buttons |
| orange-500 on white or page | 3.05 and 2.84 | Fail. Orange is not a text colour |
| navy-600 on page or card | 7.3 to 7.8 | Pass |
| slate-ink on page or card | 4.55 to 4.87 | Pass |
| slate-400 on page or white | 2.83 to 3.03 | Fail. Large type only |
| success, warning, danger fills as small text on white | 2.04 to 3.91 | Fail. Use the ink colours |
| page text on dark page `#0B1024` | 17.6 | Pass |
| secondary text `#C9D0E3` on dark card | 10.6 | Pass |
| slate-400 on dark card | 5.38 | Pass, so it is the dark-mode tertiary |

Button labels are white. Navy text on orange passes contrast and was tried. It was rejected: the label is hard to read, and it does not match Order and Review. White on orange is 3.05:1, under the 4.5:1 small-text line. Keep the label white anyway. Do not put orange type on a light page.

No cream backgrounds. No terracotta. No gradient washes as decoration. One subtle gradient is allowed inside the hero only, from orange-500 toward orange-700, matching the logo.

### Dark mode

The app switch is `data-appearance="frost"` or `data-appearance="dark"`. Frost is the light theme. Dark is the dark theme. Either value wins over the operating system, so a light app stays light when the system is dark, and the reverse. `data-theme="light"` or `data-theme="dark"` does the same when it is set. If neither frost nor an explicit light theme is set, follow the system.

Dark page is `#0B1024`. Cards are `#161E3C`. The `#0E1530` panel stays available, and a light screen still gets only one of them. Orange and the semantic fills do not change. Button labels stay white in both themes.

Selected and highlighted rows are peach-100 with navy-900 text in light mode. In dark mode that peach wash is unreadable under light text. Use a 24 percent mix of orange-500 on the dark card, light ink (`#F5F7FC`), and a border that mixes orange-500 with the dark line. Do not use peach-100 as a selected surface in dark mode.

## Type

Onest for Latin and Cyrillic. Google Fonts serves weights 400, 500, 700, and 800, with Cyrillic in `U+0400–045F` and `U+0460–052F`. Onest has no Thai. Noto Sans Thai is the fallback for `U+0E00–0E7F`. Noto Sans also covers Hebrew, Arabic, and Myanmar, which the product already ships.

Native chrome (tab bar, nav titles) uses the system font. Everything else uses Onest.

| Role | Size | Weight | Tracking |
| --- | --- | --- | --- |
| Meta | 12 | 500 | 0 |
| Label | 14 | 500 | 0 |
| Body | 16 | 400 | 0 |
| Body strong | 18 | 500 | 0 |
| Title | 22 | 700 | -0.02em |
| Title large | 28 | 700 | -0.02em |
| Display | 36 | 800 | -0.03em |
| Display large | 48 | 800 | -0.03em |
| Hero | 64 | 800 | -0.03em |

Headlines are sentence case. Line length stays under 70 characters. Russian and Thai strings run longer than English. Buttons and tiles wrap or grow. They do not truncate a verb.

### Specimens

1. Display, 48, weight 800, navy-900, tracking -0.03em. "Find a pro near you."
2. Title plus body. Title 28, weight 700. Body 16, weight 400, max-width 70ch, navy-600. "You pay the professional directly. Pulse Flow does not guarantee the work, and professionals choose which requests to accept."
3. Expansion. The same control at 16 / 500, min-height 44px, pill radius, white text on orange. English "Find a pro". Russian "Найти мастера". Thai "หาช่างใกล้คุณ". The Thai line must stay inside the control without clipping.

## Shape and depth

| Level | Radius | Used on |
| --- | --- | --- |
| Hero | 28px | Hero panels |
| Card | 20px | Tiles and sheets |
| Control | 14px | Inputs |
| Pill | 999px | Buttons, tags, and filters |

Do not use one radius on every object.

Two shadows, navy-tinted, under 10 percent opacity:

- `--pf-shadow-1`: `0 1px 2px rgba(11, 31, 92, 0.06)`
- `--pf-shadow-2`: `0 8px 24px rgba(11, 31, 92, 0.08)`

Prefer a 1px line and the page-to-card contrast. Most tiles have no shadow.

## Layout

Bento grids. Tile sizes and contents differ on purpose: a photo tile, a number tile, a list tile, an action tile. Never a row of identical cards.

Mobile first at 390px. Respect iOS safe areas. Tap targets are at least 44px.

## Imagery and icons

Real photographs of Koh Phangan: properties, tradespeople at work, local places. If a photo is missing, use a named slot, not a fake image.

Slots: `koh-phangan-villa-pool`, `koh-phangan-tradesperson`, `koh-phangan-place`.

No stock office people. No 3D blobs. No abstract gradients.

One icon set: Phosphor duotone, one stroke weight. Navy-900 for the main tone, orange-500 for the second tone. Do not mix in a second set.

## Motion

One orchestrated moment per page, on the hero. Everything else answers a touch: press state, sheet transition, shared element transition, haptics in the apps. No fade-and-slide on every section. No hover lift on every card. Honor `prefers-reduced-motion`.

## Copy

Say what a thing does, in plain words, from the user's point of view. Buttons name the result: "Find a pro", "Send request". Sentence case. No em dashes. No filler slogans. No lorem ipsum.

## Banned

- Tracked-out all-caps eyebrows above headings
- One word in a headline in a different colour or italic
- Numbered markers unless the steps are a real sequence
- An arrow glyph on every link
- Identical rounded cards with identical shadows
- Meta strings joined by middle dots
- Stat rows of big number, small label, and a gradient accent

## Components

Not built yet. Spec only. Build these after review, from the tokens, with no one-off colours.

### Button

Two fills, both with a white label, pill radius, min-height 44, weight 500.

Primary matches Review, Sign in, and Add new: orange-500 fill, white label. One orange button per screen. Pressed state is orange-700 and the label stays white.

Order matches the contact Order control: navy-600 fill, white label. It can sit beside the one orange button. It is not a second orange.

Secondary: card fill, line border, navy-900 label, no shadow. Disabled: slate-ink label, no orange.

### Tag

Pill radius. Peach-100 or yellow-300 fill, navy-900 label, 12 or 14 type. Not a second button. Filters use the same pill.

### Tile

Radius 20. Page holds a bento, so neighbouring tiles differ in size and in content. Kinds: photo (`koh-phangan-*` slot), number (navy-900 figure, 14 label), list (rows separated by line), action (the single orange tile). Border is `line`. Shadow is optional and only shadow-1. No hover lift.

### Sheet

Card colour, radius 28 on the top corners, shadow-2. Drag handle is a 36 by 4 line. Safe area padding at the bottom. Reduced motion skips the slide and shows the sheet in place.

### Tab bar

System font. Four targets max, 44px tall, plus the home-indicator inset. Active item is navy-900. Inactive is slate-ink in light mode and slate-400 in dark mode. No orange fill behind every tab. Orange marks only the single active icon tone.

### Header

One header for pulseflow.site and pulseflow.site/services. Segmented switch: "Property ops" and "Services". Language switcher is visible: English, Russian, Thai at minimum. Wordmark in navy-900. The apps use their own compact header, system font for the title, same language switcher.

### Form field

Label 14, navy-900. Input radius 14, min-height 44, card fill, line border. Focus ring is a 2px navy-600 outline, not a glow. Error text uses danger-ink. Helper text uses slate-ink.

### Status chip

Pill. Text uses success-ink, warning-ink, or danger-ink. Fill is a light wash of peach-100 or yellow-300, or a 12 percent mix of the semantic colour on the card. Do not set the bright semantic hex as small text on white.

## Not in this pass

Components, the shared marketing header, font loading, and restyling the four surfaces are waiting on review. The tokens file is loaded so the values exist. Existing classes still use the previous theme.
