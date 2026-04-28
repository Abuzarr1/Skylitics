"""
Skylytics — Feature Engineering Utilities
==========================================
Shared feature creation functions for cyclic encoding,
lag/rolling features, and contextual features.

Usage:
    from utils.feature_engineering import add_cyclic_features, add_lag_features, add_congestion_index
"""

import pandas as pd
import numpy as np
from typing import List, Optional


# ---------------------------------------------------------------------------
# Cyclic Encoding
# ---------------------------------------------------------------------------

def encode_cyclic(series: pd.Series, period: int) -> tuple:
    """
    Encode a periodic feature as sin/cos pair.

    Parameters
    ----------
    series : pd.Series
        Values to encode (e.g., hour 0–23, month 1–12).
    period : int
        The period of the cycle (e.g., 24 for hours, 12 for months).

    Returns
    -------
    tuple of (pd.Series, pd.Series)
        (sin_encoded, cos_encoded)
    """
    angle = 2 * np.pi * series / period
    return np.sin(angle), np.cos(angle)


def add_cyclic_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add all cyclic time features to the DataFrame.

    Expects columns: 'scheduled_departure' (HHMM int), 'day_of_week' (1–7), 'month' (1–12).

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
        With new columns: hour_sin, hour_cos, day_sin, day_cos, month_sin, month_cos
    """
    # Extract hour from HHMM format
    if "scheduled_departure" in df.columns:
        hour = (df["scheduled_departure"] // 100).clip(0, 23)
        df["hour_sin"], df["hour_cos"] = encode_cyclic(hour, 24)

    if "day_of_week" in df.columns:
        df["day_sin"], df["day_cos"] = encode_cyclic(df["day_of_week"], 7)

    if "month" in df.columns:
        df["month_sin"], df["month_cos"] = encode_cyclic(df["month"], 12)

    print(f"[feature_eng] Added cyclic features: hour_sin/cos, day_sin/cos, month_sin/cos")
    return df


# ---------------------------------------------------------------------------
# Lag / Rolling Features
# ---------------------------------------------------------------------------

def add_lag_features(
    df: pd.DataFrame,
    group_col: str = "origin",
    date_col: str = "fl_date",
    delay_col: str = "arr_delay",
    window_days: int = 7,
) -> pd.DataFrame:
    """
    Add rolling average delay features per airport.

    Parameters
    ----------
    df : pd.DataFrame
        Must be sorted by date.
    group_col : str
        Column to group by (e.g., 'origin').
    date_col : str
        Date column name.
    delay_col : str
        Delay column name.
    window_days : int
        Number of days for rolling window.

    Returns
    -------
    pd.DataFrame
        With new column 'avg_delay_last_{window_days}d_{group_col}'.
    """
    col_name = f"avg_delay_last_{window_days}d_{group_col}"

    # Compute daily average delay per group
    daily_avg = (
        df.groupby([group_col, date_col])[delay_col]
        .mean()
        .reset_index()
        .rename(columns={delay_col: "_daily_avg_delay"})
    )

    # Rolling mean (shift by 1 to avoid data leakage — use ONLY past data)
    daily_avg = daily_avg.sort_values(date_col)
    daily_avg[col_name] = (
        daily_avg.groupby(group_col)["_daily_avg_delay"]
        .transform(lambda x: x.shift(1).rolling(window=window_days, min_periods=1).mean())
    )

    # Merge back
    df = df.merge(
        daily_avg[[group_col, date_col, col_name]],
        on=[group_col, date_col],
        how="left",
    )
    df[col_name] = df[col_name].fillna(0)

    print(f"[feature_eng] Added lag feature: {col_name}")
    return df


def add_rolling_delay_3h(
    df: pd.DataFrame,
    origin_col: str = "origin",
    time_col: str = "scheduled_departure",
    date_col: str = "fl_date",
    delay_col: str = "arr_delay",
) -> pd.DataFrame:
    """
    Add rolling 3-hour average delay at origin airport.

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
        With new column 'rolling_delay_3h_origin_airport'.
    """
    # Extract hour
    df["_hour"] = (df[time_col] // 100).clip(0, 23)

    # Round to 3-hour bins
    df["_hour_bin"] = (df["_hour"] // 3) * 3

    # Average delay per (origin, date, 3h-bin)
    bin_avg = (
        df.groupby([origin_col, date_col, "_hour_bin"])[delay_col]
        .mean()
        .reset_index()
        .rename(columns={delay_col: "rolling_delay_3h_origin_airport"})
    )

    # Shift to prevent leakage (use previous bin's value)
    bin_avg = bin_avg.sort_values([origin_col, date_col, "_hour_bin"])
    bin_avg["rolling_delay_3h_origin_airport"] = (
        bin_avg.groupby(origin_col)["rolling_delay_3h_origin_airport"]
        .shift(1)
        .fillna(0)
    )

    df = df.merge(
        bin_avg[[origin_col, date_col, "_hour_bin", "rolling_delay_3h_origin_airport"]],
        on=[origin_col, date_col, "_hour_bin"],
        how="left",
    )
    df["rolling_delay_3h_origin_airport"] = df["rolling_delay_3h_origin_airport"].fillna(0)
    df = df.drop(columns=["_hour", "_hour_bin"], errors="ignore")

    print(f"[feature_eng] Added feature: rolling_delay_3h_origin_airport")
    return df


# ---------------------------------------------------------------------------
# Contextual Features
# ---------------------------------------------------------------------------

def add_congestion_index(
    df: pd.DataFrame,
    origin_col: str = "origin",
    date_col: str = "fl_date",
    time_col: str = "scheduled_departure",
    window_hours: int = 1,
) -> pd.DataFrame:
    """
    Add congestion index: count of departures at origin within ±window_hours.

    Parameters
    ----------
    df : pd.DataFrame
    window_hours : int
        Half-window size in hours (default: 1 → ±1 hour = 2-hour window).

    Returns
    -------
    pd.DataFrame
        With new column 'congestion_index'.
    """
    df["_hour"] = (df[time_col] // 100).clip(0, 23)

    # Count flights per (origin, date, hour)
    hourly_counts = (
        df.groupby([origin_col, date_col, "_hour"])
        .size()
        .reset_index(name="_hourly_count")
    )

    # Sum counts within ±window_hours for each hour
    def _rolling_sum(group):
        group = group.sort_values("_hour")
        group["congestion_index"] = (
            group.set_index("_hour")["_hourly_count"]
            .reindex(range(24), fill_value=0)
            .rolling(window=2 * window_hours + 1, center=True, min_periods=1)
            .sum()
            .reindex(group["_hour"])
            .values
        )
        return group

    hourly_counts = (
        hourly_counts
        .groupby([origin_col, date_col], group_keys=False)
        .apply(_rolling_sum)
    )

    df = df.merge(
        hourly_counts[[origin_col, date_col, "_hour", "congestion_index"]],
        on=[origin_col, date_col, "_hour"],
        how="left",
    )
    df["congestion_index"] = df["congestion_index"].fillna(0).astype(int)
    df = df.drop(columns=["_hour"], errors="ignore")

    print(f"[feature_eng] Added feature: congestion_index (±{window_hours}h window)")
    return df


def add_cascading_delay_flag(
    df: pd.DataFrame,
    late_aircraft_col: str = "late_aircraft_delay",
) -> pd.DataFrame:
    """
    Add binary flag for cascading delays (late aircraft from previous flight).

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
        With new column 'cascading_delay_flag'.
    """
    df["cascading_delay_flag"] = (df[late_aircraft_col] > 0).astype(int)
    print(f"[feature_eng] Added feature: cascading_delay_flag")
    return df


def add_hub_flag(
    df: pd.DataFrame,
    origin_col: str = "origin",
    hub_airports: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    Flag whether origin airport is a major hub.

    Parameters
    ----------
    df : pd.DataFrame
    hub_airports : list of str, optional
        IATA codes of hub airports. Defaults to top US hubs.

    Returns
    -------
    pd.DataFrame
        With new column 'is_hub'.
    """
    if hub_airports is None:
        hub_airports = [
            "ATL", "ORD", "DFW", "DEN", "LAX",
            "SFO", "SEA", "LAS", "MCO", "CLT",
            "PHX", "IAH", "MIA", "JFK", "EWR",
            "MSP", "DTW", "BOS", "FLL", "PHL",
        ]
    df["is_hub"] = df[origin_col].isin(hub_airports).astype(int)
    print(f"[feature_eng] Added feature: is_hub ({len(hub_airports)} hub airports)")
    return df


def add_route_frequency(
    df: pd.DataFrame,
    origin_col: str = "origin",
    dest_col: str = "dest",
    date_col: str = "fl_date",
) -> pd.DataFrame:
    """
    Add daily route frequency (flights on same origin→dest per day).

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
        With new column 'route_frequency'.
    """
    route_freq = (
        df.groupby([origin_col, dest_col, date_col])
        .size()
        .reset_index(name="route_frequency")
    )
    df = df.merge(route_freq, on=[origin_col, dest_col, date_col], how="left")
    df["route_frequency"] = df["route_frequency"].fillna(1).astype(int)

    print(f"[feature_eng] Added feature: route_frequency")
    return df
