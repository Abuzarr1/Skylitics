"""
Singleton loader for XGBoost classifier, regressor, and label encoders.
Import clf, reg, encoders, ENGINE from here — do not reload in each module.
"""
import os
import joblib

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../../skylytics_model_assets")

try:
    clf      = joblib.load(os.path.join(MODEL_DIR, "xgb_classifier.pkl"))
    reg      = joblib.load(os.path.join(MODEL_DIR, "xgb_regressor.pkl"))
    encoders = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))
    ENGINE   = "xgboost"
except Exception:
    clf = reg = encoders = None
    ENGINE = "mock"

FEATURE_COLS = [
    "MONTH",
    "DAY_OF_WEEK",
    "DISTANCE",
    "DEPARTURE_HOUR",
    "AIRLINE_ENCODED",
    "ORIGIN_AIRPORT_ENCODED",
    "DESTINATION_AIRPORT_ENCODED",
]

FEATURE_LABELS = {
    "MONTH":                       "Departure Month",
    "DAY_OF_WEEK":                 "Day of Week",
    "DISTANCE":                    "Flight Distance",
    "DEPARTURE_HOUR":              "Departure Hour",
    "AIRLINE_ENCODED":             "Airline",
    "ORIGIN_AIRPORT_ENCODED":      "Origin Airport",
    "DESTINATION_AIRPORT_ENCODED": "Destination Airport",
}
