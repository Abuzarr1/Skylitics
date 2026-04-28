# 🔍 TruckNRoll.com — Complete UI/UX & Technical Analysis Report

> **Website**: [https://trucknroll.com](https://trucknroll.com)  
> **Agency**: Built by **Locomotive** (locomotive.ca) — Award-winning Montreal-based digital agency  
> **Date of Analysis**: April 10, 2026  
> **Purpose**: Reference for Skylytics FYP Website & iOS App Design  

---

## 📸 Screenshots Captured

| Reference | Page | Section |
|-----------|------|---------|
| `reference_1.png` | Homepage | Hero section — massive "MOVE SHOWS FORWARD" typography |
| `reference_1b.png` | Homepage | Hero alternate view with loading stamp logo |
| `reference_2.png` | Homepage | Hero bottom + intro text — "TOURS, NO EXCUSES" |
| `reference_3.png` | Homepage | "What We Do" section — video embed + large statement |
| `reference_4.png` | Homepage | "WE MOVE" large typography transition section |
| `reference_5.png` | Homepage | What We Do section (duplicate angle from earlier session) |
| `reference_6.png` | Homepage | "WE MOVE" section (duplicate angle) |
| `reference_7.png` | Homepage | Landing page with stamp logo + navigation bar |
| `reference_8.png` | Homepage | Contact slide-out overlay/modal (purple CTA cards) |
| `reference_9.png` | Homepage | Feature cards — (1) Flawless Execution, (2) Safety-first |
| `reference_10.png` | Homepage | Feature cards — (3) Solution oriented + photo grid |
| `reference_11.png` | Homepage | Culture section — "EVERY TOUR IS DIFFERENT" with photo |
| `reference_12.png` | Homepage | Use Cases accordion + "WE ALWAYS STAY IN TUNE" |
| `reference_13.png` | Homepage | Footer — marquee banner, addresses, CTA section |
| `reference_14_culture.png` | Culture | Hero — stamp logo + "CREW MATTERS" title |
| `reference_15_culture.png` | Culture | "This is not a job" + team photos |
| `reference_16_culture.png` | Culture | Photo mosaic grid — trucks, crew, merch |
| `reference_17_culture.png` | Culture | More photo grid — workers loading gear |
| `reference_18_culture.png` | Culture | Footer (same as homepage) |

> **Note**: Contact page screenshots could not be captured due to browser capacity limits. Content was analyzed via HTML scraping.

---

## 🎨 1. Color Palette

### Primary Theme: **Dark Mode (Homepage/Services)**

| Color | Hex (Approx.) | Usage |
|-------|--------------|-------|
| Pure Black | `#000000` / `#0A0A0F` | Primary background |
| Dark Navy | `#0D1117` / `#111827` | Section backgrounds with slight blue tint |
| Off-White | `#F5F5F5` / `#EDEDED` | Primary text on dark backgrounds |
| Pure White | `#FFFFFF` | Headlines, strong emphasis |
| Electric Purple/Blue | `#5B4FFF` / `#5D3FD3` | **Primary accent** — CTAs, footer, contact modal |
| Muted Gray | `#9CA3AF` / `#6B7280` | Secondary text, descriptions |

### Light Theme (Culture Page / Landing Splash)

| Color | Hex (Approx.) | Usage |
|-------|--------------|-------|
| Off-White / Light Gray | `#F0F0F5` / `#E8E8ED` | Culture page background |
| Near-Black | `#111111` | Text on light backgrounds |
| Faded Purple | `#C4BDE8` | Subtle tint overlays |

### Key Insight:
- **Only 3 core colors used**: Black, White, Electric Purple
- The site achieves maximum visual impact with a **minimal palette**
- Purple is reserved exclusively for interactive/CTA elements — creating a strong visual hierarchy

---

## ✍️ 2. Typography

### Typefaces
- **Primary Headline Font**: Custom **Grotesque/Impact-style Sans-Serif** (extremely bold, condensed)
  - Likely a variant of **Faktum**, **Druk**, or **Impact** customized for the brand
  - Used at **enormous scale** — filling entire viewport width
- **Body Text Font**: Clean sans-serif, likely **Neue Haas Grotesk** or **Helvetica Neue**
  - Medium weight for body copy
  - Bold weight for section labels ("What We Do", "Use Cases")
- **Label/Navigation Font**: Same sans-serif family, medium/bold weight, smaller size

### Typographic Scale
| Element | Approx. Size | Weight | Style |
|---------|-------------|--------|-------|
| Hero Headlines | `120px–300px+` | **900 (Black/Ultra Bold)** | ALL CAPS, fills screen |
| Section Titles | `60px–100px` | **700–800** | Mixed case or italic |
| Sub-headings | `24px–36px` | **700 (Bold)** | Sentence case |
| Body Text | `16px–18px` | **400–500** | Regular, good line-height |
| Labels/Tags | `12px–14px` | **600** | UPPERCASE, letter-spacing |
| Nav Items | `16px–20px` | **500–600** | Sentence case |

### Typography Strategy:
- **Scale contrast is EXTREME** — Hero text at 200px+ vs body at 16px creates dramatic visual hierarchy
- **Display Typography** — Text IS the design, not just content
- Letters are sometimes clipped at viewport edges (intentional cropping effect)
- Images are inset WITHIN the text letterforms (text-as-frame technique)

---

## 📐 3. Layout & Structure

### Overall Architecture
```
Landing/Splash Screen (light theme with stamp logo)  
    ↓  
Homepage Hero (dark, massive text)  
    ↓  
"What We Do" Section (split: video left, text right)  
    ↓  
"We Move Shows Forward" (full-width text reveal)  
    ↓  
Feature Cards (numbered, alternating L/R layout)  
    ↓  
Culture Teaser (full-bleed photo + text overlay)  
    ↓  
Use Cases Accordion Section  
    ↓  
Stats Section (counter numbers)  
    ↓  
CTA Section  
    ↓  
Marquee/Ticker Footer Banner  
    ↓  
Footer (addresses + links + social)  
```

### Layout Patterns
- **Full-viewport sections** — Each section fills or exceeds the viewport height
- **Asymmetric grid** — Content deliberately offset, not centered
- **CSS Grid + Flexbox** hybrid approach
- **Split layouts** — Left/right divisions (e.g., video left, text right)
- **Alternating alignment** — Feature cards alternate between left-aligned (1, 3) and right-aligned (2)
- **Full-bleed imagery** — Photos extend edge-to-edge with no padding
- **Modular/Card-based sections** — Clear separation between content blocks with thin horizontal rules

### Responsive Approach
- Desktop-first design with fluid typography
- `clamp()` or viewport-based font sizes (vw units) for typography scaling
- Grid columns collapse on mobile

---

## 🎬 4. Animations & Interactions

### Loading/Entry Animation
- **Splash Screen**: Light-themed landing with the "TRUCK 'N ROLL" tilted stamp logo
- The stamp logo appears with a **rotation + scale entrance**
- Transitions to the dark homepage via a **smooth wipe or fade**

### Scroll Animations
| Animation Type | Where Used | Description |
|----------------|-----------|-------------|
| **Text Reveal (Clip/Mask)** | Hero headlines | Letters reveal progressively as user scrolls down |
| **Parallax Scrolling** | Full-bleed images | Images move at different speed than text |
| **Fade-In-Up** | Body text, cards | Content fades in + translates up on scroll entry |
| **Counter Animation** | Stats section (70+, 140, 100%, 24/7) | Numbers count up when section enters viewport |
| **Image Scale** | Photo sections | Images slightly zoom on scroll |

### Hover Interactions
- **Buttons**: Smooth background color shift and/or scale transform
- **Navigation links**: Underline slides in from left on hover
- **Cards**: Subtle lift + shadow on hover
- **Video play button**: Purple circle with white play icon — scales on hover

### Scroll Library
- **Locomotive Scroll** — Smooth kinetic/inertial scrolling throughout
  - Creates a "heavy, premium" feel to page scroll
  - Enables scroll-speed-based parallax effects
  - Elements have momentum/easing when scrolling

### Animation Library
- **GSAP (GreenSock Animation Platform)** — Powers all entrance/reveal animations
  - ScrollTrigger plugin for scroll-linked animations
  - SplitText for character-level text animations
  - Timeline-based sequencing for complex entrance choreography

### Contact Modal
- Slides in from the right as a **full-height overlay panel**
- Background blurs (backdrop-filter: blur)
- Purple-themed cards with clear hierarchy: (1) and (2) numbered CTAs
- Smooth exit on close (X button with rotation animation)

---

## 🏗️ 5. Technology Stack

| Layer | Technology | Confidence |
|-------|-----------|------------|
| **Frontend Framework** | Next.js (React) | ⭐⭐⭐⭐⭐ |
| **Animation Engine** | GSAP (GreenSock) | ⭐⭐⭐⭐⭐ |
| **Smooth Scroll** | Locomotive Scroll | ⭐⭐⭐⭐⭐ |
| **CSS Approach** | CSS Modules / Scoped CSS (possibly Tailwind for utilities) | ⭐⭐⭐⭐ |
| **CMS** | Likely Sanity.io or Prismic (Locomotive's typical stack) | ⭐⭐⭐ |
| **Hosting** | Vercel (typical for Next.js) | ⭐⭐⭐⭐ |
| **Form Handling** | reCAPTCHA integration + custom API | ⭐⭐⭐⭐⭐ |
| **i18n** | Built-in Next.js i18n (EN/FR routes) | ⭐⭐⭐⭐⭐ |
| **Font Loading** | Self-hosted custom fonts (preloaded) | ⭐⭐⭐⭐ |
| **Image Format** | WebP with LQIP (Low Quality Image Placeholders) | ⭐⭐⭐⭐ |
| **Video** | Inline `<video>` elements with autoplay, muted, loop | ⭐⭐⭐⭐⭐ |

---

## 🧩 6. Component Patterns

### Navigation Bar
- **Minimal top bar**: Brand name (left) + Language toggle (right)
- **Sticky sub-navigation**: Services | Culture | Contact — appears after scroll
- **Contact triggers a slide-out modal**, not a page navigation
- Active page indicated by underline below text

### Hero Section
- Full-viewport, dark background
- 3-4 lines of massive ALL-CAPS text
- Truck/road images inset WITHIN text letterforms
- Small metadata text alongside (ESTD. 1994, QC CANADA, ©TNR)

### Feature Cards (Services)
- **Numbered items**: (1), (2), (3) in parentheses
- Thin horizontal rule separator at top
- Bold title + body paragraph
- Accompanying cinematic photo on opposite side
- Alternating left/right layout

### Accordion Section (Use Cases)
- Each item has:
  - **Bold question** (white) + **lighter answer** (gray) on same line
  - Plus (+) expand icon on the right
  - Thin line separators between items
- Expands to reveal detailed description

### Stats/Counter Section
- Large counter numbers (70+, +140, 100%, 24/7)
- Descriptive label beneath each number
- Horizontal layout, evenly distributed

### Footer
- **Marquee/Ticker**: Horizontally scrolling text banner — "TOUR • IT'S A TRUCK 'N ROLL • TOUR" with stamp logos interspersed
- **Purple/blue background** (#5B4FFF)
- Three-column footer layout:
  - **Move** — CTA with arrow button
  - **Join** — Two link buttons (crew + USA)
  - **Social** — Circular icon buttons (Fb, In, Li)
- Bottom bar: Privacy Policy | Cookies Preferences | Website by Locomotive

### Buttons
| Type | Style |
|------|-------|
| **Primary CTA** | Rounded pill/capsule shape, border/outline, arrow icon (→) on right |
| **External Links** | Same pill shape, with ↗ external link icon |
| **Social Icons** | Circular outline buttons with text abbreviations (Fb, In, Li) |
| **Play Button** | Purple filled circle with white triangle play icon |

---

## 🖼️ 7. Image & Media Strategy

- **Photography Style**: High-contrast, cinematic, dramatic lighting
  - Homepage: Color photos with moody, dark lighting (trucks at dusk, stage lights)
  - Culture page: Black-and-white documentary-style photos (workers, equipment, crew)
- **Video**: Embedded inline video with custom play button (purple circle)
- **Image Treatment**: 
  - Rounded corners on some images (border-radius: ~12px)
  - Some images clip into text letterforms
  - Mix of full-bleed and padded/gridded images
- **Photo Grid on Culture Page**: Asymmetric masonry-style layout with overlapping images

---

## 📱 8. Page-by-Page Breakdown

### Homepage (Services)
- **Theme**: Dark mode
- **Sections**: Hero → What We Do → Feature Cards → Culture Teaser → Use Cases Accordion → Stats → CTA → Footer
- **Mood**: Bold, industrial, premium, confident

### Culture Page
- **Theme**: Light mode (off-white background)
- **Sections**: Hero ("CREW MATTERS") → "This is not a job" journey timeline → Photo Mosaic → Stats → Benefits (numbered list) → CTA → Footer
- **Mood**: Human, documentary, authentic, pride
- **Unique**: B&W photography; journey-style narrative from "Roll out" to "Lead the way"

### Contact Page
- **Theme**: Dark mode (same as homepage)
- **Content**: Multi-field form with:
  - Text inputs for name, company, tour details
  - File upload (PDF, spreadsheet for tour routing)
  - Textarea for additional details
  - reCAPTCHA integration
- **Style**: Clean, minimal form with thin-line inputs matching the overall aesthetic

### Contact Modal (slide-out)
- **Theme**: Purple/blue accent (#5B4FFF)
- **Structure**: Two numbered sections:
  - (1) "Got A Show To Move?" → Link to contact form
  - (2) "Want to join the crew?" → Links to Canada/USA openings
- **Background**: Blur effect on the underlying page

---

## 🎯 9. Recommendations for Skylytics FYP

Based on this analysis, here's how to adapt these design principles for a flight delay prediction app:

### Direct Applications
1. **Typography-First Design**: Use one strong, bold typeface at dramatic scale for hero/landing screens
2. **Minimal Color Palette**: Pick 3 colors max — Dark background + White text + One vibrant accent (e.g., electric blue for aviation)
3. **GSAP Animations**: Implement text reveals, counter animations for prediction stats, and smooth transitions
4. **Dark Mode Default**: Aviation/tech apps feel premium in dark mode
5. **Locomotive Scroll**: Apply smooth scrolling to the web dashboard for that premium feel
6. **Numbered Feature Cards**: Great for presenting prediction features, accuracy metrics, or use cases
7. **Stats Counters**: Perfect for showing model accuracy (%), flights analyzed, predictions made
8. **Full-Bleed Imagery**: Use aircraft/airport photography with the same cinematic treatment
9. **Accordion Pattern**: For presenting different delay factors or FAQ sections
10. **Slide-Out Contact/Settings Panel**: Instead of full-page navigation

### iOS App Adaptations
1. **Bold Typography**: Use SF Pro Display at large sizes for hero screens
2. **Dark Theme**: Match the web dark mode — use `.systemBackground` in dark mode
3. **Accent Color**: One vibrant brand color for all interactive elements
4. **GSAP-like Animations**: Use SwiftUI `.matchedGeometryEffect`, `.transition()`, and `withAnimation()` for similar fluidity
5. **Haptic Feedback**: Add subtle haptics on prediction results and interactions
6. **Card-Based Layout**: Feature cards with rounded corners and thin separators

### Tech Stack Recommendation
| Component | Recommended |
|-----------|------------|
| Web Framework | **Next.js 14+ (App Router)** |
| Animations | **GSAP + ScrollTrigger** |
| Smooth Scroll | **Lenis** (modern successor to Locomotive Scroll) |
| CSS | **Tailwind CSS** or **CSS Modules** |
| iOS | **SwiftUI** with custom animations |
| Fonts | **Inter** or **Outfit** (free alternatives with bold weights) |

---

## 📂 Files in This Reference Folder

```
frontend_1_references/
├── reference_1.png           — Homepage hero (MOVE SHOWS FORWARD)
├── reference_1b.png          — Homepage hero (alternate angle)
├── reference_2.png           — Homepage hero + intro text
├── reference_3.png           — What We Do section
├── reference_4.png           — WE MOVE transition
├── reference_5.png           — What We Do (alt angle)
├── reference_6.png           — WE MOVE (alt angle)
├── reference_7.png           — Landing/splash with stamp logo
├── reference_8.png           — Contact slide-out modal (purple)
├── reference_9.png           — Feature cards (Flawless Execution, Safety)
├── reference_10.png          — Feature cards (Solution oriented)
├── reference_11.png          — Culture teaser (EVERY TOUR IS DIFFERENT)
├── reference_12.png          — Use Cases accordion section
├── reference_13.png          — Footer (marquee + addresses + CTAs)
├── reference_14_culture.png  — Culture page hero (CREW MATTERS)
├── reference_15_culture.png  — Culture page (This is not a job)
├── reference_16_culture.png  — Culture page (Photo mosaic)
├── reference_17_culture.png  — Culture page (Workers/crew photos)
├── reference_18_culture.png  — Culture page footer
└── trucknroll_analysis_report.md  — This file
```

---

*Analysis conducted by Antigravity AI Agent • April 2026*
