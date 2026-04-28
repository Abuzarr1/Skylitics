# Skylytics — Advanced Model Development Roadmap

> **Phase:** Advanced Model Development (Prototype Phase is **permanently skipped**)  
> **First Baseline:** XGBoost (not Logistic Regression / Decision Tree)  
> **Created:** 2026-04-08  
> **Status:** Planning Complete — Awaiting Execution

---

## 0. Pre-Flight Confirmation

| Item | Status |
|---|---|
| Prototype Phase (Section 4.1) | ❌ **SKIPPED** — We start at Section 4.2 |
| Starting Model | XGBoost (Classifier + Regressor) |
| Deep Learning Framework | PyTorch only (No Keras) |
| Explainability | SHAP (primary) + LIME (secondary) |
| Target Variable (Classification) | `IS_DELAYED` = 1 if `ARR_DELAY > 15 min`, else 0 |
| Target Variable (Regression) | `DELAY_MINUTES` = `ARR_DELAY` clipped at 0 |

---

## 1. Data Acquisition Plan

### 1a — BTS 2015 (Kaggle) — ✅ PRESENT

**Location:** `backend/Dataset/flights.csv`  
**Size:** ~592 MB · 5,819,079 rows · 31 columns  
**Source:** https://www.kaggle.com/datasets/usdot/flight-delays

#### Schema (31 Columns)

| # | Column | Type | Description |
|---|---|---|---|
| 0 | `YEAR` | int | Flight year (2015) |
| 1 | `MONTH` | int | Month (1–12) |
| 2 | `DAY` | int | Day of month |
| 3 | `DAY_OF_WEEK` | int | Day of week (1=Mon … 7=Sun) |
| 4 | `AIRLINE` | str | IATA carrier code |
| 5 | `FLIGHT_NUMBER` | int | Flight number |
| 6 | `TAIL_NUMBER` | str | Aircraft tail number |
| 7 | `ORIGIN_AIRPORT` | str | Origin airport IATA code |
| 8 | `DESTINATION_AIRPORT` | str | Destination airport IATA code |
| 9 | `SCHEDULED_DEPARTURE` | int | Scheduled departure (HHMM) |
| 10 | `DEPARTURE_TIME` | float | Actual departure time |
| 11 | `DEPARTURE_DELAY` | float | Departure delay in minutes |
| 12 | `TAXI_OUT` | float | Taxi-out time (minutes) |
| 13 | `WHEELS_OFF` | float | Wheels-off time |
| 14 | `SCHEDULED_TIME` | float | Scheduled flight duration |
| 15 | `ELAPSED_TIME` | float | Actual elapsed time |
| 16 | `AIR_TIME` | float | Time in the air |
| 17 | `DISTANCE` | float | Flight distance (miles) |
| 18 | `WHEELS_ON` | float | Wheels-on time |
| 19 | `TAXI_IN` | float | Taxi-in time (minutes) |
| 20 | `SCHEDULED_ARRIVAL` | int | Scheduled arrival (HHMM) |
| 21 | `ARRIVAL_TIME` | float | Actual arrival time |
| 22 | `ARRIVAL_DELAY` | float | Arrival delay in minutes (**TARGET source**) |
| 23 | `DIVERTED` | int | 1 = diverted |
| 24 | `CANCELLED` | int | 1 = cancelled |
| 25 | `CANCELLATION_REASON` | str | A/B/C/D code |
| 26 | `AIR_SYSTEM_DELAY` | float | NAS delay (minutes) |
| 27 | `SECURITY_DELAY` | float | Security delay |
| 28 | `AIRLINE_DELAY` | float | Carrier delay |
| 29 | `LATE_AIRCRAFT_DELAY` | float | Late aircraft delay |
| 30 | `WEATHER_DELAY` | float | Weather delay |

#### Supporting Files (also present)

| File | Size | Columns |
|---|---|---|
| `airlines.csv` | 359 B | `IATA_CODE`, `AIRLINE` |
| `airports.csv` | 23 KB | `IATA_CODE`, `AIRPORT`, `CITY`, `STATE`, `COUNTRY`, `LATITUDE`, `LONGITUDE` |

