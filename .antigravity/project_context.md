# Project Context: Skylytics (FYP)

**Project Identity:** "Skylytics" – An AI-Powered Flight Delay Prediction System.  
**Current Phase:** Advanced Model Development → Backend API → Frontend & iOS.  
**Role:** You are the Lead ML Engineer & Full-Stack Integrator.

---

## 1. Context & Resources

* **Source of Truth (Business Logic & Architecture):** `Skylytics_Final_Boss.pdf`


---

## 2. Tech Stack

### ML / Data (PRIMARY FOCUS — START HERE)
* **Language:** Python
* **Core Libraries:** Pandas, NumPy, Scikit-learn, XGBoost, LightGBM, PyTorch
* **Sequential Models:** LSTM, Transformer (PyTorch)
* **Explainability:** SHAP (primary), LIME (secondary)
* **Tuning:** Optuna, Randomized Search
* **Imbalance Handling:** SMOTE, class reweighting
* **Experiment Tracking:** (recommend MLflow or W&B — not specified in proposal, confirm with team)

### Data Sources
| Source | Purpose | URL | Status |
|---|---|---|---|
| Kaggle BTS (2015) | Primary historical training data | kaggle.com/datasets/usdot/flight-delays | FREE |
| BTS Live | Production flight records | transtats.bts.gov | API Access Needed |
| Meteostat API | Weather data (historical + live) | meteostat.net | FREE tier, rate limits apply |
| OpenFlights | Airport & route metadata | openflights.org/data.html | FREE static files |
| OpenSky Network | Optional live traffic | opensky-network.org | Optional |

### Backend (TO BUILD — Phase 3)
* **Framework:** FastAPI (async, Python-native — do NOT switch to Django or Flask)
* **Caching:** Redis (for fast repeated prediction queries)
* **Database:** PostgreSQL (relational storage — flight records, predictions, user data)
* **Containerization:** Docker
* **Orchestration (Optional):** Kubernetes
* **Hosting:** AWS EC2 (backend), AWS RDS (database)

### Frontend (TO BUILD — Phase 4)
* **Web Dashboard:** Next.js + Tailwind CSS + Recharts / Plotly
* **Target Users:** Airline operation managers
* **Mobile App:** SwiftUI (iOS)
* **Target Users:** Passengers
* **Hosting:** Vercel (frontend), Apple Developer Account (iOS distribution)

---

## 3. Workflow: The "Train → Explain → Serve → Display" Protocol

> ⚠️ **The Prototype Phase from the proposal is SKIPPED.** Skip Logistic Regression and basic Decision Tree baselines. Start directly on Advanced Model Development with XGBoost as the first "real" baseline.

---

### Phase 1: Data Acquisition & Preprocessing (START HERE)

1. **Download Kaggle BTS 2015 dataset** — this is your offline training corpus.
2. **Connect Meteostat API** — pull weather records aligned to flight date/origin airport.
3. **Load OpenFlights data** — merge airport metadata (lat/lon, timezone, routes).
4. **Preprocessing pipeline (in this order):**
   * Handle missing values (drop or impute based on column criticality)
   * Standardize time formats (UTC normalization)
   * Retain realistic outliers (severe weather events — do NOT drop them)
   * Encode cyclically: `hour_of_day`, `day_of_week`, `month`
   * Encode categoricals: airline, origin, destination
   * Engineer features: congestion index, historical delay averages (lag/rolling), cascading delay flag

---

### Phase 2: Model Training (ADVANCED — No Prototype)

> Build in this exact sequence. Each step gates the next.

#### Step 2a — Tree-Based Ensemble (First Real Baseline)
* Train **XGBoost** classifier (delay: yes/no) and regressor (delay duration in minutes)
* Train **LightGBM** as comparison
* Evaluate: ROC-AUC, F1-Score, RMSE, Precision, Recall
* Cross-validate (StratifiedKFold for classifier)
* Address class imbalance with SMOTE + class reweighting
* Save model artifacts (`.pkl` or `joblib`)

#### Step 2b — Sequential Deep Models
* Build **LSTM** network for delay propagation sequences (inbound → outbound cascades)
* Experiment with **Transformer** architecture for long-range temporal dependencies
* Input: time-windowed feature sequences per flight route
* Evaluate on same metrics as Step 2a for direct comparison

#### Step 2c — Hybrid Ensemble (Final Model)
* Fuse XGBoost + LSTM/Transformer outputs via **Stacking or Weighted Fusion**
* Tune fusion weights with Optuna
* This is the production model — validate rigorously before wiring to backend

---

### Phase 3: Explainability & Analysis (Run AFTER model is stable)

1. **SHAP Analysis (Primary):**
   * Generate SHAP summary plots (global feature importance)
   * Generate SHAP force plots (per-prediction explanation)
   * Key features to expect: weather severity, congestion index, departure hour, origin airport, cascading delay
   * Export SHAP values as JSON — backend will serve these to the web dashboard
2. **LIME (Secondary / Spot Check):**
   * Use for sanity-checking individual predictions where SHAP is unclear
3. **Error Analysis:**
   * Examine misclassified samples — is the model failing on weather events? Specific airports? Night flights?
   * Feed insights back to feature engineering (iterate if needed)

---

### Phase 4: Backend API Development (FastAPI)

