---
name: skylytics-frontend-design
description: Enforces high-quality, distinctive design for the Skylytics flight delay prediction platform. Prevents generic AI aesthetics. Governs both the Next.js web dashboard and SwiftUI iOS app — both must be visually identical in language and feel.
---

# Frontend Design Architect — Skylytics (Global)

This file governs every UI decision across the Skylytics platform. It prevents generic "AI slop" aesthetics and ensures the system looks like a **serious, production-grade aviation intelligence tool** — not a side project or a Tailwind template clone.

---

## Design Thinking

Before writing a single component, commit to the following:

- **Purpose**: This is an aviation operations and passenger intelligence platform. Every screen either helps an **airline manager make a high-stakes decision** or helps a **passenger understand their flight**. The interface must feel authoritative and data-dense without being overwhelming.
- **Tone**: **Precision. Authority. Calm.** Think: an airline operations center meets Bloomberg Terminal meets a modern SaaS product. Not playful. Not bubbly. Not startup-generic. This platform is used during high-pressure operational scenarios — the UI must project control and confidence.
- **Constraints**: Both the Next.js web dashboard and the SwiftUI iOS app must be **visually identical in design language** — same color system, same typography hierarchy, same component vocabulary. A user switching between them should feel zero disorientation.
- **Responsiveness**: Every view must work flawlessly on: widescreen desktop (ops manager), laptop, tablet, and mobile (passenger on iPhone). Mobile-first approach is mandatory for layout decisions.
- **Differentiation**: What makes Skylytics unforgettable? **Data that breathes.** Subtle animations on charts loading, SHAP bars populating, and delay probability meters filling — not decorative fluff, but purposeful motion that signals the system is thinking and delivering intelligence in real time.

**CRITICAL**: Every screen has a job. Design to that job with precision. No placeholder padding, no decorative sections that carry no data meaning.

---

## Brand Identity

### Name & Concept
**Skylytics** — Aviation intelligence. The name implies sky + analytics. The visual identity should reinforce this: altitude, data streams, radar, controlled airspace — not cartoon planes or travel stock imagery.

### Logo / Mark Direction
- Wordmark: "Skylytics" in a sharp, geometric sans-serif (see Typography).
- Optional icon mark: a stylized radar sweep or flight path arc — minimal, single-weight stroke.
- Never use emoji, clip art, or stock aviation icons.

### Color System

Use CSS variables on web (Tailwind config extension) and SwiftUI `Color` assets on iOS. Both must reference the same palette.

```css
/* Web: tailwind.config.js extend.colors */
--color-sky-950:    #0A0F1E;   /* Near-black navy — primary background */
--color-sky-900:    #0D1530;   /* Card backgrounds, sidebars */
--color-sky-800:    #112040;   /* Elevated surfaces, modals */
--color-sky-700:    #1A3260;   /* Borders, dividers */
--color-accent:     #00C2FF;   /* Electric cyan — primary accent, CTAs, active states */
--color-accent-dim: #0099CC;   /* Hover states, secondary accent */
--color-warning:    #F59E0B;   /* Amber — delay warnings, caution indicators */
--color-danger:     #EF4444;   /* Red — high-probability delay, critical alerts */
--color-success:    #10B981;   /* Emerald — on-time, healthy status */
--color-text-primary:   #F0F4FF; /* Near-white — primary readable text */
--color-text-secondary: #8BA3C7; /* Muted blue-gray — labels, metadata */
--color-text-dim:       #4A6080; /* Disabled states, placeholders */
```

**The palette is dark-first.** The web dashboard and iOS app both default to dark mode. A light mode is not required for V1 — airline ops centers use dark interfaces for reduced eye strain during long shifts.

**NEVER use:**
- Purple-to-blue gradients (the universal mark of "AI slop")
- Neon pink or teal-on-white "startup" color schemes
- Washed-out pastels
- Solid white backgrounds as the base — this is a dark-mode product

Gradients are **permitted only** as subtle radial glows behind hero data (e.g., a soft `--color-accent` radial at 5% opacity behind the main delay probability dial). They must never be the primary visual statement.

---

## Typography

### Web (Next.js)
```js
// next/font or @fontsource
Header Font:  "Space Grotesk"  — weights 500, 600, 700
Body Font:    "Inter"          — weights 400, 500
Mono Font:    "JetBrains Mono" — for SHAP values, metrics, flight codes
```