#### Key Fields Check

| Required Field | Present As | ✅ / ❌ |
|---|---|---|
| `FL_DATE` | Composite: `YEAR` + `MONTH` + `DAY` | ✅ (derived) |
| `ORIGIN` | `ORIGIN_AIRPORT` | ✅ |
| `DEST` | `DESTINATION_AIRPORT` | ✅ |
| `DEP_DELAY` | `DEPARTURE_DELAY` | ✅ |
| `ARR_DELAY` | `ARRIVAL_DELAY` | ✅ |
| `CARRIER` | `AIRLINE` | ✅ |
| `WEATHER_DELAY` | `WEATHER_DELAY` | ✅ |
| `CARRIER_DELAY` | `AIRLINE_DELAY` | ✅ |
| `NAS_DELAY` | `AIR_SYSTEM_DELAY` | ✅ |
| `LATE_AIRCRAFT_DELAY` | `LATE_AIRCRAFT_DELAY` | ✅ |
| `CANCELLED` | `CANCELLED` | ✅ |
| `DIVERTED` | `DIVERTED` | ✅ |

> **All required fields are present.** Column names differ slightly from standard BTS naming but are fully mappable.

---

### 1b — BTS Post-2015 (2016–2025) — 🔲 TO ACQUIRE

**Source:** https://www.transtats.bts.gov/DL_SelectFields.aspx?gnoession_VQ=FGJ  
**Table:** `Reporting_Carrier_On_Time_Performance`

**Steps:**
1. Navigate to transtats.bts.gov → On-Time Performance table.
2. Select fields matching our 31-column schema above.
3. Download year-by-year CSVs (2016 through latest available).
4. Save raw files to `Dataset/raw/bts/` — one file per year: `bts_2016.csv`, `bts_2017.csv`, etc.
5. **DO NOT modify raw files.** All transformations happen in notebooks.

> **Note:** BTS field names differ from Kaggle. A column-mapping dictionary will be created in `02_data_merging.ipynb` to standardize names.

---

### 1c — Meteostat (Historical Hourly Weather) — 🔲 TO ACQUIRE

**Source:** https://meteostat.net  
**Library:** `meteostat` (Python)

**Steps:**
1. Extract unique `ORIGIN_AIRPORT` IATA codes from flights data.
2. Map each IATA code → nearest Meteostat weather station using `airports.csv` lat/lon.
3. Pull hourly weather for each station covering the flight date range.
4. Fields to capture: `temp`, `dwpt`, `rhum`, `prcp`, `snow`, `wdir`, `wspd`, `wpgt`, `pres`, `coco` (weather condition code).
5. Save raw weather data to `Dataset/raw/weather/` — one Parquet file per station or year.
6. **Rate limit mitigation:** Cache all responses locally. Use `time.sleep()` between API calls. Estimated ~300 unique airports → batch over multiple sessions.

---

### 1d — OpenFlights (Airport & Route Metadata) — 🔲 TO ACQUIRE

**Source:** https://openflights.org/data.html

**Files to download:**
| File | URL | Purpose |
|---|---|---|
| `airports.dat` | `https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat` | Lat/lon, timezone, ICAO, country for all world airports |
| `routes.dat` | `https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat` | Airline routes (source → dest), codeshares, stops |

**Steps:**
1. Download both `.dat` files programmatically in `01_data_acquisition.ipynb`.
2. Save to `Dataset/raw/openflights/`.
3. Parse CSV (no headers — assign column names from OpenFlights documentation).
4. Filter to U.S. airports relevant to our BTS dataset.

---

### 1e — Output Directory Convention

```
Dataset/
├── raw/                     ← NEVER MODIFY files here
│   ├── bts/                 ← BTS yearly CSVs
│   ├── weather/             ← Meteostat Parquet files
│   └── openflights/         ← airports.dat, routes.dat
├── flights.csv              ← Kaggle BTS 2015 (original)
├── airlines.csv             ← Kaggle airlines lookup
└── airports.csv             ← Kaggle airports lookup
```

---