> Only start this phase once Phase 2 model is validated and Phase 3 SHAP pipeline is functional.

#### API Design Principles
* **API-first design** — all frontend/iOS connects via these endpoints only
* **No direct DB access from frontend** — everything through FastAPI
* Use **Pydantic** models for request/response validation

#### Core Endpoints to Build (in this order)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/predict/delay` | Predict delay (binary) for a flight — returns probability + SHAP values |
| `POST` | `/api/v1/predict/duration` | Predict delay duration (regression) in minutes |
| `GET` | `/api/v1/flights/{flight_id}` | Retrieve stored flight record + historical predictions |
| `GET` | `/api/v1/heatmap` | Aggregated delay heatmap data by airport/route (for dashboard) |
| `POST` | `/api/v1/whatif` | What-if simulation — accepts modified feature inputs, returns new prediction |
| `GET` | `/api/v1/shap/{prediction_id}` | Return SHAP feature importance for a specific prediction |
| `POST` | `/api/v1/assistant/chat` | AI Assistant — streams LLM response based on flight context |
| `POST` | `/api/v1/users/{user_id}/flights` | Save flight to passenger watchlist (iOS) |
| `GET` | `/api/v1/users/{user_id}/flights` | Get saved flights for a passenger (iOS) |
| `DELETE`|`/api/v1/users/{user_id}/flights/{flight_id}`| Remove a flight from the watchlist (iOS) |
| `POST` | `/api/v1/collaboration/messages` | Post a shared insight/message for Ops Managers (Web) |
| `GET` | `/api/v1/collaboration/messages/{flight_id}` | Retrieve discussion thread for a flight (Web) |
| `GET` | `/api/v1/health` | Health check — confirms model is loaded and API is alive |

#### Infrastructure
* **Redis caching:** Cache predictions by `(flight_id, date, model_version)` — TTL = 1 hour
* **PostgreSQL schema:** Tables for `flights`, `predictions`, `shap_values`, `users`, `user_saved_flights`, `flight_comments`
* **LLM Integration:** AI backend utilizes secure API access or a hosted local LLM model for the intelligent assistant.
* **Docker Compose:** Spin up FastAPI + PostgreSQL + Redis together locally

#### API Testing Protocol
1. Write unit tests for each endpoint using **pytest + httpx**
2. Test happy path (valid inputs) and edge cases (missing fields, out-of-range values)
3. Use **Postman** or **Bruno** for manual endpoint testing and collection sharing with team
4. Confirm response schemas match what Next.js dashboard and SwiftUI app expect — do this BEFORE frontend build starts

---

### Phase 5: Frontend & iOS (Final Phase)

* **Web Dashboard (Next.js + Tailwind):**
  * Delay prediction form → calls `POST /api/v1/predict/delay`
  * SHAP explanation panel → calls `GET /api/v1/shap/{id}`
  * Delay heatmap → calls `GET /api/v1/heatmap`
  * What-if simulator → calls `POST /api/v1/whatif`
  * AI Assistant Sidebar → calls `POST /api/v1/assistant/chat`
  * Collaboration / messaging thread for managers → calls `POST GET /api/v1/collaboration/messages`
* **iOS App (SwiftUI):**
  * Flight status tracking
  * Delay prediction per flight
  * AI Smart Assistant → calls `POST /api/v1/assistant/chat`
  * Saved / Pinned Flights → calls `POST GET /api/v1/users/{id}/flights`
  * Push notifications for delay alerts

---

## 4. Critical Constraints

* **Skip the Prototype Phase entirely.** XGBoost in the advanced phase IS your first baseline — do not waste time on Logistic Regression or vanilla Decision Trees.
* **No mock data in production APIs.** Use real model inference. Mocks only during frontend dev if backend is unstable.
* **Outliers stay.** Severe weather events are NOT noise — they are signal. Do not drop them during preprocessing.
* **SHAP must be wired to the API.** Explainability is a deliverable, not an afterthought. Every prediction served to the dashboard must carry a SHAP payload.
* **Meteostat rate limits are real.** Cache weather API responses locally during development. Do not hammer the free tier.
* **Model versioning matters.** Tag each trained model with a version. The prediction API must log which model version produced each result.
* **iOS is passenger-facing only.** Do not build airline manager features into the iOS app.

---

## 5. Evaluation Metrics (Reference)

| Task | Primary Metrics |
|---|---|
| Delay Classification (yes/no) | ROC-AUC, F1-Score, Precision, Recall |
| Delay Duration (regression) | RMSE, MAE |
| Explainability | SHAP coverage per prediction, manager trust score (UX test) |
| API Performance | P95 latency < 200ms (with Redis cache), uptime > 99% |

---

## 6. Risk Flags (Watch These)

| Risk | Mitigation |
|---|---|
| Meteostat / OpenSky API downtime | Cache responses; fallback to Kaggle static dataset |
| Class imbalance (on-time >> delayed) | SMOTE + class reweighting in XGBoost/LightGBM |
| LSTM training time on local hardware | Use Google Colab Pro or AWS EC2 GPU instance |
| Multi-platform integration bugs (web + iOS) | API-first design; agree on schemas before frontend starts |
| Model drift in production | Build drift detection pipeline (compare live prediction distribution vs training distribution) |
