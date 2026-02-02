# Pulse App Icon & Color Design System

**Implementation:** Block registry is in `apps/mobile/src/blocks/registry.ts` and `apps/web/src/blocks/registry.ts` (currently emoji icons). Theme colors in `apps/mobile/src/theme/colors.ts` and `apps/web/src/theme/colors.ts`. Use this doc when adding Iconify or block-specific colors.

---

## Design Philosophy

Modern, clean wellness app with vibrant gradient colors and minimalist line icons. Dark mode optimized with neon accent colors that pop against dark backgrounds.

---

## App Blocks - Icons & Colors

### 1. Body Signals
- **Icon**: Heart with pulse line (medical/vital signs)
- **Icon Name**: `solar:heart-pulse-linear` (Iconify)
- **Color**: Pink-400 (`#f472b6` / `rgb(244, 114, 182)`)
- **Gradient**: `from-pink-500 to-rose-500`
- **Use Case**: Sleep quality, energy levels, mood tracking, vital signs

### 2. Work Routine
- **Icon**: Laptop (productivity/work)
- **Icon Name**: `solar:laptop-linear` (Iconify)
- **Color**: Indigo-400 (`#818cf8` / `rgb(129, 140, 248)`)
- **Gradient**: `from-indigo-500 to-blue-500`
- **Use Case**: Work hours, productivity, focus time, breaks

### 3. Nutrition
- **Icon**: Leaf (natural/organic/health)
- **Icon Name**: `solar:leaf-linear` (Iconify)
- **Color**: Green-400 (`#4ade80` / `rgb(74, 222, 128)`)
- **Gradient**: `from-green-500 to-emerald-500`
- **Use Case**: Meals, hydration, supplements, dietary habits

### 4. Movement
- **Icon**: Running figure (exercise/activity)
- **Icon Name**: `solar:running-linear` (Iconify)
- **Color**: Orange-400 (`#fb923c` / `rgb(251, 146, 60)`)
- **Gradient**: `from-orange-500 to-amber-500`
- **Use Case**: Exercise, steps, workouts, physical activity

### 5. Recovery
- **Icon**: Moon with stars (rest/sleep)
- **Icon Name**: `solar:moon-stars-linear` (Iconify)
- **Color**: Purple-400 (`#c084fc` / `rgb(192, 132, 252)`)
- **Gradient**: `from-purple-500 to-violet-500`
- **Use Case**: Sleep, rest days, meditation, relaxation

---

## Additional UI Icons

### Core Features
- **Pulse Score**: `solar:bolt-linear` - Indigo-400
- **AI Insights**: `solar:chat-round-dots-linear` - Purple-400
- **Privacy/Security**: `solar:shield-check-linear` - Green-400
- **Analytics/Trends**: `solar:chart-2-linear` - Purple-300
- **Premium**: `solar:star-linear` - Amber-300

### Actions
- **Check/Complete**: `solar:check-circle-linear` - Green-400
- **Arrow Right**: `solar:arrow-right-linear` - Indigo-500
- **Close**: `solar:close-circle-linear` - Neutral-400

---

## Color Palette

### Primary Colors (blocks)
```css
--pink-400: #f472b6;
--indigo-400: #818cf8;
--green-400: #4ade80;
--orange-400: #fb923c;
--purple-400: #c084fc;
```

### Background & Glass Effects
```css
--bg-dark: #050505;
--bg-darker: #080808;
--glass-bg: rgba(30, 30, 30, 0.4);
--glass-border: rgba(255, 255, 255, 0.05);
```

### Gradients
```css
/* Body Signals */
background: linear-gradient(to bottom right, #ec4899, #f43f5e);

/* Work Routine */
background: linear-gradient(to bottom right, #6366f1, #3b82f6);

/* Nutrition */
background: linear-gradient(to bottom right, #22c55e, #10b981);

/* Movement */
background: linear-gradient(to bottom right, #f97316, #f59e0b);

/* Recovery */
background: linear-gradient(to bottom right, #a855f7, #8b5cf6);
```

---

## Design Specifications

### Icon Sizes
- **Large (Hero)**: 5xl (text-5xl / 48px)
- **Medium (Cards)**: 4xl (text-4xl / 36px)
- **Small (Inline)**: 2xl (text-2xl / 24px)

### Card Styles
```css
.glass-card {
  background: rgba(30, 30, 30, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-4px) scale(1.05);
  background: rgba(40, 40, 40, 0.6);
  border-color: rgba(255, 255, 255, 0.15);
}
```