## 2. Step-by-Step Pipeline — The 15 Notebooks

> **Dual-Output Principle:** Every GBDT step (XGBoost / LightGBM) must implement **two heads** — a **Classifier** (`IS_DELAYED`) and a **Regressor** (`DELAY_MINUTES`).

### Step 01: Data Acquisition
**Notebook:** `01_data_acquisition.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Download/locate all raw data sources |
| **Inputs** | Internet (BTS, Meteostat, OpenFlights) |
| **Outputs** | `Dataset/raw/` populated with all raw files |
| **Key Actions** | Download BTS post-2015 CSVs; pull Meteostat weather via API; download OpenFlights DAT files |
| **Validation** | Row counts logged; schema checks per source |

---

### Step 02: Data Merging & Joining
**Notebook:** `02_data_merging.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Combine all raw sources into a single unified DataFrame |
| **Inputs** | `Dataset/raw/*`, `flights.csv`, `airlines.csv`, `airports.csv` |
| **Outputs** | `outputs/merged_flights.parquet` |
| **Key Actions** | Standardize column names across BTS years; join airport metadata (lat, lon, timezone); join weather data by (airport, date, hour); handle IATA/ICAO code mismatches |
| **Validation** | No duplicate flight records; join coverage report (% flights with weather matched) |

---

### Step 03: Exploratory Data Analysis (EDA)
**Notebook:** `03_eda.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Understand data distributions, correlations, and class balance |
| **Inputs** | `outputs/merged_flights.parquet` |
| **Outputs** | `outputs/eda/` — plots (PNG/HTML), summary statistics |
| **Key Actions** | Distribution of `ARRIVAL_DELAY`; class balance of `IS_DELAYED`; correlation heatmaps; delay by carrier, airport, month, day-of-week; weather impact analysis; missing value matrix |
| **Validation** | Document class imbalance ratio; identify high-cardinality categoricals |

---

### Step 04: Data Cleaning
**Notebook:** `04_data_cleaning.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Handle missing values, cancelled/diverted flights, data type fixes |
| **Inputs** | `outputs/merged_flights.parquet` |
| **Outputs** | `outputs/cleaned_flights.parquet` |
| **Key Actions** | Drop cancelled flights (no arrival delay); drop diverted flights or flag separately; impute missing delay-cause columns (NaN → 0 for non-delayed flights); fix time format inconsistencies; **retain severe weather outliers** (they are signal, not noise) |
| **Validation** | Zero NaN in critical columns; row count delta logged |

---

### Step 05: Feature Engineering
**Notebook:** `05_feature_engineering.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Create all derived features for model training |
| **Inputs** | `outputs/cleaned_flights.parquet` |
| **Outputs** | `outputs/featured_flights.parquet` |
| **Key Actions** | See **Feature Engineering Checklist** (Section 4 below) |
| **Validation** | All engineered features present; no data leakage (no future information used) |

---

### Step 06: Preprocessing Pipeline
**Notebook:** `06_preprocessing_pipeline.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Build a reproducible sklearn Pipeline for encoding, scaling, splitting |
| **Inputs** | `outputs/featured_flights.parquet` |
| **Outputs** | `outputs/X_train.parquet`, `outputs/X_test.parquet`, `outputs/y_train_cls.parquet`, `outputs/y_train_reg.parquet`, `outputs/y_test_cls.parquet`, `outputs/y_test_reg.parquet`; `models/preprocessing_pipeline.pkl` |
| **Key Actions** | Train/test split (80/20, time-based or stratified); encode remaining categoricals (LabelEncoder / TargetEncoder); scale numerics (StandardScaler / RobustScaler); apply SMOTE to training set only (classification); save fitted pipeline for inference reuse |
| **Validation** | No test-set leakage; class distribution in train vs test logged |

---

