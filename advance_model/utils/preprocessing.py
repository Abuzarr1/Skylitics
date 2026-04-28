"""
Skylytics — Preprocessing Utilities
====================================
Shared data cleaning, encoding, and transformation functions
used across the 15-notebook pipeline.

Usage:
    from utils.preprocessing import clean_cancelled_flights, standardize_column_names
"""

import pandas as pd
import numpy as np
from typing import List, Optional, Dict


# ---------------------------------------------------------------------------
# Column Name Standardization
# ---------------------------------------------------------------------------

# Mapping from Kaggle BTS 2015 names → standardized internal names
KAGGLE_TO_STANDARD: Dict[str, str] = {
    "YEAR": "year",
    "MONTH": "month",
    "DAY": "day",
    "DAY_OF_WEEK": "day_of_week",
    "AIRLINE": "carrier",
    "FLIGHT_NUMBER": "flight_number",
    "TAIL_NUMBER": "tail_number",
    "ORIGIN_AIRPORT": "origin",
    "DESTINATION_AIRPORT": "dest",
    "SCHEDULED_DEPARTURE": "scheduled_departure",
    "DEPARTURE_TIME": "departure_time",
    "DEPARTURE_DELAY": "dep_delay",
    "TAXI_OUT": "taxi_out",
    "WHEELS_OFF": "wheels_off",
    "SCHEDULED_TIME": "scheduled_time",
    "ELAPSED_TIME": "elapsed_time",
    "AIR_TIME": "air_time",
    "DISTANCE": "distance",
    "WHEELS_ON": "wheels_on",
    "TAXI_IN": "taxi_in",
    "SCHEDULED_ARRIVAL": "scheduled_arrival",
    "ARRIVAL_TIME": "arrival_time",
    "ARRIVAL_DELAY": "arr_delay",
    "DIVERTED": "diverted",
    "CANCELLED": "cancelled",
    "CANCELLATION_REASON": "cancellation_reason",
    "AIR_SYSTEM_DELAY": "nas_delay",
    "SECURITY_DELAY": "security_delay",
    "AIRLINE_DELAY": "carrier_delay",
    "LATE_AIRCRAFT_DELAY": "late_aircraft_delay",
    "WEATHER_DELAY": "weather_delay",
}


def standardize_column_names(df: pd.DataFrame, mapping: Optional[Dict[str, str]] = None) -> pd.DataFrame:
    """
    Rename DataFrame columns to standardized lowercase names.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataframe with original column names.
    mapping : dict, optional
        Custom column mapping. Defaults to KAGGLE_TO_STANDARD.

    Returns
    -------
    pd.DataFrame
        DataFrame with renamed columns.
    """
    if mapping is None:
        mapping = KAGGLE_TO_STANDARD
    return df.rename(columns=mapping)


# ---------------------------------------------------------------------------
# Data Cleaning Functions
# ---------------------------------------------------------------------------

def clean_cancelled_flights(df: pd.DataFrame, cancelled_col: str = "cancelled") -> pd.DataFrame:
    """
    Remove cancelled flights (no arrival delay to predict).

    Parameters
    ----------
    df : pd.DataFrame
    cancelled_col : str
        Column name indicating cancellation (1 = cancelled).

    Returns
    -------
    pd.DataFrame
        Filtered dataframe with cancelled flights removed.
    """
    n_before = len(df)
    df_clean = df[df[cancelled_col] != 1].copy()
    n_removed = n_before - len(df_clean)
    print(f"[preprocessing] Removed {n_removed:,} cancelled flights ({n_removed/n_before:.2%})")
    return df_clean


def clean_diverted_flights(df: pd.DataFrame, diverted_col: str = "diverted") -> pd.DataFrame:
    """
    Remove diverted flights (arrival delay is unreliable).

    Parameters
    ----------
    df : pd.DataFrame
    diverted_col : str

    Returns
    -------
    pd.DataFrame
    """
    n_before = len(df)
    df_clean = df[df[diverted_col] != 1].copy()
    n_removed = n_before - len(df_clean)
    print(f"[preprocessing] Removed {n_removed:,} diverted flights ({n_removed/n_before:.2%})")
    return df_clean


def impute_delay_causes(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fill NaN in delay cause columns with 0.
    Delay cause columns are NaN when a flight is not delayed.

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
    """
    delay_cause_cols = [
        "nas_delay", "security_delay", "carrier_delay",
        "late_aircraft_delay", "weather_delay"
    ]
    existing_cols = [c for c in delay_cause_cols if c in df.columns]
    df[existing_cols] = df[existing_cols].fillna(0)
    print(f"[preprocessing] Imputed NaN → 0 for {len(existing_cols)} delay cause columns")
    return df


def create_fl_date(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create a proper datetime column from year, month, day.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain 'year', 'month', 'day' columns.

    Returns
    -------
    pd.DataFrame
        With new 'fl_date' column (datetime64).
    """
    df["fl_date"] = pd.to_datetime(
        df[["year", "month", "day"]].rename(columns={"year": "year", "month": "month", "day": "day"})
    )
    return df


def extract_hour_from_hhmm(df: pd.DataFrame, col: str) -> pd.Series:
    """
    Extract hour from HHMM integer format (e.g., 1430 → 14).

    Parameters
    ----------
    df : pd.DataFrame
    col : str
        Column name with HHMM format times.

    Returns
    -------
    pd.Series
        Hour values (0–23).
    """
    return (df[col] // 100).astype(int)


# ---------------------------------------------------------------------------
# Target Variable Creation
# ---------------------------------------------------------------------------

def create_targets(df: pd.DataFrame, delay_col: str = "arr_delay", threshold: int = 15) -> pd.DataFrame:
    """
    Create the dual target variables for classification and regression.

    Parameters
    ----------
    df : pd.DataFrame
    delay_col : str
        Column containing arrival delay in minutes.
    threshold : int
        Delay threshold in minutes for binary classification (default: 15).

    Returns
    -------
    pd.DataFrame
        With new columns 'is_delayed' and 'delay_minutes'.
    """
    df["is_delayed"] = (df[delay_col] > threshold).astype(int)
    df["delay_minutes"] = df[delay_col].clip(lower=0)
    print(f"[preprocessing] Created targets: is_delayed (threshold={threshold}min), delay_minutes (clipped at 0)")
    print(f"  → Class balance: {df['is_delayed'].mean():.2%} delayed")
    return df