### Icon Animation
```css
.icon-hover {
  transition: transform 0.3s ease;
}

.icon-hover:hover {
  transform: scale(1.1);
}
```

---

## AI Image Generation Prompt

**For generating wellness/health themed images or illustrations:**

```
Create a modern, minimalist wellness app icon in a [COLOR] gradient style. 
The icon should be a simple line art design representing [CATEGORY]. 
Use a dark background (#050505) with vibrant neon [COLOR] (#HEX) for the icon. 
The style should be clean, professional, and suitable for a premium health tracking app. 
Include subtle glow effects and maintain a 1:1 aspect ratio.

Style: Minimalist line art, dark mode, neon gradients
Colors: [Primary color] with subtle glow
Background: Very dark (#050505)
Mood: Modern, premium, wellness-focused
```

**Example for Body Signals:**
```
Create a modern, minimalist wellness app icon in a pink gradient style. 
The icon should be a simple line art design representing vital signs and body health (heart with pulse line). 
Use a dark background (#050505) with vibrant neon pink (#f472b6) for the icon. 
The style should be clean, professional, and suitable for a premium health tracking app. 
Include subtle glow effects and maintain a 1:1 aspect ratio.
```

---

## Implementation Notes

### Icon Library
- **Recommended**: Iconify with Solar icon set
- **Alternative**: Lucide Icons, Heroicons
- **Format**: SVG for scalability
- **Weight**: Linear (outline style)

### Accessibility
- Minimum contrast ratio: 4.5:1 for text
- Icon + text label for clarity
- Touch target: minimum 44x44px
- Color is not the only indicator

### Responsive Behavior
- Mobile: 2-column grid
- Tablet: 3-column grid  
- Desktop: 5-column grid
- Icons scale proportionally

---

## Quick Reference Table

| Block | Icon | Iconify Name | Color | Hex |
|-------|------|--------------|-------|-----|
| Body Signals | Heart + Pulse | `solar:heart-pulse-linear` | Pink-400 | `#f472b6` |
| Work Routine | Laptop | `solar:laptop-linear` | Indigo-400 | `#818cf8` |
| Nutrition | Leaf | `solar:leaf-linear` | Green-400 | `#4ade80` |
| Movement | Running | `solar:running-linear` | Orange-400 | `#fb923c` |
| Recovery | Moon + Stars | `solar:moon-stars-linear` | Purple-400 | `#c084fc` |

---

## Copy-Paste Code Snippets

### Block config (for registry)
```ts
const appBlocks = [
  { id: 'body-signals', name: 'Body Signals', icon: 'solar:heart-pulse-linear', color: '#f472b6' },
  { id: 'work-routine', name: 'Work Routine', icon: 'solar:laptop-linear', color: '#818cf8' },
  { id: 'nutrition', name: 'Nutrition', icon: 'solar:leaf-linear', color: '#4ade80' },
  { id: 'movement', name: 'Movement', icon: 'solar:running-linear', color: '#fb923c' },
  { id: 'recovery', name: 'Recovery', icon: 'solar:moon-stars-linear', color: '#c084fc' },
];
```

### CSS Variables
```css
:root {
  --body-signals: #f472b6;
  --work-routine: #818cf8;
  --nutrition: #4ade80;
  --movement: #fb923c;
  --recovery: #c084fc;
}
```

### Tailwind Classes
```html
<!-- Body Signals -->
<div class="text-pink-400 bg-gradient-to-br from-pink-500 to-rose-500">

<!-- Work Routine -->
<div class="text-indigo-400 bg-gradient-to-br from-indigo-500 to-blue-500">

<!-- Nutrition -->
<div class="text-green-400 bg-gradient-to-br from-green-500 to-emerald-500">

<!-- Movement -->
<div class="text-orange-400 bg-gradient-to-br from-orange-500 to-amber-500">

<!-- Recovery -->
<div class="text-purple-400 bg-gradient-to-br from-purple-500 to-violet-500">
```

### Iconify usage (React)
```bash
npm install @iconify/react
```
```jsx
import { Icon } from '@iconify/react';

<Icon icon="solar:heart-pulse-linear" className="text-5xl text-pink-400" />
```

---

## Resources

- **Iconify (Solar)**: https://icon-sets.iconify.design/solar/
- **Tailwind Colors**: https://tailwindcss.com/docs/customizing-colors
- **Glassmorphism**: https://hype4.academy/tools/glassmorphism-generator

---

**Last Updated**: 2026-02-02  
**Version**: 1.0