### Step 07: XGBoost (Classifier & Regressor)
**Notebook:** `07_xgboost_models.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Train XGBoost dual-output models (classification + regression) |
| **Inputs** | Preprocessed train/test splits |
| **Outputs** | `models/xgb_classifier.pkl`, `models/xgb_regressor.pkl`, `outputs/xgb_results.json` |
| **Key Actions** | Train XGBClassifier with `scale_pos_weight` for imbalance; train XGBRegressor; hyperparameter tuning via Optuna (objective: maximize ROC-AUC for cls, minimize RMSE for reg); StratifiedKFold cross-validation (5 folds); log best params + scores |
| **Validation** | ROC-AUC, F1, Precision, Recall (classifier); RMSE, MAE (regressor) |

---

### Step 08: LightGBM (Classifier & Regressor)
**Notebook:** `08_lightgbm_models.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Train LightGBM dual-output models as comparison to XGBoost |
| **Inputs** | Preprocessed train/test splits |
| **Outputs** | `models/lgbm_classifier.pkl`, `models/lgbm_regressor.pkl`, `outputs/lgbm_results.json` |
| **Key Actions** | Train LGBMClassifier with `is_unbalance=True`; train LGBMRegressor; Optuna tuning; cross-validation; compare head-to-head with XGBoost |
| **Validation** | Same metrics as Step 07; comparison table generated |

---

### Step 09: LSTM Model (PyTorch)
**Notebook:** `09_lstm_model.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Build LSTM for sequential delay propagation modeling |
| **Inputs** | Time-windowed feature sequences per route/airport |
| **Outputs** | `models/lstm_model.pt`, `outputs/lstm_results.json` |
| **Key Actions** | Create sequential input: group flights by (origin, date) ordered by time → sliding window of N flights; build PyTorch LSTM (input → LSTM layers → FC → output); train with BCE loss (classifier head) + MSE loss (regressor head); implement early stopping + learning rate scheduling |
| **Validation** | Same metric suite; training/validation loss curves plotted |

---

### Step 10: Transformer Model (PyTorch)
**Notebook:** `10_transformer_model.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Experiment with Transformer for long-range temporal dependencies |
| **Inputs** | Same sequential data as LSTM |
| **Outputs** | `models/transformer_model.pt`, `outputs/transformer_results.json` |
| **Key Actions** | Build custom Transformer encoder (positional encoding → multi-head attention → FF → output); dual heads for classification + regression; compare attention patterns with LSTM hidden states |
| **Validation** | Same metric suite; attention weight visualization |

---

### Step 11: Hybrid Ensemble
**Notebook:** `11_hybrid_ensemble.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Fuse GBDT + Deep Learning outputs into final production model |
| **Inputs** | Predictions from Steps 07–10 |
| **Outputs** | `models/hybrid_ensemble.pkl`, `outputs/ensemble_results.json` |
| **Key Actions** | **Stacking:** Train a meta-learner (Logistic Regression or small XGBoost) on base model predictions; **Weighted Fusion:** Use Optuna to optimize fusion weights; compare stacking vs. weighted fusion; select best approach as production model |
| **Validation** | Must beat best individual model on all primary metrics |

---

### Step 12: SHAP Analysis
**Notebook:** `12_shap_analysis.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Generate global + local feature importance explanations |
| **Inputs** | Trained models + test set |
| **Outputs** | `outputs/shap/` — summary plots, force plots, SHAP value arrays (`.npy` + `.json`) |
| **Key Actions** | TreeExplainer for XGBoost/LightGBM; DeepExplainer or GradientExplainer for LSTM/Transformer; generate summary plots (bar + beeswarm); generate force plots for sample predictions; export SHAP values as JSON (backend will serve these) |
| **Validation** | Top-10 features documented; sanity check against domain knowledge |

---

