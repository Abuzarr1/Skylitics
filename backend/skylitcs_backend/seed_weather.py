"""
Seed realistic weather snapshots for all airports in the DB.
Generates:
  - 48 hourly snapshots per airport (past 48 hours)
  - Seasonal/geographic variation based on latitude, month, time of day
  - ~15,000 total rows

Run from backend root:
  python seed_weather.py
"""

import psycopg2
import psycopg2.extras
import uuid
import random
import math
from datetime import datetime, timezone, timedelta

psycopg2.extras.register_uuid()

DB = dict(
    host="localhost", port=5432,
    dbname="skylytics", user="postgres", password="postgres"
)

# Condition → severity (0.0–1.0)
CONDITION_SEVERITY = {
    "CLEAR":          0.00,
    "PARTLY_CLOUDY":  0.05,
    "CLOUDY":         0.15,
    "FOG":            0.40,
    "DRIZZLE":        0.30,
    "RAIN":           0.50,
    "HEAVY_RAIN":     0.70,
    "SNOW":           0.65,
    "HEAVY_SNOW":     0.85,
    "BLIZZARD":       0.95,
    "THUNDERSTORM":   0.88,
    "ICE":            0.92,
}


def pick_condition(lat: float, month: int, hour: int, rng: random.Random) -> str:
    """
    Return a weather condition weighted by:
    - latitude  (northern = colder → more snow in winter)
    - month     (1-3 & 11-12 = winter, 6-8 = summer)
    - hour      (night fog more likely)
    """
    is_winter  = month in (12, 1, 2, 3)
    is_summer  = month in (6, 7, 8)
    is_night   = hour in range(0, 7)
    cold       = lat > 45          # Alaska, northern tier
    very_cold  = lat > 57          # Anchorage, Kodiak

    weights = {
        "CLEAR":         35,
        "PARTLY_CLOUDY": 20,
        "CLOUDY":        15,
        "FOG":            5 + (10 if is_night else 0),
        "DRIZZLE":        5,
        "RAIN":           8,
        "HEAVY_RAIN":     3,
        "SNOW":           0,
        "HEAVY_SNOW":     0,
        "BLIZZARD":       0,
        "THUNDERSTORM":   3 + (5 if is_summer else 0),
        "ICE":            0,
    }

    if is_winter and cold:
        weights["SNOW"]       += 20
        weights["HEAVY_SNOW"] += 8
        weights["ICE"]        += 5
        weights["CLEAR"]      -= 15
    if is_winter and very_cold:
        weights["BLIZZARD"]   += 5
        weights["HEAVY_SNOW"] += 10
    if is_summer and lat < 35:     # Deep south → thunderstorms
        weights["THUNDERSTORM"] += 8
        weights["HEAVY_RAIN"]   += 4
    if is_winter and not cold:     # Southern winter rain
        weights["RAIN"]        += 5
        weights["DRIZZLE"]     += 5

    # Clamp negatives
    for k in weights:
        weights[k] = max(0, weights[k])

    conditions = list(weights.keys())
    probs      = list(weights.values())
    return rng.choices(conditions, weights=probs, k=1)[0]


def base_temp_c(lat: float, month: int, hour: int) -> float:
    """Approximate temperature in °C from latitude, month and hour."""
    # Annual cycle: coldest Jan (month=1), warmest Jul (month=7)
    seasonal = -math.cos((month - 1) / 12 * 2 * math.pi) * 20
    # Latitude: equator ≈ 30 °C, 60 °N ≈ -5 °C baseline
    lat_base  = 30 - (lat - 25) * 0.7
    # Diurnal: +5 at 14:00, -5 at 04:00
    diurnal   = 5 * math.sin((hour - 8) / 24 * 2 * math.pi)
    return round(lat_base + seasonal + diurnal + random.gauss(0, 2), 1)


def derive_fields(condition: str, lat: float, month: int, hour: int,
                  rng: random.Random) -> dict:
    temp_c         = base_temp_c(lat, month, hour)
    wind_speed     = round(rng.uniform(2, 15) + (10 if condition in ("THUNDERSTORM","BLIZZARD","HEAVY_SNOW") else 0), 1)
    visibility_m   = {
        "CLEAR":        10000,
        "PARTLY_CLOUDY": 9000,
        "CLOUDY":        7000,
        "FOG":           rng.randint(100, 800),
        "DRIZZLE":       5000,
        "RAIN":          4000,
        "HEAVY_RAIN":    1500,
        "SNOW":          3000,
        "HEAVY_SNOW":    800,
        "BLIZZARD":      200,
        "THUNDERSTORM":  2000,
        "ICE":           4000,
    }.get(condition, 8000) + rng.randint(-200, 200)

    precip = {
        "DRIZZLE":    round(rng.uniform(0.1, 1.0), 2),
        "RAIN":       round(rng.uniform(1.0, 5.0), 2),
        "HEAVY_RAIN": round(rng.uniform(5.0, 20.0), 2),
        "SNOW":       round(rng.uniform(0.5, 3.0), 2),
        "HEAVY_SNOW": round(rng.uniform(3.0, 15.0), 2),
        "BLIZZARD":   round(rng.uniform(10.0, 30.0), 2),
        "THUNDERSTORM": round(rng.uniform(5.0, 25.0), 2),
    }.get(condition, 0.0)

    return {
        "temperature_c":   temp_c,
        "wind_speed":      wind_speed,
        "wind_dir":        rng.randint(0, 359),
        "visibility_m":    max(50, visibility_m),
        "precipitation_mm": precip,
        "severity":        CONDITION_SEVERITY[condition],
    }


def main():
    conn = psycopg2.connect(**DB)
    cur  = conn.cursor()

    # Fetch all airports
    cur.execute("SELECT id, iata, latitude FROM airports ORDER BY iata")
    airports = cur.fetchall()
    print(f"Seeding weather for {len(airports)} airports × 48 hours …")

    now   = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    rows  = []
    rng   = random.Random(42)

    for airport_id, iata, lat in airports:
        for h in range(48, 0, -1):
            ts        = now - timedelta(hours=h)
            month     = ts.month
            hour      = ts.hour
            condition = pick_condition(lat, month, hour, rng)
            fields    = derive_fields(condition, lat, month, hour, rng)

            rows.append((
                uuid.uuid4(),
                airport_id,
                ts,
                fields["temperature_c"],
                fields["wind_speed"],
                fields["wind_dir"],
                fields["visibility_m"],
                fields["precipitation_mm"],
                condition,
                fields["severity"],
                "synthetic",
            ))

    # Bulk insert
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO weather_snapshots
            (id, airport_id, observed_at, temperature_c, wind_speed, wind_dir,
             visibility_m, precipitation_mm, conditions, severity, source)
        VALUES %s
        ON CONFLICT DO NOTHING
        """,
        rows,
        page_size=2000,
    )
    conn.commit()
    print(f"Inserted {len(rows):,} weather snapshots.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
