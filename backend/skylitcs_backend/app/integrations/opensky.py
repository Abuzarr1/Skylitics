"""
OpenSky Network integration — fetch real live flight state vectors.

fetch_live_flights() -> list[dict]  (matches LiveFlight schema)

Falls back to empty list on rate-limit / network error so the router
can degrade gracefully to its deterministic fallback.
"""
from __future__ import annotations
import logging
import math
import hashlib
from datetime import datetime, timezone
from typing import Optional

import requests

log = logging.getLogger(__name__)

OPENSKY_URL = "https://opensky-network.org/api/states/all"

# Continental US bounding box
US_BOUNDS = dict(lamin=24.0, lomin=-125.0, lamax=49.5, lomax=-66.0)

# Known airport positions (IATA → lat, lon)
AIRPORT_COORDS: dict[str, tuple[float, float]] = {
    "ATL": (33.6367, -84.4281),  "LAX": (33.9425, -118.4081),
    "ORD": (41.9742, -87.9073),  "DFW": (32.8998, -97.0403),
    "DEN": (39.8561, -104.6737), "JFK": (40.6413, -73.7781),
    "SFO": (37.6213, -122.3790), "SEA": (47.4502, -122.3088),
    "LAS": (36.0840, -115.1537), "MCO": (28.4294, -81.3089),
    "MIA": (25.7959, -80.2870),  "PHX": (33.4373, -112.0078),
    "IAH": (29.9902, -95.3368),  "BOS": (42.3656, -71.0096),
    "MSP": (44.8848, -93.2223),  "DTW": (42.2162, -83.3554),
    "LGA": (40.7771, -73.8740),  "EWR": (40.6895, -74.1745),
    "CLT": (35.2140, -80.9431),  "SLC": (40.7884, -111.9778),
}

# IATA airline prefix → full name
AIRLINE_NAMES: dict[str, str] = {
    "AA": "American Airlines", "DL": "Delta Air Lines",
    "UA": "United Airlines",   "WN": "Southwest Airlines",
    "B6": "JetBlue",           "AS": "Alaska Airlines",
    "NK": "Spirit Airlines",   "F9": "Frontier Airlines",
    "G4": "Allegiant Air",     "SY": "Sun Country",
    "HA": "Hawaiian Airlines", "MQ": "Envoy Air",
    "OO": "SkyWest",           "YX": "Republic Airways",
    "9E": "Endeavor Air",
}

# State-vector column indices (OpenSky v3)
_IDX = {
    "icao24": 0, "callsign": 1, "origin_country": 2,
    "longitude": 5, "latitude": 6, "baro_altitude": 7,
    "on_ground": 8, "velocity": 9, "true_track": 10,
}


def _nearest_airport(lat: float, lon: float, exclude: Optional[str] = None) -> str:
    """Return IATA code of airport nearest to (lat, lon)."""
    best, best_d = "JFK", float("inf")
    for iata, (alat, alon) in AIRPORT_COORDS.items():
        if iata == exclude:
            continue
        d = math.hypot(lat - alat, lon - alon)
        if d < best_d:
            best, best_d = iata, d
    return best


def _opposite_airport(origin: str, heading: float) -> str:
    """Pick an airport roughly in the direction of travel from origin."""
    if not origin or origin not in AIRPORT_COORDS:
        return "LAX"
    o_lat, o_lon = AIRPORT_COORDS[origin]
    # project a point 10° along heading, pick nearest airport to that point
    rad = math.radians(heading)
    proj_lat = o_lat + 10 * math.cos(rad)
    proj_lon = o_lon + 10 * math.sin(rad)
    return _nearest_airport(proj_lat, proj_lon, exclude=origin)


def _delay_prob(callsign: str) -> float:
    h = int(hashlib.md5(callsign.encode()).hexdigest(), 16)
    return round((h % 80 + 10) / 100.0, 2)


def fetch_live_flights(limit: int = 20) -> list[dict]:
    """
    Pull live state vectors from OpenSky and map to LiveFlight schema.
    Returns up to `limit` airborne US flights with known US airline callsigns.
    """
    try:
        resp = requests.get(
            OPENSKY_URL,
            params=US_BOUNDS,
            timeout=8,
        )
        if resp.status_code == 429:
            log.warning("opensky: rate-limited (429)")
            return []
        if resp.status_code != 200:
            log.warning("opensky: HTTP %s", resp.status_code)
            return []

        states = resp.json().get("states") or []

    except Exception as exc:
        log.error("opensky fetch failed: %s", exc)
        return []

    results: list[dict] = []

    for sv in states:
        if len(results) >= limit:
            break
        try:
            # Skip ground traffic or missing position
            if sv[_IDX["on_ground"]]:
                continue
            lat = sv[_IDX["latitude"]]
            lon = sv[_IDX["longitude"]]
            if lat is None or lon is None:
                continue

            raw_cs  = (sv[_IDX["callsign"]] or "").strip()
            if len(raw_cs) < 3:
                continue

            # Extract IATA prefix (2-letter for most US airlines)
            prefix = raw_cs[:2].upper()
            if prefix not in AIRLINE_NAMES:
                prefix3 = raw_cs[:3].upper()
                if prefix3 not in AIRLINE_NAMES:
                    continue
                prefix = prefix3

            airline_name = AIRLINE_NAMES[prefix]
            callsign     = raw_cs.upper()
            altitude_ft  = int((sv[_IDX["baro_altitude"]] or 0) * 3.281)
            speed_kts    = int((sv[_IDX["velocity"]] or 0) * 1.944)
            heading      = float(sv[_IDX["true_track"]] or 0)

            origin = _nearest_airport(lat, lon)
            dest   = _opposite_airport(origin, heading)

            o_lat, o_lon = AIRPORT_COORDS[origin]
            d_lat, d_lon = AIRPORT_COORDS[dest]

            total_d = math.hypot(d_lat - o_lat, d_lon - o_lon) or 1
            curr_d  = math.hypot(lat - o_lat, lon - o_lon)
            progress = min(max(round(curr_d / total_d, 2), 0.0), 1.0)

            delay_prob = _delay_prob(callsign)
            status = (
                "delayed"  if delay_prob > 0.70 else
                "at_risk"  if delay_prob > 0.45 else
                "on_time"
            )

            results.append({
                "id":                f"OS-{callsign}",
                "callsign":          callsign,
                "airline":           airline_name,
                "origin":            origin,
                "destination":       dest,
                "origin_lat":        o_lat,
                "origin_lon":        o_lon,
                "dest_lat":          d_lat,
                "dest_lon":          d_lon,
                "current_lat":       round(lat, 4),
                "current_lon":       round(lon, 4),
                "altitude_ft":       altitude_ft,
                "speed_kts":         speed_kts,
                "delay_probability": delay_prob,
                "status":            status,
                "progress":          progress,
            })
        except Exception as exc:
            log.warning("opensky: skipping malformed state vector: %s", exc)
            continue

    return results