### iOS (SwiftUI)
```swift
// Use SF Pro (system font) as the base — it is the correct iOS-native choice.
// Map weights to match web hierarchy:
.largeTitle  → SF Pro Display, Bold       (matches Space Grotesk 700)
.title2      → SF Pro Display, Semibold   (matches Space Grotesk 600)
.body        → SF Pro Text, Regular       (matches Inter 400)
.caption     → SF Pro Text, Medium        (matches Inter 500, muted color)
.monospacedDigit → SF Mono               (matches JetBrains Mono for numbers)
```

### Scale Rules
- **Page titles / Hero numbers**: `text-4xl` to `text-6xl`, Space Grotesk 700
- **Section headers**: `text-xl` to `text-2xl`, Space Grotesk 600
- **Card labels**: `text-sm`, Inter 500, `--color-text-secondary`
- **Data values (delay minutes, probabilities)**: JetBrains Mono, `text-lg`+, `--color-accent` or status color
- **Body / descriptions**: Inter 400, `text-sm` to `text-base`, `--color-text-primary`

**NEVER use**: Arial, system-ui as a primary font, oversized uncalibrated headers that dominate without data beneath them.

---

## Component Design Language

### Cards
- Background: `--color-sky-900`
- Border: `1px solid --color-sky-700` with `border-radius: 12px`
- Hover state: border brightens to `--color-sky-600`, subtle `box-shadow: 0 0 0 1px --color-accent` at 20% opacity
- No drop shadows that look "floating" — prefer border-glow for depth

### Buttons
- **Primary CTA** (e.g., "Predict Delay", "Run Simulation"): filled `--color-accent`, dark text, `border-radius: 8px`, no border
- **Secondary** (e.g., "View Details"): transparent background, `1px solid --color-accent`, accent text
- **Destructive**: `--color-danger` fill
- **Disabled**: `--color-text-dim` fill, not interactive
- All buttons: min touch target `44px` height — mandatory for iOS and mobile web

### Data Visualization (Recharts / Plotly — Web | Swift Charts — iOS)
- Chart backgrounds: transparent (inherits card background)
- Grid lines: `--color-sky-700` at 40% opacity — subtle, never dominant
- All chart axes: `--color-text-secondary`, `text-xs`, JetBrains Mono
- Delay probability bar: gradient fill from `--color-success` → `--color-warning` → `--color-danger` mapped to 0–100% probability
- SHAP bar chart: positive contributions in `--color-accent`, negative in `--color-warning`
- Heatmap: use a custom scale — `--color-success` (0% delay) → `--color-warning` (moderate) → `--color-danger` (severe)

### Status Indicators
Always use icon + color + label together — never color alone (accessibility).
```
● On Time     → --color-success   + "On Time"
▲ Minor Delay → --color-warning   + "Minor Delay"
■ Major Delay → --color-danger    + "Major Delay"
○ Unknown     → --color-text-dim  + "No Data"
```

### Forms & Inputs
- Background: `--color-sky-800`
- Border: `--color-sky-700`, focus: `--color-accent`
- Labels: `text-xs`, `--color-text-secondary`, uppercase tracking
- Placeholder: `--color-text-dim`
- Validation errors: `--color-danger` border + inline error text beneath field

---

## Animation Rules

Motion must be **purposeful and data-driven**. Every animation signals meaning, not decoration.

### Web (Framer Motion — mandatory for key interactions)
```js
// Standard easing for all transitions
const easing = [0.25, 0.1, 0.25, 1.0]; // cubic-bezier ease

// Page transitions
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.25, ease: easing }

// Card / list stagger (e.g., flight list loading)
staggerChildren: 0.06

// SHAP bar population — bars grow from 0 width on mount
// Delay probability dial — needle sweeps from 0 to value on mount
// Chart data — lines draw in left-to-right on first render
```

### iOS (SwiftUI)
```swift
// Use .animation(.spring(response: 0.4, dampingFraction: 0.8)) for all state transitions
// Probability meter: use withAnimation on value change
// Card appearance: .transition(.opacity.combined(with: .move(edge: .bottom)))
// Loading shimmer: use a looping LinearGradient phase animation on skeleton cards
```

### What to Animate (High-Impact Moments)
| Moment | Animation |
|---|---|
| Prediction result appears | Delay probability dial sweeps to value |
| SHAP panel loads | Bars grow horizontally, staggered 60ms apart |
| Flight status changes | Status pill fades between colors with crossfade |
| Heatmap renders | Cells fade in sequentially by region |
| What-if result updates | Numbers count up/down to new value |
| Notification arrives | Slide-in from top (iOS) / toast from bottom-right (web) |

