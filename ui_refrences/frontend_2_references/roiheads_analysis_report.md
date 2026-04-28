# ROI Heads - Comprehensive UI/UX Analysis

## Overview
**Website URL**: https://roiheads.com/
**Target Audience**: High-end clients, marketing agencies, digital performance seekers.
**Primary Vibe**: Brutalist, Modern Industrial, Premium, High-Performance.

This document serves as a reference guide for integrating similar UI/UX patterns, 3D interactions, and general aesthetics into the Skylytics Final Year Project (FYP) for both Web and iOS applications.

---

## 1. Visual Style & Theming
- **Background & Base**: Deep solid black (`#000000`).
- **Typography & Font Choices**:
  - Extremely bold, heavy sans-serif fonts for primary headings and strong impact messages (e.g., "DELIVERING HIGH-QUALITY TRAFFIC").
  - Lo-fi "handwritten" or script purple fonts layered over structural elements for a "raw", authentic behind-the-scenes aesthetic.
  - Text colors primarily off-white/silver, with lighter gray used for body text readability.
- **Accents**: 
  - Vibrant **Electric Purple** used for dynamic transitions, handwritten font overlays, and selective highlights.
  - Yellow used selectively for specific illustrated icons.

### Application for Skylytics:
- Adopt a similarly dark, high-contrast theme to highlight complex dashboard metrics.
- Utilize bold, modern sans-serif typography for primary numerical readouts to mimic the structural integrity seen on ROI Heads.

---

## 2. 3D Elements & Animations
- **3D Assets**: The website relies heavily on 3D rendered models directly in the browser. Floating, hyper-realistic "concrete block" letters and heavy stone-textured elements create a strong, solid presence.
- **Technology**: Implemented via WebGL using **Three.js**.
- **Interaction**: The models have dynamic parallax depth. As the user scrolls, the models rotate, move vertically at different speeds relative to the background text, and respond subtly to cursor movements. 
- **Scroll-Triggered Motion**: 
  - Triggered relying heavily on **GSAP (GreenSock)** and `ScrollTrigger`.
  - Elements animate consistently on scroll; they don’t just pop in, but rather shift structurally into place.

### Application for Skylytics:
- *Web*: Use `Three.js` (e.g., `react-three-fiber` if using React) for rendering interactive 3D visualizations of flight paths or analytical data structures rather than static 2D SVGs.
- *iOS*: Use `SceneKit` or `Metal` for bringing in optimized 3D widgets onto the home screen dashboard or interactive elements matching the web counterpart.

---

## 3. General Layout & Interactions
- **Page Navigations**: Full-screen, seamless swipe transitions (purple colored wipes) instead of raw page loads.
- **Cursor State**: Custom cursor interactions—subtle scaling when hovering above linkable entities.
- **Menu System**: Minimal hamburger menu opening a full-page overlay with kinetic links that sway upon hover.
- **Smoothness**: High-level unified "smooth scroll" hijacking (likely `Lenis` or `Locomotive Scroll`) that normalizes scroll behavior and gives it weight/friction.

---

## Conclusion & Screen Recordings
The browser subagent has created an automated screen recording mimicking a user session traversing from top to bottom, waiting for animations, and transitioning across pages. The capture file provides an accurate look at timing, physics, and interactions.

### Artifacts Captured:
- **Video Recording**: `roiheads_website_analysis_1775822420854.webp`
- **Screenshots saved to**: `frontend_2_references/` (References 1 and 2 representing internal structure and page links).

*By mimicking these design language markers, Skylytics can establish a state-of-the-art enterprise-level dashboard feel that is highly interactive and visually stunning.*