### Step 13: LIME Analysis
**Notebook:** `13_lime_analysis.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Secondary explainability via LIME for individual prediction spot-checks |
| **Inputs** | Trained models + test set |
| **Outputs** | `outputs/lime/` — LIME explanation HTML files |
| **Key Actions** | LimeTabularExplainer for sample predictions; compare LIME feature attributions with SHAP for consistency; flag any discrepancies for error analysis |
| **Validation** | LIME vs SHAP agreement documented |

---

### Step 14: Model Evaluation
**Notebook:** `14_model_evaluation.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Comprehensive head-to-head evaluation of all models |
| **Inputs** | All model results JSONs + predictions |
| **Outputs** | `outputs/evaluation/` — comparison tables, ROC curves, error analysis |
| **Key Actions** | Consolidated metric comparison table (all models × all metrics); ROC curve overlay plot; confusion matrix heatmaps; error analysis: examine misclassifications by weather, airport, time-of-day; statistical significance tests (McNemar's test for classifiers) |
| **Validation** | Final model selection documented with justification |

---

### Step 15: Model Export
**Notebook:** `15_model_export.ipynb`

| Item | Detail |
|---|---|
| **Goal** | Package final production model for backend deployment |
| **Inputs** | Best model artifacts + preprocessing pipeline |
| **Outputs** | `models/production/` — versioned model bundle |
| **Key Actions** | Save final model with version tag (e.g., `v1.0.0`); save preprocessing pipeline; save feature name list + expected dtypes; create inference function (`predict(features_dict) → {is_delayed, probability, delay_minutes, shap_values}`); write model card (metadata, training date, metrics, data version) |
| **Validation** | End-to-end inference test: raw input → prediction + SHAP output |

---

## 3. Libraries & Tools

### Data Processing
| Library | Purpose |
|---|---|
| `pandas` | DataFrame manipulation |
| `numpy` | Numerical operations |
| `pyarrow` | Parquet read/write (fast columnar storage) |

### Weather Data
| Library | Purpose |
|---|---|
| `meteostat` | Historical hourly weather by station |

### Visualization
| Library | Purpose |
|---|---|
| `matplotlib` | Static plots |
| `seaborn` | Statistical visualizations |
| `plotly` | Interactive plots (EDA, dashboards) |

### Machine Learning
| Library | Purpose |
|---|---|
| `scikit-learn` | Pipelines, preprocessing, metrics, cross-validation |
| `xgboost` | Gradient-boosted trees (classifier + regressor) |
| `lightgbm` | Gradient-boosted trees (comparison) |

### Deep Learning
| Library | Purpose |
|---|---|
| `torch` | PyTorch framework |
| `torch.nn` | Neural network modules (LSTM, Transformer) |

> ⚠️ **No Keras / TensorFlow.** All deep learning is PyTorch-only.

### Imbalance, Tuning & Explainability
| Library | Purpose |
|---|---|
| `imbalanced-learn` | SMOTE, ADASYN for class imbalance |
| `optuna` | Bayesian hyperparameter optimization |
| `shap` | SHAP values (TreeExplainer, DeepExplainer) |
| `lime` | LIME explanations (spot-check) |

### Serialization
| Library | Purpose |
|---|---|
| `joblib` | Model persistence (`.pkl`) |
| `json` | Metrics and SHAP export |

---

## 4. Feature Engineering Checklist

### 4a — Cyclic Encoding (Time Features)

| Feature | Formula |
|---|---|
| `hour_sin` | `sin(2π × hour / 24)` |
| `hour_cos` | `cos(2π × hour / 24)` |
| `day_sin` | `sin(2π × day_of_week / 7)` |
| `day_cos` | `cos(2π × day_of_week / 7)` |
| `month_sin` | `sin(2π × month / 12)` |
| `month_cos` | `cos(2π × month / 12)` |

### 4b — Lag / Rolling Features

| Feature | Description |
|---|---|
| `avg_delay_last_7d_origin` | Average arrival delay at origin airport over past 7 days |
| `rolling_delay_3h_origin_airport` | Rolling average delay at origin in ±3-hour window |
| `prev_flight_delay` | Delay of the previous flight on the same tail number (cascading) |

### 4c — Contextual Features

| Feature | Description |
|---|---|
| `congestion_index` | Number of departures at origin airport within ±1-hour window |
| `cascading_delay_flag` | 1 if `LATE_AIRCRAFT_DELAY > 0`, else 0 |
| `is_hub` | 1 if origin is a major hub airport (ATL, ORD, DFW, DEN, LAX, etc.) |
| `route_frequency` | Total flights on this origin→dest route per day |

### 4d — Weather Features (from Meteostat)

| Feature | Source Column | Description |
|---|---|---|
| `temp` | `temp` | Temperature (°C) |
| `wind_speed` | `wspd` | Wind speed (km/h) |
| `wind_gust` | `wpgt` | Wind gust (km/h) |
| `visibility` | derived from `coco` | Visibility proxy from condition code |
| `precip` | `prcp` | Precipitation (mm) |
| `snow` | `snow` | Snow depth (mm) |

### 4e — Target Variables

| Target | Definition | Task |
|---|---|---|
| `IS_DELAYED` | `1 if ARRIVAL_DELAY > 15 else 0` | Binary Classification |
| `DELAY_MINUTES` | `max(ARRIVAL_DELAY, 0)` | Regression (clipped at 0) |

---

## 5. Evaluation Metrics Checklist

### Classification Metrics

| Metric | Library | Notes |
|---|---|---|
| **ROC-AUC** | `sklearn.metrics.roc_auc_score` | Primary — handles imbalance well |
| **F1-Score** | `sklearn.metrics.f1_score` | Harmonic mean of precision + recall |
| **Precision** | `sklearn.metrics.precision_score` | Of predicted delays, how many are correct |
| **Recall** | `sklearn.metrics.recall_score` | Of actual delays, how many are caught |
| **Confusion Matrix** | `sklearn.metrics.confusion_matrix` | Visual — always include in reports |

### Regression Metrics

| Metric | Library | Notes |
|---|---|---|
| **RMSE** | `sqrt(sklearn.metrics.mean_squared_error)` | Primary — penalizes large errors |
| **MAE** | `sklearn.metrics.mean_absolute_error` | Robust to outliers |

### Additional (Phase 3+)

| Metric | Context |
|---|---|
| SHAP coverage | Every prediction served must carry SHAP values |
| P95 API latency | < 200ms with Redis cache |

---

## 6. Folder Structure

```
advance_model/
├── SKYLYTICS_MODEL_ROADMAP.md          ← This file
├── SKYLYTICS_MODEL_LOG.md              ← Progress log (updated per notebook)
│
├── 01_data_acquisition.ipynb
├── 02_data_merging.ipynb
├── 03_eda.ipynb
├── 04_data_cleaning.ipynb
├── 05_feature_engineering.ipynb
├── 06_preprocessing_pipeline.ipynb
├── 07_xgboost_models.ipynb
├── 08_lightgbm_models.ipynb
├── 09_lstm_model.ipynb
├── 10_transformer_model.ipynb
├── 11_hybrid_ensemble.ipynb
├── 12_shap_analysis.ipynb
├── 13_lime_analysis.ipynb
├── 14_model_evaluation.ipynb
├── 15_model_export.ipynb
│
├── models/                             ← Trained model artifacts
│   └── production/                     ← Final versioned model bundle
│
├── outputs/                            ← All generated outputs
│   ├── eda/                            ← EDA plots and stats
│   ├── shap/                           ← SHAP values and plots
│   ├── lime/                           ← LIME explanations
│   └── evaluation/                     ← Comparison tables, ROC curves
│
└── utils/                              ← Shared Python utilities
    ├── __init__.py
    ├── preprocessing.py                ← Data cleaning + encoding functions
    ├── metrics.py                      ← Evaluation metric helpers
    └── feature_engineering.py          ← Feature creation functions
```

---

## 7. Execution Rules

1. **No raw file mutation.** All raw data stays in `Dataset/raw/` untouched.
2. **Dual-output on every GBDT notebook.** Classifier + Regressor, always.
3. **Outliers stay.** Severe weather events are signal — do NOT drop.
4. **SMOTE on train set only.** Never on test/validation.
5. **Time-based or stratified split.** No random shuffle if using post-2015 data.
6. **Model versioning.** Every saved model gets a version tag.
7. **SHAP is mandatory.** Every model must produce SHAP values.
8. **Update `SKYLYTICS_MODEL_LOG.md`** after every notebook completes.
9. **Meteostat rate limits.** Cache locally, sleep between calls.
10. **PyTorch only.** No Keras, no TensorFlow.
