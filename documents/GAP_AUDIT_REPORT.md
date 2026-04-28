# Skylytics: Gap Audit Report

This report cross-references the official `Skylytics_Final_Boss.pdf` proposal against the instructions in `SKYLYTICS_CONTEXT.md` and `SKYLYTICS_FRONTEND_RULES.md`.

## 1. Explicit Conflicts (Where Context overrides or contradicts the Proposal)

* **The Prototype Phase is Skipped:** 
  * *Proposal:* Sections 4.1 and the Milestones dictate a dedicated prototyping phase using Baseline models (Logistic Regression, Decision Trees) and a basic Web UI.
  * *Context:* Explicitly commands to **SKIP** the Prototype phase entirely ("Skip Logistic Regression and basic Decision Tree baselines"). It forces the team to start directly on the Advanced Model Development phase using XGBoost as the first baseline.
* **Apple Developer Account / iOS Store:**
  * *Proposal:* Suggests distributing the app through the App Store and securing an Apple Developer account ($99/year).
  * *Context/Rules:* Maintains iOS frontend but does not give explicit setup steps for deployment beyond "Apple Developer Account (iOS distribution)" in constraints, though it doesn't strictly conflict, the context prioritizes API testing and backend infrastructure heavily over iOS store readiness.

## 2. Gaps (Features in the Proposal missing from the Context/Architecture)

* **The AI Assistant:** 
  * *Proposal:* The abstract explicitly lists an "AI assistant" as a key feature of the user-friendly interfaces.
  * *Context Gap:* The Context file defines all API endpoints (Phase 4) and Next.js/SwiftUI features (Phase 5), but completely omits any mention of an AI chatbot or LLM integration. There are no endpoints to support an AI Assistant.
* **Graph POC (Graph Neural Networks):**
  * *Proposal:* Milestone 5 (Advanced Model Phase 1) explicitly dictates "LSTM/Transformer & Graph POC". 
  * *Context Gap:* The context heavily details the XGBoost + LSTM/Transformer hybrid approach but totally drops the "Graph POC". There is no architecture or library listed for Graph models.
* **Saved Flights for Passengers:**
  * *Proposal:* Milestone 10 mandates "iOS App Development (SwiftUI + notifications, saved flights)".
  * *Context Gap:* The Context lists iOS features as "Flight status tracking, Delay prediction per flight, Push notifications" but misses the persistence layer / "Saved Flights" user state. There isn't an endpoint specified in Phase 4 for passengers to save or sync their flights to a user profile.
* **Collaboration / Communication Tools Backend:**
  * *Proposal:* The dashboard must have tools that "allow teams to share insights and coordinate responses."
  * *Context Gap:* Phase 5 Front-end lists a "Collaboration / notification panel", but Phase 4 Backend API has **zero endpoints** defined to handle chat, messaging, or sharing simulations between managers. The backend only has ML inference and heatmap retrieval.

## 3. Findings regarding Design Rules

The `SKYLYTICS_FRONTEND_RULES.md` introduces strict constraints (Dark-mode only, specific typography, Framer animation). These do not conflict with the PDF Proposal, rather they enforce a high-quality standard that aligns with the proposal's goal for a "production-ready system accessible to airlines."

### Conclusion

Before writing code, we must decide:
1. Do we officially drop the **AI Assistant** and **Graph POC** to align with the Context file, or do we need to add them back to the architecture?
2. Do we need to design new API endpoints to support **Saved Flights (iOS)** and **Team Collaboration (Web)**?