### What NOT to Animate
- Page backgrounds (no drifting particles, no animated mesh gradients)
- Logo (no spinning, pulsing, or breathing brand marks)
- Navigation items (no bouncing tabs)
- Data that hasn't changed (no idle animations on static numbers)

---

## Layout Structure

### Web Dashboard (Airline Manager)
```
┌─────────────────────────────────────────────────────┐
│  Topbar: Logo | Search | Alert Bell | User Avatar   │
├──────────┬──────────────────────────────────────────┤
│          │  Main Content Area                       │
│ Sidebar  │  ┌─────────────┬────────────────────┐   │
│ Nav      │  │ Hero Panel  │  Quick Stats Row    │   │
│          │  │ (Delay Dial)│  (4 metric cards)   │   │
│ - Home   │  ├─────────────┴────────────────────┤   │
│ - Predict│  │ Flight List / Heatmap / SHAP View │   │
│ - Heatmap│  ├───────────────────────────────────┤   │
│ - What-If│  │ What-If Simulator Panel           │   │
│ - History│  └───────────────────────────────────┘   │
│ - Settings│                                         │
└──────────┴──────────────────────────────────────────┘
```
- Sidebar: `240px` fixed on desktop, collapses to icon rail at `< 1024px`, bottom tab bar at `< 768px`
- Content area: `max-w-7xl mx-auto px-6` — never full-bleed on wide monitors
- Grid: CSS Grid for dashboard panels, Flexbox for within-card layouts

### iOS App (Passenger)
```
┌─────────────────────┐
│  Status Bar         │
├─────────────────────┤
│  Navigation Header  │
│  (Title + Back/Menu)│
├─────────────────────┤
│                     │
│   Scrollable        │
│   Content Area      │
│                     │
│   (Cards, Charts,   │
│    Status Pills)    │
│                     │
├─────────────────────┤
│  Tab Bar            │
│  Home|Search|Alerts │
│  |Flights|Profile   │
└─────────────────────┘
```
- All interactive elements: minimum `44 × 44pt` touch targets
- Safe area insets: always respected — no content behind home indicator or notch
- Pull-to-refresh on all live data lists
- Skeleton loading cards while API fetches (never spinner-only)

---

## Screen-Specific Design Notes

### Delay Prediction Screen (Web + iOS)
- The **delay probability percentage** is the hero element — display it large (Space Grotesk 700, `text-6xl`), colored by status (`--color-success/warning/danger`)
- Below the number: a horizontal confidence bar (0–100%)
- SHAP explanation panel: collapsible section titled "Why this prediction?" — horizontal bar chart, top 6 features only

### Delay Heatmap (Web Only)
- Full-width map using a dark tile layer (Mapbox dark-v11 or OpenStreetMap dark equivalent)
- Airport nodes: circles sized by traffic volume, colored by delay severity
- Hover tooltip: airport code, avg delay, # flights affected

### What-If Simulator (Web Only)
- Two-panel layout: left = input controls (sliders, dropdowns for weather severity, congestion level, departure time), right = live prediction output that updates on input change
- Animate the output number counting up/down when inputs change

### Flight Status Card (iOS)
- Full-width card per flight: airline logo placeholder + flight code + route + status pill + probability percentage
- Tap → expands to full prediction detail with SHAP mini-chart

---

## Critical Constraints

- **Dark mode only for V1.** Do not build a light mode toggle — it will dilute focus and double the CSS surface area.
- **Web and iOS are visually identical** in language. A design decision made for one platform propagates to the other.
- **Recharts/Plotly on web, Swift Charts on iOS** — do not use image exports of charts. Charts must be live, data-bound components.
- **No stock aviation photography** as hero/background images. The product's data IS the visual.
- **No Lottie animations** — they are a maintenance liability and often look generic. Use CSS/Framer Motion / SwiftUI native animations only.
- **No skeleton libraries** — hand-write skeleton components using Tailwind `animate-pulse` (web) and SwiftUI `redacted(reason: .placeholder)` (iOS). This keeps them on-brand.
- **Framer Motion is mandatory on web** for all page transitions and high-impact data reveals — do not use CSS transitions alone for these moments.
- **All SHAP values must be rendered as actual chart components**, not raw numbers in a table.
