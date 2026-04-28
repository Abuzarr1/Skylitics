"""
Input cleaning and normalization before feature engineering.
"""
from datetime import datetime


def clean_input(
    airline: str,
    origin: str,
    dest: str,
    date: str,
    time: str,
    distance: int,
) -> dict:
    """
    Normalize raw API inputs to a clean dict ready for feature engineering.
    Raises ValueError on bad date/time formats.
    """
    dt = datetime.strptime(date.strip(), "%Y-%m-%d")
    hour = int(time.strip().split(":")[0])

    return {
        "airline":     airline.strip().upper().split()[0],   # "Delta Air Lines" → "DL" style, or passthrough
        "origin":      origin.strip().upper(),
        "dest":        dest.strip().upper(),
        "month":       dt.month,
        "day_of_week": dt.weekday() + 1,                     # 1=Mon … 7=Sun
        "hour":        hour,
        "distance":    max(0, int(distance)),
    }
