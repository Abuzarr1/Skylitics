"""
Feature engineering: clean dict → pandas DataFrame with encoded columns.
"""
import pandas as pd
from app.ml.models.xgboost_clf import FEATURE_COLS


def build_features(cleaned: dict, encoders: dict) -> pd.DataFrame:
    """
    Build a single-row DataFrame ready for XGBoost inference.

    Parameters
    ----------
    cleaned  : output of clean_input()
    encoders : dict of sklearn LabelEncoders keyed by 'AIRLINE',
               'ORIGIN_AIRPORT', 'DESTINATION_AIRPORT'

    Returns
    -------
    pd.DataFrame with columns matching FEATURE_COLS
    """
    def encode(key: str, value: str) -> int:
        le = encoders.get(key)
        if le is None:
            return 0
        return int(le.transform([value])[0]) if value in le.classes_ else 0

    row = {
        "MONTH":                       cleaned["month"],
        "DAY_OF_WEEK":                 cleaned["day_of_week"],
        "DISTANCE":                    cleaned["distance"],
        "DEPARTURE_HOUR":              cleaned["hour"],
        "AIRLINE_ENCODED":             encode("AIRLINE",           cleaned["airline"]),
        "ORIGIN_AIRPORT_ENCODED":      encode("ORIGIN_AIRPORT",    cleaned["origin"]),
        "DESTINATION_AIRPORT_ENCODED": encode("DESTINATION_AIRPORT", cleaned["dest"]),
    }
    return pd.DataFrame([row])[FEATURE_COLS]
