"""
Meteostat integration — fetch real weather conditions for airports.

fetch_airport_weather(iata, lat, lon, alt_m) -> dict | None
refresh_airport_weather(db, iata, lat, lon, alt_m)  -> upserts weather_snapshots row
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

log = logging.getLogger(__name__)

# Meteostat WMO condition code → human label + severity (0–1)
_COCO_MAP: dict[int, tuple[str, float]] = {
    1:  ("Clear",               0.00),
    2:  ("Fair",                0.05),
    3:  ("Cloudy",              0.10),
    4:  ("Overcast",            0.15),
    5:  ("Fog",                 0.40),
    6:  ("Freezing Fog",        0.55),
    7:  ("Light Rain",          0.30),
    8:  ("Rain",                0.45),
    9:  ("Heavy Rain",          0.60),
    10: ("Freezing Rain",       0.70),
    11: ("Heavy Freezing Rain", 0.80),
    12: ("Sleet",               0.55),
    13: ("Heavy Sleet",         0.70),
    14: ("Light Snow",          0.45),
    15: ("Snow",                0.60),
    16: ("Heavy Snow",          0.80),
    17: ("Rain and Snow",       0.65),
    18: ("Heavy Rain and Snow", 0.75),
    19: ("Light Sleet",         0.40),
    20: ("Sleet",               0.55),
    21: ("Heavy Sleet",         0.70),
    22: ("Lightning",           0.75),
    23: ("Hail",                0.80),
    24: ("Thunderstorm",        0.80),
    25: ("Heavy Thunderstorm",  0.90),
    26: ("Storm",               0.95),
    27: ("Heavy Storm",         1.00),
}


def _wind_severity(wspd_kmh: float) -> float:
    """Convert wind speed (km/h) to additional severity contribution."""
    if wspd_kmh >= 80:  return 0.30
    if wspd_kmh >= 50:  return 0.20
    if wspd_kmh >= 30:  return 0.10
    return 0.0


def fetch_airport_weather(
    iata: str,
    lat: float,
    lon: float,
    alt_m: float = 30,
) -> Optional[dict]:
    """
    Fetch the most recent hourly weather observation for an airport via Meteostat.

    Returns a dict matching the weather_snapshots schema, or None on failure.
    """
    try:
        from meteostat import Point, Hourly

        end   = datetime.utcnow()
        start = end - timedelta(hours=6)      # look back 6 h to guarantee a row
        loc   = Point(lat, lon, alt_m)

        df = Hourly(loc, start, end).fetch()
        if df.empty:
            log.warning("meteostat: no data for %s (%.4f, %.4f)", iata, lat, lon)
            return None

        row = df.iloc[-1]   # most recent observation

        wspd   = float(row.get("wspd") or 0)    # km/h
        coco   = int(row.get("coco") or 1)
        label, base_sev = _COCO_MAP.get(coco, ("Unknown", 0.10))
        severity = min(base_sev + _wind_severity(wspd), 1.0)

        # visibility: Meteostat doesn't give visibility directly.
        # Estimate from conditions: fog/heavy rain → low, clear → 10 000 m
        vis_map = {
            5: 200, 6: 100, 9: 2000, 10: 1500, 11: 500,
            16: 500, 17: 800, 24: 1000, 25: 500, 26: 300, 27: 200,
        }
        visibility_m = vis_map.get(coco, 9999)

        return {
            "iata":             iata.upper(),
            "conditions":       label,
            "severity":         round(severity, 3),
            "temperature_c":    round(float(row.get("temp") or 0), 1),
            "wind_speed":       round(wspd / 3.6, 2),   # store as m/s in DB
            "wind_dir":         int(row.get("wdir") or 0),
            "visibility_m":     visibility_m,
            "precipitation_mm": round(float(row.get("prcp") or 0), 2),
            "observed_at":      datetime.now(timezone.utc),
        }

    except Exception as exc:
        log.error("meteostat fetch failed for %s: %s", iata, exc)
        return None


async def refresh_airport_weather(db, iata: str, lat: float, lon: float, alt_m: float = 30) -> bool:
    """
    Fetch fresh Meteostat data and upsert into weather_snapshots.
    Returns True on success.
    """
    from sqlalchemy import text

    data = fetch_airport_weather(iata, lat, lon, alt_m)
    if not data:
        return False

    await db.execute(text("""
        INSERT INTO weather_snapshots
            (id, airport_id, observed_at, conditions, severity,
             temperature_c, wind_speed, wind_dir, visibility_m, precipitation_mm, source)
        SELECT
            gen_random_uuid(),
            ap.id,
            :observed_at,
            :conditions,
            :severity,
            :temperature_c,
            :wind_speed,
            :wind_dir,
            :visibility_m,
            :precipitation_mm,
            'meteostat'
        FROM airports ap
        WHERE ap.iata = :iata
    """), {
        "iata":             iata,
        "observed_at":      data["observed_at"],
        "conditions":       data["conditions"],
        "severity":         data["severity"],
        "temperature_c":    data["temperature_c"],
        "wind_speed":       data["wind_speed"],
        "wind_dir":         data["wind_dir"],
        "visibility_m":     data["visibility_m"],
        "precipitation_mm": data["precipitation_mm"],
    })
    await db.commit()
    return True
