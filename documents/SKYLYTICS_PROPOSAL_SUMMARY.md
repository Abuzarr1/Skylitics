# Skylytics Proposal Summary

## 1. Functional Requirements
* **Predictions:** Forecast both the likelihood and duration of flight delays.
* **Explainability (SHAP/LIME):** Provide transparency by highlighting key influencing factors for each prediction (e.g., weather, congestion).
* **What-if Simulator & Heatmaps:** Web dashboard featuring interactive delay heatmaps and what-if analysis tools for testing alternate operational scenarios.
* **Smart Notifications:** Automated alerting and push notifications for delays.
* **AI Assistant:** Mentioned as a user-friendly feature alongside delay scenarios.
* **Communication Tools:** Built-in collaboration functionality for airline managers to share insights and coordinate responses.
* **Manager Interface (Web):** Professional dashboard aimed at airline operation managers, schedulers, and ground staff.
* **Passenger Interface (iOS App):** Native mobile application focusing on real-time flight monitoring, predictions, status notifications, and saved flights.

## 2. Non-Functional Requirements
* **Performance:** High performance and speed powered by scalable backend implementations, containerization, and Redis caching.
* **Scalability:** Capable of handling massive enterprise aviation datasets with cloud infrastructure (AWS EC2/RDS, optional Kubernetes).
* **Security & Reliability:** Reliable uptime using API-first architecture, robust AWS deployments, and local dataset fallbacks for continuous operation.
* **Usability & Interpretability:** Emphasis on UX clarity across both web (SEO-friendly, responsive) and mobile (Apple App Store standard). Explainable predictions ensure operational trust over "black box" outcomes.

## 3. Full Tech Stack
* **Backend:** Python, FastAPI (asynchronous API framework).
* **Machine Learning:** Pandas, Scikit-learn, XGBoost, LightGBM, Random Forest, PyTorch, LSTM, Transformers.
* **Web Frontend:** Next.js, Tailwind CSS, Recharts / Plotly.
* **Mobile Frontend:** SwiftUI for native iOS development.
* **Database & Caching:** PostgreSQL (relational storage), Redis.
* **Hosting, Deployment & Ops:** Docker, AWS EC2 (backend), AWS RDS (database), Vercel (frontend), Apple Developer account (iOS distribution). 

## 4. Data Sources
* **Kaggle BTS Flight Delay Dataset (2015):** Historical flight records.  
  *URL:* `https://www.kaggle.com/datasets/usdot/flight-delays?resource=download`
* **Meteostat API:** Real-time weather data.  
  *URL:* `https://meteostat.net`
* **OpenFlights:** Airport and routes data.  
  *URL:* `https://openflights.org/data.html`
* **OpenSky Network (Optional):** Live traffic data API integration.  
  *URL:* `https://opensky-network.org`

## 5. Key System Architecture Decisions
* **Hybrid Model Structure:** Fuses tree-based gradient boosting models (XGBoost/LightGBM) to capture nonlinear interactions with deep sequential models (LSTM/Transformers) to address temporal propagation and chained dependencies.
* **ETL Pipeline:** Custom feature engineering for derived attributes (congestion indices, day-of-week, historical averages). Uses cyclical encoding for time horizons, machine-encoding for categorical metrics, and SMOTE paired with class reweighting to handle extreme dataset imbalances.
* **API-First Design:** Completely decoupled web and mobile frontends. Both applications interact via shared, validated REST JSON endpoints managed by FastAPI.

## 6. Milestones and Schedule
**Semester 7 (Fall 2025)**
* Prototyping Data Setup (81h)
* Baseline Prototype Model - XGBoost classifier & regressor (81h)
* Prototype Frontend - Basic Web UI (54h)
* Production Data Collection & API Integration (81h)
* Advanced Model Phase 1 - LSTM/Transformer & Graph POC (54h)
* Contingency / Buffer (81h)

**Semester 8 (Spring 2026)**
* Advanced Model Phase 2 - Hybrid integration & tuning (162h)
* Backend API Development - FastAPI, Redis caching, PostgreSQL (72h)
* Full Web Frontend - Next.js, Tailwind, Explainable AI UI (72h)
* iOS App Development - SwiftUI, notifications, saved flights (36h)
* System Integration & Internal Testing (30h)
* Hosting & Deployment - AWS, App Store, SEO, Final Documentation (30h)
* Documentation + Final Report + Diagrams (30h)
* Final Revisions, Buffer, Submission (-)

## 7. Risks and Mitigations
1. **Data Availability:** Usage limits or downtime with real-time APIs.  
   *Mitigation:* Cache data continually and maintain robust fallback Kaggle datasets.
2. **Model Accuracy:** Inherent unpredictability in aviation operations.  
   *Mitigation:* Rely on robust hybrid models and SHAP explainability to build manager confidence.
3. **Compute Limitations:** High processing and memory constraints.  
   *Mitigation:* Utilize cloud training environments (Google Colab Pro, AWS).
4. **Integration Complexity:** Risk of fragmentation across web, mobile, and ML backend.  
   *Mitigation:* Stick strictly to modular component development and an API-first connection philosophy.
