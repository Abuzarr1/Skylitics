# Skylytics — Comprehensive Technical Analysis Report

> **Project:** Skylytics — An AI-Powered Flight Delay Prediction System  
> **Author:** Auto-generated from project documents, codebase, and architecture files  
> **Date:** 2026-04-09  
> **Scope:** Model Export · Backend Integration · API Design · Tech Stack · Requirements · Frontend Screens

---

## Table of Contents

1. [Model Export Format](#1-model-export-format)
2. [Model Integration with Backend](#2-model-integration-with-backend)
3. [Backend API Design](#3-backend-api-design)
4. [Backend Tech Stack](#4-backend-tech-stack)
5. [Functional & Non-Functional Requirements](#5-functional--non-functional-requirements)
6. [Frontend Pages & Screens](#6-frontend-pages--screens)

---

## 1. Model Export Format

After phase-wise training across 15 notebooks in `advance_model/`, only **two components** are carried into production: the **Hybrid Ensemble** model and the **SHAP Analysis** module. Below is the recommended export format for each, with justification.

### 1a — Hybrid Ensemble Model

The hybrid ensemble (Notebook `11_hybrid_ensemble.ipynb`) fuses outputs from:

| Base Model | Framework | Native Save Format |
|---|---|---|
| XGBoost Classifier | xgboost (scikit-learn API) | `.pkl` / `.joblib` |
| XGBoost Regressor | xgboost (scikit-learn API) | `.pkl` / `.joblib` |
| LightGBM Classifier | lightgbm (scikit-learn API) | `.pkl` / `.joblib` |
| LightGBM Regressor | lightgbm (scikit-learn API) | `.pkl` / `.joblib` |
| LSTM Model | PyTorch | `.pt` / `.pth` |
| Transformer Model | PyTorch | `.pt` / `.pth` |
| Meta-Learner (Stacker) | scikit-learn (Logistic Regression or small XGBoost) | `.pkl` / `.joblib` |

#### Recommended Export Strategy

| Component | Format | File(s) | Rationale |
|---|---|---|---|
| **XGBoost models** | `.joblib` | `xgb_classifier.joblib`, `xgb_regressor.joblib` | `joblib` is superior to `pickle` for large numpy arrays inside sklearn-API models. Faster serialization, built-in compression. |
| **LightGBM models** | `.joblib` | `lgbm_classifier.joblib`, `lgbm_regressor.joblib` | Same reasoning as XGBoost. LightGBM's sklearn wrapper serializes cleanly via joblib. |
| **LSTM model** | `.pt` | `lstm_model.pt` | PyTorch convention. Use `torch.save(model.state_dict(), ...)` + a separate architecture config JSON for safe, version-resilient loading. |
| **Transformer model** | `.pt` | `transformer_model.pt` | Same as LSTM — `state_dict()` export is the PyTorch best practice. |
| **Meta-Learner (Stacker)** | `.joblib` | `meta_learner.joblib` | Small sklearn model — joblib is the natural choice. |
| **Preprocessing Pipeline** | `.joblib` | `preprocessing_pipeline.joblib` | The fitted sklearn Pipeline (encoders, scalers, SMOTE config) must be exported alongside models to ensure identical feature transformation at inference time. |
| **Fusion Weights** | `.json` | `fusion_weights.json` | If using weighted fusion instead of stacking, export the Optuna-optimized weight vector as a simple JSON file. Framework-agnostic, human-readable, trivially loadable. |
| **Feature Schema** | `.json` | `feature_schema.json` | Feature names, expected dtypes, and column order. Ensures the backend constructs inputs identically to training. |
| **Model Card / Metadata** | `.json` | `model_card.json` | Version tag, training date, dataset version, metric scores, Python/library versions. |

> [!IMPORTANT]
> **Why NOT `.onnx` or `.h5`?**
> - `.onnx` — Useful for cross-framework deployment or edge inference, but adds conversion complexity. Since the backend is Python/FastAPI (same ecosystem as training), native formats avoid conversion bugs. Consider ONNX only if iOS needs on-device inference (currently it doesn't — iOS calls the API).
> - `.h5` — Keras/TensorFlow format. The project explicitly uses **PyTorch only** (no Keras). Using `.h5` would be incorrect.
> - `.pmml` / `.mlmodel` — Enterprise/Apple formats. Unnecessary overhead when the serving layer is Python-native FastAPI.

#### Final Production Bundle Structure

```
models/production/v1.0.0/
├── xgb_classifier.joblib
├── xgb_regressor.joblib
├── lgbm_classifier.joblib
├── lgbm_regressor.joblib
├── lstm_model.pt
├── lstm_config.json            ← Architecture hyperparams for reconstruction
├── transformer_model.pt
├── transformer_config.json     ← Architecture hyperparams for reconstruction
├── meta_learner.joblib         ← Stacking meta-learner (OR fusion_weights.json)
├── preprocessing_pipeline.joblib
├── feature_schema.json
└── model_card.json
```

---

### 1b — SHAP Analysis Module

The SHAP module (Notebook `12_shap_analysis.ipynb`) produces two types of output:

| Output Type | Description | When Used |
|---|---|---|
| **Global SHAP values** | Summary-level feature importance across the entire test set | Dashboard: "Overall feature importance" panel |
| **Local SHAP values** | Per-prediction feature contributions | Every single prediction served to the frontend |

#### Recommended Export Strategy

| Component | Format | File(s) | Rationale |
|---|---|---|---|
| **Global SHAP summary values** | `.npy` + `.json` | `shap_global_values.npy`, `shap_global_summary.json` | `.npy` for fast numpy array loading of the raw SHAP matrix; `.json` for the human-readable summary (top features, mean absolute SHAP values) served to the dashboard. |
| **SHAP Explainer objects** | `.joblib` | `shap_tree_explainer.joblib` | The fitted `TreeExplainer` (for XGBoost/LightGBM) must be saved so the backend can compute local SHAP values on-the-fly for each new prediction without re-fitting. |
| **Deep SHAP config** | `.json` + code | `shap_deep_config.json` | For LSTM/Transformer, `DeepExplainer` or `GradientExplainer` requires the model + background data. Save a reference background dataset (`.npy`) and the configuration. The explainer is reconstructed at backend startup. |
| **SHAP feature name mapping** | `.json` | `shap_feature_names.json` | Maps column indices → human-readable feature names for frontend display (e.g., index 3 → "Wind Speed at Origin"). |
| **Pre-computed SHAP plots** | `.png` | `shap_summary_bar.png`, `shap_summary_beeswarm.png` | Static reference plots for documentation and the admin panel. NOT used for live dashboard rendering — the dashboard renders live SHAP data via Recharts. |

> [!TIP]
> **Runtime SHAP Strategy:** The backend should compute local SHAP values **at prediction time** using the saved explainer, rather than pre-computing and storing SHAP values for every possible input. This keeps the system dynamic and handles unseen inputs correctly.

---

## 2. Model Integration with Backend

### 2a — Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│  Next.js Web │────▶│              │     │  Model Service Layer    │
│  Dashboard   │     │   FastAPI    │────▶│                         │
└──────────────┘     │   Backend    │     │  ┌─ Preprocessing Pipe  │
                     │              │     │  ├─ XGBoost / LightGBM  │
┌──────────────┐     │  (Python)    │     │  ├─ LSTM / Transformer  │
│  SwiftUI iOS │────▶│              │     │  ├─ Meta-Learner        │
│  App         │     │              │     │  └─ SHAP Explainer      │
└──────────────┘     └──────┬───────┘     └─────────────────────────┘
                            │
                     ┌──────┴───────┐
                     │  PostgreSQL  │     ┌───────────┐
                     │  (Storage)   │     │   Redis   │
                     └──────────────┘     │  (Cache)  │
                                          └───────────┘
```

### 2b — Model Loading Strategy

All models are loaded **once at server startup** — not per-request. This is critical for performance.

```python
# backend/app/services/model_service.py (conceptual)

import joblib
import torch
import json
import shap
import numpy as np

class ModelService:
    """Singleton service — initialized once at FastAPI startup."""

    def __init__(self, model_dir: str = "models/production/v1.0.0"):
        # 1. Load preprocessing pipeline
        self.pipeline = joblib.load(f"{model_dir}/preprocessing_pipeline.joblib")

        # 2. Load GBDT models
        self.xgb_clf = joblib.load(f"{model_dir}/xgb_classifier.joblib")
        self.xgb_reg = joblib.load(f"{model_dir}/xgb_regressor.joblib")
        self.lgbm_clf = joblib.load(f"{model_dir}/lgbm_classifier.joblib")
        self.lgbm_reg = joblib.load(f"{model_dir}/lgbm_regressor.joblib")

        # 3. Load PyTorch models (CPU inference)
        self.lstm_config = json.load(open(f"{model_dir}/lstm_config.json"))
        self.lstm_model = self._load_pytorch_model("lstm", model_dir)

        self.transformer_config = json.load(open(f"{model_dir}/transformer_config.json"))
        self.transformer_model = self._load_pytorch_model("transformer", model_dir)

        # 4. Load meta-learner
        self.meta_learner = joblib.load(f"{model_dir}/meta_learner.joblib")

        # 5. Load SHAP explainer
        self.shap_explainer = joblib.load(f"{model_dir}/shap_tree_explainer.joblib")

        # 6. Load feature schema
        self.feature_schema = json.load(open(f"{model_dir}/feature_schema.json"))
        self.shap_feature_names = json.load(open(f"{model_dir}/shap_feature_names.json"))

    def _load_pytorch_model(self, model_type: str, model_dir: str):
        """Load a PyTorch model from state_dict."""
        # Reconstruct architecture from config, then load weights
        # ... (architecture-specific code)
        model = ...
        model.load_state_dict(torch.load(f"{model_dir}/{model_type}_model.pt", map_location="cpu"))
        model.eval()
        return model

    def predict(self, raw_input: dict) -> dict:
        """Full inference pipeline: preprocess → base models → ensemble → SHAP."""
        # 1. Feature engineering + preprocessing
        features = self.pipeline.transform(raw_input)

        # 2. Base model predictions
        xgb_cls_prob = self.xgb_clf.predict_proba(features)[0][1]
        xgb_reg_pred = self.xgb_reg.predict(features)[0]
        lgbm_cls_prob = self.lgbm_clf.predict_proba(features)[0][1]
        lgbm_reg_pred = self.lgbm_reg.predict(features)[0]
        # lstm_pred, transformer_pred = ... (sequential inference)

        # 3. Meta-learner fusion
        stacked_input = np.array([[xgb_cls_prob, lgbm_cls_prob, ...]])
        final_probability = self.meta_learner.predict_proba(stacked_input)[0][1]
        final_duration = ...  # weighted average of regressors

        # 4. SHAP values (using TreeExplainer on primary GBDT)
        shap_values = self.shap_explainer.shap_values(features)

        return {
            "is_delayed": final_probability > 0.5,
            "delay_probability": float(final_probability),
            "predicted_delay_minutes": max(0, float(final_duration)),
            "shap_values": self._format_shap(shap_values),
            "model_version": "v1.0.0"
        }

    def _format_shap(self, shap_values) -> list:
        """Format SHAP values as JSON-serializable feature contributions."""
        return [
            {"feature": name, "contribution": float(val)}
            for name, val in zip(self.shap_feature_names, shap_values[0])
        ]
```

### 2c — Serving Both Web & iOS

Both the Next.js web dashboard and SwiftUI iOS app consume the **exact same REST API endpoints**. The API-first design ensures:

| Concern | Strategy |
|---|---|
| **Shared endpoints** | Both platforms call the same `/api/v1/predict/delay` etc. — no platform-specific APIs |
| **Response format** | JSON everywhere. Pydantic models enforce consistent schemas |
| **Authentication** | JWT tokens — web stores in httpOnly cookies, iOS stores in Keychain |
| **Push notifications (iOS)** | Backend sends APNs via a notification service when delay status changes |
| **SHAP rendering** | Web renders SHAP bars via Recharts; iOS renders via Swift Charts — both consume the same `shap_values` array from the API |
| **Caching** | Redis caches prediction results keyed by `(flight_id, date, model_version)` — both platforms benefit equally from cache hits |

---

## 3. Backend API Design

### 3a — API Versioning & Base URL

```
Base URL:  https://api.skylytics.io/api/v1
Local Dev: http://localhost:8000/api/v1
```

### 3b — Complete Endpoint Inventory

#### 🔐 Authentication & User Management

| # | Method | Endpoint | Purpose | Request Body | Response |
|---|---|---|---|---|---|
| 1 | `POST` | `/auth/register` | Register new user (manager or passenger) | `{ email, password, full_name, role: "manager" \| "passenger" }` | `{ user_id, email, role, access_token, refresh_token }` |
| 2 | `POST` | `/auth/login` | Authenticate user | `{ email, password }` | `{ user_id, email, role, access_token, refresh_token }` |
| 3 | `POST` | `/auth/refresh` | Refresh access token | `{ refresh_token }` | `{ access_token, refresh_token }` |
| 4 | `POST` | `/auth/logout` | Invalidate tokens | Header: `Authorization: Bearer <token>` | `{ message: "Logged out" }` |
| 5 | `GET` | `/auth/me` | Get current user profile | Header: `Authorization: Bearer <token>` | `{ user_id, email, full_name, role, created_at }` |
| 6 | `PUT` | `/auth/me` | Update user profile | `{ full_name, email }` | `{ user_id, email, full_name, updated_at }` |
| 7 | `PUT` | `/auth/me/password` | Change password | `{ current_password, new_password }` | `{ message: "Password updated" }` |

---

#### 🤖 Prediction & ML Inference

| # | Method | Endpoint | Purpose | Request Body | Response |
|---|---|---|---|---|---|
| 8 | `POST` | `/predict/delay` | Predict delay (classification) — returns probability + SHAP values | `{ airline, origin_airport, destination_airport, scheduled_departure, month, day_of_week, distance, weather_data?: {...} }` | `{ prediction_id, is_delayed, delay_probability, shap_values: [{feature, contribution}], model_version, timestamp }` |
| 9 | `POST` | `/predict/duration` | Predict delay duration (regression) in minutes | Same as #8 | `{ prediction_id, predicted_delay_minutes, confidence_interval: {lower, upper}, model_version }` |
| 10 | `POST` | `/predict/combined` | Combined prediction — both classification + regression + SHAP in one call | Same as #8 | Merged response of #8 + #9 |
| 11 | `POST` | `/whatif` | What-if simulation — modified inputs → new prediction | `{ base_prediction_id, modified_features: { weather_severity?: int, congestion_level?: int, departure_hour?: int, ... } }` | Same as #10 + `{ delta_from_base: { probability_change, duration_change } }` |

---

#### ✈️ Flight Data & History

| # | Method | Endpoint | Purpose | Request Body / Params | Response |
|---|---|---|---|---|---|
| 12 | `GET` | `/flights/{flight_id}` | Get stored flight record + historical predictions | Path: `flight_id` | `{ flight_id, airline, origin, destination, scheduled_departure, status, predictions: [...] }` |
| 13 | `GET` | `/flights` | Search/list flights with filters | Query: `?origin=JFK&dest=LAX&date=2026-04-09&airline=AA&page=1&limit=20` | `{ flights: [...], total_count, page, limit }` |
| 14 | `GET` | `/flights/{flight_id}/predictions` | Get prediction history for a flight | Path: `flight_id` | `{ predictions: [{ prediction_id, timestamp, probability, duration, model_version }] }` |

---

#### 📊 SHAP & Explainability

| # | Method | Endpoint | Purpose | Request Body / Params | Response |
|---|---|---|---|---|---|
| 15 | `GET` | `/shap/{prediction_id}` | Get SHAP feature importance for a specific prediction | Path: `prediction_id` | `{ prediction_id, shap_values: [{feature, contribution, direction: "positive" \| "negative"}], base_value }` |
| 16 | `GET` | `/shap/global` | Get global SHAP summary (top features across all predictions) | Query: `?top_n=10` | `{ features: [{feature, mean_abs_shap, rank}] }` |

---

#### 🗺️ Heatmap & Analytics

| # | Method | Endpoint | Purpose | Request Body / Params | Response |
|---|---|---|---|---|---|
| 17 | `GET` | `/heatmap` | Aggregated delay heatmap data by airport/route | Query: `?date=2026-04-09&group_by=airport \| route` | `{ data: [{ airport_code, lat, lon, avg_delay, flight_count, delay_severity }] }` |
| 18 | `GET` | `/analytics/summary` | Dashboard KPI summary (total flights, delay rate, avg delay, etc.) | Query: `?period=today \| week \| month` | `{ total_flights, delayed_count, on_time_rate, avg_delay_minutes, top_delayed_airport }` |

---

#### 🧠 AI Assistant

| # | Method | Endpoint | Purpose | Request Body | Response |
|---|---|---|---|---|---|
| 19 | `POST` | `/assistant/chat` | AI Assistant — streams LLM response based on flight context | `{ message, conversation_history?: [...], flight_context?: { flight_id } }` | SSE stream or `{ response, sources: [...] }` |

---

#### 📌 Saved Flights (iOS Passenger Feature)

| # | Method | Endpoint | Purpose | Request Body / Params | Response |
|---|---|---|---|---|---|
| 20 | `POST` | `/users/{user_id}/flights` | Save/pin a flight to passenger watchlist | `{ flight_id, notification_enabled: bool }` | `{ saved_flight_id, flight_id, created_at }` |
| 21 | `GET` | `/users/{user_id}/flights` | Get all saved/pinned flights for a passenger | Path: `user_id` | `{ saved_flights: [{ flight_id, airline, route, status, prediction }] }` |
| 22 | `DELETE` | `/users/{user_id}/flights/{flight_id}` | Remove a flight from the watchlist | Path: `user_id`, `flight_id` | `{ message: "Removed" }` |

---

#### 💬 Collaboration (Web Manager Feature)

| # | Method | Endpoint | Purpose | Request Body / Params | Response |
|---|---|---|---|---|---|
| 23 | `POST` | `/collaboration/messages` | Post a shared insight/message for ops team | `{ flight_id, content, author_id }` | `{ message_id, flight_id, content, author, created_at }` |
| 24 | `GET` | `/collaboration/messages/{flight_id}` | Get discussion thread for a flight | Path: `flight_id`, Query: `?page=1&limit=50` | `{ messages: [...], total_count }` |

---

#### 🔔 Notifications

| # | Method | Endpoint | Purpose | Request Body / Params | Response |
|---|---|---|---|---|---|
| 25 | `GET` | `/notifications` | Get user notifications | Header: `Authorization`, Query: `?unread_only=true` | `{ notifications: [{ id, type, title, body, read, created_at }] }` |
| 26 | `PUT` | `/notifications/{id}/read` | Mark notification as read | Path: `id` | `{ message: "Marked read" }` |
| 27 | `POST` | `/notifications/register-device` | Register iOS device for push notifications (APNs) | `{ device_token, platform: "ios" }` | `{ message: "Registered" }` |

---

#### ⚙️ System & Health

| # | Method | Endpoint | Purpose | Request Body / Params | Response |
|---|---|---|---|---|---|
| 28 | `GET` | `/health` | Health check — confirms model loaded, DB connected, Redis alive | — | `{ status: "healthy", model_loaded: true, model_version: "v1.0.0", db: "connected", cache: "connected" }` |
| 29 | `GET` | `/admin/metrics` | Admin-only: system metrics (request count, latency, error rate) | Header: `Authorization` (admin role) | `{ total_requests, avg_latency_ms, error_rate, cache_hit_rate }` |

---

## 4. Backend Tech Stack

Derived from: `SKYLYTICS_PROPOSAL.txt`, `project_context.md`, `SKYLYTICS_PROPOSAL_SUMMARY.md`, and existing backend code.

### 4a — Core Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| **Language** | Python | 3.10+ |
| **API Framework** | FastAPI | Async, high-performance, auto-generated OpenAPI docs |
| **ASGI Server** | Uvicorn | Production: with `--workers` flag or behind Gunicorn |
| **Validation** | Pydantic v2 | Request/response schema validation |
| **Database** | PostgreSQL | Relational storage — flights, predictions, users, SHAP values |
| **ORM** | SQLAlchemy 2.0 + Alembic | Async ORM + database migrations |
| **Caching** | Redis | Prediction cache (TTL=1hr), session storage |
| **Authentication** | JWT (via python-jose or PyJWT) | Access + Refresh tokens; bcrypt for password hashing |

### 4b — ML / Inference Stack

| Library | Purpose |
|---|---|
| `joblib` | Load serialized sklearn/XGBoost/LightGBM models |
| `torch` (CPU) | Load and run LSTM/Transformer models (CPU inference mode) |
| `xgboost` | XGBoost runtime for predictions |
| `lightgbm` | LightGBM runtime for predictions |
| `scikit-learn` | Preprocessing pipeline runtime |
| `shap` | Compute per-prediction SHAP values at inference time |
| `numpy` / `pandas` | Feature engineering and data manipulation |

### 4c — DevOps & Deployment

| Tool | Purpose |
|---|---|
| **Docker** | Containerize FastAPI + dependencies |
| **Docker Compose** | Local dev: FastAPI + PostgreSQL + Redis in one command |
| **AWS EC2** | Production backend hosting |
| **AWS RDS** | Managed PostgreSQL instance |
| **Kubernetes (optional)** | Container orchestration for horizontal scaling |
| **GitHub Actions (recommended)** | CI/CD pipeline — lint, test, build, deploy |

### 4d — Testing & Monitoring

| Tool | Purpose |
|---|---|
| `pytest` + `httpx` | Unit & integration tests for API endpoints |
| `Postman` / `Bruno` | Manual API testing & collection sharing |
| Logging: `structlog` or `loguru` | Structured JSON logging |
| Monitoring: AWS CloudWatch / Prometheus (optional) | Request latency, error rates, model drift detection |

### 4e — PostgreSQL Schema (Key Tables)

```sql
-- Core tables
users             (id, email, password_hash, full_name, role, created_at)
flights           (id, airline, flight_number, origin, destination, scheduled_departure, status, ...)
predictions       (id, flight_id, user_id, model_version, delay_probability, delay_minutes, created_at)
shap_values       (id, prediction_id, feature_name, contribution_value)

-- Passenger features
user_saved_flights (id, user_id, flight_id, notification_enabled, created_at)
device_tokens      (id, user_id, device_token, platform, created_at)
notifications      (id, user_id, type, title, body, read, created_at)

-- Manager features
flight_comments   (id, flight_id, author_id, content, created_at)

-- System
model_registry    (id, version, trained_at, metrics_json, is_active)
```

---

## 5. Functional & Non-Functional Requirements

### 5a — Functional Requirements (FR)

Extracted from: Proposal (Sections 2.4, 4.3, 4.4), Project Context, Gap Audit Report.

#### Prediction & ML

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Predict whether a flight will be delayed (binary: yes/no) with a probability score | **Critical** |
| FR-02 | Predict the duration of a delay in minutes (regression) | **Critical** |
| FR-03 | Use a hybrid ensemble model combining XGBoost/LightGBM with LSTM/Transformer | **Critical** |
| FR-04 | Generate SHAP explanations for every prediction (global + per-prediction) | **Critical** |
| FR-05 | Support LIME as a secondary explainability method for spot-checks | Medium |
| FR-06 | Provide a what-if simulator — users modify inputs and see prediction changes | **High** |
| FR-07 | Generate delay heatmaps aggregated by airport and route | **High** |

#### Data Integration

| ID | Requirement | Priority |
|---|---|---|
| FR-08 | Ingest historical flight data from BTS Kaggle dataset (2015) + post-2015 BTS data | **Critical** |
| FR-09 | Integrate real-time weather data from Meteostat API | **High** |
| FR-10 | Integrate airport/route metadata from OpenFlights | **High** |
| FR-11 | Optional: Integrate live traffic data from OpenSky Network | Low |

#### User Management & Auth

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | User registration with role selection (manager vs passenger) | **Critical** |
| FR-13 | User login/logout with JWT-based authentication | **Critical** |
| FR-14 | Role-based access control — managers see dashboard, passengers see flight tracker | **High** |

#### Web Dashboard (Manager)

| ID | Requirement | Priority |
|---|---|---|
| FR-15 | Delay prediction form — input flight parameters, get prediction + SHAP | **Critical** |
| FR-16 | SHAP explanation panel — interactive bar chart showing feature contributions | **Critical** |
| FR-17 | Interactive delay heatmap — map visualization with airport delay severity | **High** |
| FR-18 | What-if simulation panel — sliders/dropdowns to modify inputs, live output update | **High** |
| FR-19 | Prediction history — view past predictions for a flight or across all flights | **High** |
| FR-20 | Dashboard KPI summary — total flights, delay rate, average delay, etc. | **High** |
| FR-21 | Collaboration / messaging panel — share insights and discuss flights with ops team | Medium |
| FR-22 | AI Assistant sidebar — natural language Q&A about flight context and predictions | Medium |
| FR-23 | Smart notifications — in-app alerts for delay status changes | **High** |

#### iOS App (Passenger)

| ID | Requirement | Priority |
|---|---|---|
| FR-24 | Flight search and status tracking | **Critical** |
| FR-25 | Delay prediction per flight with probability display | **Critical** |
| FR-26 | SHAP mini-chart on prediction detail screen | **High** |
| FR-27 | Save / pin flights to a personal watchlist | **High** |
| FR-28 | Push notifications for saved flight delay alerts (APNs) | **High** |
| FR-29 | AI Smart Assistant — natural language flight queries | Medium |
| FR-30 | User profile management | Medium |

---

### 5b — Non-Functional Requirements (NFR)

Extracted from: Proposal (Section 5), Project Context (Section 4, 5, 6), Frontend Design Rules.

#### Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | API prediction latency (P95) | < 200ms (with Redis cache) |
| NFR-02 | API uptime | ≥ 99% |
| NFR-03 | Redis cache TTL for predictions | 1 hour, keyed by `(flight_id, date, model_version)` |
| NFR-04 | Frontend initial page load (web) | < 3 seconds (Lighthouse target) |
| NFR-05 | Model loading at server startup | < 30 seconds for full model bundle |

#### Scalability

| ID | Requirement | Target |
|---|---|---|
| NFR-06 | Handle enterprise-scale datasets | 5M+ flight records |
| NFR-07 | Horizontal scaling via containerization | Docker + optional Kubernetes |
| NFR-08 | Database connection pooling | Async SQLAlchemy with pool limits |

#### Security

| ID | Requirement | Target |
|---|---|---|
| NFR-09 | All API communication over HTTPS | TLS 1.2+ |
| NFR-10 | Password storage | bcrypt hashed, never plaintext |
| NFR-11 | JWT token expiration | Access: 15 min, Refresh: 7 days |
| NFR-12 | CORS policy | Whitelist only frontend origins + iOS bundle |
| NFR-13 | No direct DB access from any frontend | API-first architecture enforced |
| NFR-14 | Input validation on all endpoints | Pydantic models |

#### Reliability

| ID | Requirement | Target |
|---|---|---|
| NFR-15 | Fallback to cached Kaggle dataset if Meteostat API is down | Graceful degradation |
| NFR-16 | Mock model fallback if model files missing at startup | System stays operational (existing behavior) |
| NFR-17 | Model versioning — every prediction logs model version | Full traceability |

#### Usability

| ID | Requirement | Target |
|---|---|---|
| NFR-18 | Dark-mode-only UI for V1 | Reduces eye strain for ops centers |
| NFR-19 | Web dashboard is SEO-friendly (Next.js SSR) | Proper meta tags, heading hierarchy |
| NFR-20 | Responsive design — desktop, tablet, mobile | Sidebar collapses at < 1024px |
| NFR-21 | iOS app meets Apple App Store standards | HIG compliance, safe areas |
| NFR-22 | All interactive elements: min 44px touch target | Accessibility standard |
| NFR-23 | Predictions are never raw numbers — always accompanied by SHAP explanation | Trust and interpretability |

#### Maintainability

| ID | Requirement | Target |
|---|---|---|
| NFR-24 | Modular codebase — ML, API, and frontend are independently deployable | Monorepo with clear boundaries |
| NFR-25 | Model drift detection pipeline | Compare live prediction distribution vs training |
| NFR-26 | Structured logging (JSON) | Queryable logs for debugging |
| NFR-27 | Unit test coverage for API endpoints | pytest + httpx |

---

## 6. Frontend Pages & Screens

### 6a — Web Frontend (Next.js + Tailwind CSS)

Derived from: `project_context.md` (Phase 5), `frontend_design_rules.md`, existing `app/` directory structure, and proposal deliverables.

#### Existing Pages (already scaffolded)

| Route | File | Status | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | ✅ Exists (basic) | Landing / role selector — links to Manager & Passenger portals |
| `/login` | `app/login/page.tsx` | ✅ Exists (basic) | Login form |
| `/register` | `app/register/page.tsx` | ✅ Exists (basic) | Registration form |
| `/manager` | `app/manager/page.tsx` | ✅ Exists (basic) | Manager dashboard |
| `/passenger` | `app/passenger/page.tsx` | ✅ Exists (basic) | Passenger portal |

#### Full Page Inventory (To Build)

| # | Route | Page Name | Description | Key API Calls |
|---|---|---|---|---|
| 1 | `/` | **Marketing Landing Page** | Product showcase — hero section with value prop, features overview, CTA to register/login. SEO-optimized. | None (static) |
| 2 | `/login` | **Login** | Email + password form, role-aware redirect (manager → dashboard, passenger → flight tracker) | `POST /auth/login` |
| 3 | `/register` | **Register** | Registration form with role picker (manager / passenger) | `POST /auth/register` |
| 4 | `/manager` | **Manager Dashboard (Home)** | KPI summary cards (total flights, delay rate, avg delay), recent predictions list, quick-predict widget | `GET /analytics/summary`, `GET /flights` |
| 5 | `/manager/predict` | **Prediction Form** | Input flight parameters (airline, origin, destination, departure time, etc.), submit for prediction | `POST /predict/combined` |
| 6 | `/manager/predict/[id]` | **Prediction Result** | Hero: delay probability dial (large number, colored by severity). SHAP panel: horizontal bar chart of top-6 feature contributions. Duration estimate. | `GET /shap/{prediction_id}` |
| 7 | `/manager/heatmap` | **Delay Heatmap** | Full-width dark map (Mapbox / OpenStreetMap dark tiles). Airport nodes sized by traffic, colored by delay severity. Hover tooltips. | `GET /heatmap` |
| 8 | `/manager/whatif` | **What-If Simulator** | Two-panel layout: left = input controls (sliders for weather, congestion, departure hour), right = live prediction output that animates on input change | `POST /whatif` |
| 9 | `/manager/history` | **Prediction History** | Table/list of all past predictions with filters (date range, airport, airline). Click to view full prediction detail. | `GET /flights`, `GET /flights/{id}/predictions` |
| 10 | `/manager/collaboration` | **Collaboration Panel** | Discussion threads per flight. Post insights, read team comments. | `GET/POST /collaboration/messages` |
| 11 | `/manager/assistant` | **AI Assistant** | Chat sidebar / full page — natural language queries about flights and predictions | `POST /assistant/chat` |
| 12 | `/manager/settings` | **Manager Settings** | Profile management, notification preferences, API key management (if applicable) | `GET/PUT /auth/me` |
| 13 | `/passenger` | **Passenger Home** | Search flights, view saved/pinned flights with status pills | `GET /flights`, `GET /users/{id}/flights` |
| 14 | `/passenger/flight/[id]` | **Flight Detail** | Flight status, delay prediction with SHAP mini-chart, save/unsave button | `GET /flights/{id}`, `POST /predict/combined` |
| 15 | `/passenger/profile` | **Passenger Profile** | Account settings, notification preferences | `GET/PUT /auth/me` |

#### Shared Components

| Component | Description |
|---|---|
| `Navbar` | Top bar with logo, search, alert bell, user avatar (✅ exists) |
| `Sidebar` | Manager navigation — Home, Predict, Heatmap, What-If, History, Settings |
| `PageShell` | Layout wrapper with sidebar + content area (✅ exists) |
| `DelayProbabilityDial` | Hero component — large percentage number with animated confidence bar |
| `ShapBarChart` | Horizontal bar chart (Recharts) showing SHAP feature contributions |
| `FlightCard` | Compact card for flight lists — airline, route, status pill, probability |
| `MetricCard` | KPI card — label, value, change percentage, trend arrow |
| `HeatmapView` | Dark-tile map with airport delay nodes |
| `WhatIfPanel` | Slider/dropdown controls + live prediction output |
| `ChatInterface` | AI assistant chat UI with message bubbles |
| `NotificationToast` | Bottom-right toast for real-time delay alerts |
| `SkeletonCard` | Loading placeholder (animate-pulse, hand-written, on-brand) |

---

### 6b — iOS Frontend (SwiftUI)

Derived from: `frontend_design_rules.md`, `project_context.md`, proposal Section 4.4.

#### Screen Inventory

| # | Screen | Tab | Description | Key API Calls |
|---|---|---|---|---|
| 1 | **Onboarding** | — | 2–3 screen walkthrough: welcome, value prop, get started | None |
| 2 | **Login** | — | Email + password, link to register | `POST /auth/login` |
| 3 | **Register** | — | Registration form (passenger role auto-assigned) | `POST /auth/register` |
| 4 | **Home / Feed** | 🏠 Home | Overview: saved flights with status pills, quick prediction stats | `GET /users/{id}/flights`, `GET /analytics/summary` |
| 5 | **Flight Search** | 🔍 Search | Search by flight number, route, or airline. Results list with status pills | `GET /flights?query=...` |
| 6 | **Flight Detail** | — (push) | Full flight card: airline, route, delay probability dial, SHAP mini-chart. Save/unsave button. | `GET /flights/{id}`, `POST /predict/combined`, `GET /shap/{id}` |
| 7 | **Prediction Result** | — (push) | Expanded prediction view: large probability number, SHAP bar chart (Swift Charts), duration estimate | `POST /predict/combined` |
| 8 | **Alerts / Notifications** | 🔔 Alerts | List of push notification history — delay alerts, status changes | `GET /notifications` |
| 9 | **Saved Flights** | ✈️ Flights | All pinned/saved flights with real-time status. Pull-to-refresh. | `GET /users/{id}/flights` |
| 10 | **AI Assistant** | — (modal/push) | Chat interface for natural language flight queries | `POST /assistant/chat` |
| 11 | **Profile** | 👤 Profile | Account settings, notification toggle, device management, logout | `GET/PUT /auth/me`, `POST /notifications/register-device` |

#### Tab Bar Structure

```
┌──────────────────────────────────┐
│  Home  │  Search  │  Alerts  │  Flights  │  Profile  │
└──────────────────────────────────┘
```

#### iOS-Specific Design Notes

| Element | Specification |
|---|---|
| Color palette | Identical to web (dark-mode-only, same CSS variables mapped to SwiftUI `Color` assets) |
| Typography | SF Pro (system) — mapped to match web's Space Grotesk / Inter hierarchy |
| Charts | Swift Charts (native) — NOT image exports from the backend |
| Animations | `.spring(response: 0.4, dampingFraction: 0.8)` for state transitions |
| Loading states | `redacted(reason: .placeholder)` on skeleton cards |
| Touch targets | Minimum `44 × 44pt` on all interactive elements |
| Safe areas | Always respected — no content behind home indicator or notch |
| Pull-to-refresh | On all live data lists |
| Push notifications | APNs integration — device token registered via `POST /notifications/register-device` |

---

## Summary of Key Decisions Needed

> [!IMPORTANT]
> The following items were flagged in the Gap Audit Report and need team confirmation before implementation:

| # | Decision | Options | Impact |
|---|---|---|---|
| 1 | **AI Assistant** — The proposal mentions it but the model roadmap has no LLM training. | (a) Integrate an external LLM API (OpenAI, Gemini, etc.) (b) Drop entirely for V1 | Affects 2 API endpoints + 2 frontend screens |
| 2 | **Collaboration Tools** — Backend endpoints exist in context but no DB schema or real implementation yet. | (a) Build messaging system (b) Simplify to read-only shared annotations | Affects manager dashboard UX |
| 3 | **Saved Flights Persistence** — Proposal mandates it for iOS but the Gap Audit notes no endpoints were originally planned. | Already added to API design above — confirm with team | Affects iOS passenger experience |
| 4 | **Stacking vs Weighted Fusion** — The hybrid ensemble can use either approach. | Decision made during Notebook 11 execution | Affects export format (meta_learner.joblib vs fusion_weights.json) |
