"""
What-If Simulator — Backend Routes
===================================
GET  /api/v1/whatif/active-airlines          → airlines operating out of manager's airport today
GET  /api/v1/whatif/active-flights?airline=  → flights for a specific airline from that airport
POST /api/v1/whatif/simulate                 → run ML inference + SHAP-style breakdown

Airport context: in production this would come from a manager→airport mapping table.
For this MVP the frontend passes `airport_code` as a query param (defaults to "ATL").
Auth: JWT required on all routes.
"""
from __future__ import annotations

import hashlib
import math
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.ml.inference.predictor import run_inference
from app.modules.auth.router import get_current_user
from app.modules.users.models import User

router = APIRouter()

# ─── Helpers ──────────────────────────────────────────────────────────────────

# Deterministic passenger load from flight hash
def _load_pct(flight_number: str, airline: str) -> int:
    h = int(hashlib.md5(f"{flight_number}{airline}".encode()).hexdigest(), 16)
    return 70 + (h % 31)  # 70–100

# Deterministic gate from flight hash
def _gate(flight_number: str, terminal: str | None = None) -> str:
    h = int(hashlib.md5(flight_number.encode()).hexdigest(), 16)
    term = terminal or chr(65 + (h % 5))      # A–E
    num  = 1 + (h % 30)
    return f"{term}{num}"

# Map DB FlightStatus → display status
_STATUS_MAP = {
    "BOARDING":  "BOARDING",
    "DELAYED":   "DELAYED",
    "SCHEDULED": "ON TIME",
    "PUSHBACK":  "TAXIING",
    "EN_ROUTE":  "DEPARTED",
    "LANDED":    "LANDED",
    "CANCELLED": "CANCELLED",
}

# Active status values to filter on
_ACTIVE_STATUSES = ("BOARDING", "DELAYED", "SCHEDULED", "PUSHBACK")

# Known airlines operating from common US hub airports
_DEMO_AIRLINES: dict[str, list[str]] = {
    "ATL": ["DL", "WN", "UA", "AA", "NK"],
    "JFK": ["AA", "DL", "B6", "UA", "EK"],
    "LAX": ["UA", "AA", "DL", "WN", "AS"],
    "ORD": ["UA", "AA", "WN", "DL", "F9"],
    "DFW": ["AA", "WN", "UA", "DL", "NK"],
    "LHR": ["BA", "VS", "AA", "UA", "EK"],
    "CDG": ["AF", "BA", "LH", "DL", "EK"],
}

_DEMO_DESTINATIONS: dict[str, list[tuple[str, str, int]]] = {
    # (destination, aircraft_type, distance_miles)
    "DL": [("JFK", "Boeing 737", 865), ("LAX", "Boeing 757", 2475), ("LHR", "Boeing 767", 4662), ("BOS", "Boeing 737", 1103), ("SFO", "Boeing 737", 2139)],
    "AA": [("ORD", "Boeing 737", 716), ("LAX", "Airbus A321", 2475), ("MIA", "Boeing 737", 662), ("DFW", "Airbus A321", 732), ("PHX", "Boeing 737", 1587)],
    "UA": [("EWR", "Boeing 737", 746), ("LAX", "Boeing 757", 2126), ("ORD", "Boeing 737", 716), ("IAH", "Airbus A320", 710), ("DEN", "Boeing 737", 1199)],
    "WN": [("HOU", "Boeing 737", 696), ("DAL", "Boeing 737", 731), ("MDW", "Boeing 737", 716), ("BWI", "Boeing 737", 946), ("LAS", "Boeing 737", 1747)],
    "NK": [("FLL", "Airbus A320", 665), ("MCO", "Airbus A320", 404), ("LAS", "Airbus A320", 1747), ("DFW", "Airbus A320", 732), ("DEN", "Airbus A320", 1199)],
    "B6": [("BOS", "Airbus A320", 187), ("LAX", "Airbus A321", 2475), ("MCO", "Airbus A320", 1144), ("SFO", "Airbus A321", 2586), ("DCA", "Airbus A320", 213)],
    "AS": [("SEA", "Boeing 737", 2408), ("LAX", "Boeing 737", 954), ("SFO", "Boeing 737", 874), ("DEN", "Boeing 737", 1199), ("ANC", "Boeing 737", 3288)],
    "BA": [("LHR", "Boeing 777", 4662), ("JFK", "Boeing 747", 3459), ("LAX", "Boeing 777", 5456), ("ORD", "Boeing 777", 3944), ("DFW", "Boeing 777", 4751)],
    "LH": [("FRA", "Airbus A380", 4980), ("JFK", "Airbus A380", 3859), ("ORD", "Airbus A330", 4344), ("LAX", "Airbus A380", 5782), ("MIA", "Airbus A330", 5128)],
    "AF": [("CDG", "Airbus A380", 4980), ("JFK", "Airbus A380", 3627), ("LAX", "Airbus A380", 5670), ("ORD", "Airbus A330", 4154), ("MIA", "Airbus A340", 5031)],
    "EK": [("DXB", "Airbus A380", 7489), ("JFK", "Airbus A380", 6847), ("LAX", "Airbus A380", 8756), ("ORD", "Airbus A380", 7236), ("LHR", "Airbus A380", 3420)],
    "KL": [("AMS", "Boeing 777", 5364), ("JFK", "Boeing 777", 3634), ("LAX", "Boeing 777", 5577), ("SFO", "Boeing 777", 5636), ("ORD", "Boeing 777", 4133)],
    "F9": [("DEN", "Airbus A320", 1199), ("MCO", "Airbus A320", 1100), ("LAS", "Airbus A320", 1747), ("LAX", "Airbus A320", 1587), ("PHX", "Airbus A320", 1011)],
}

_STATUSES_DEMO = ["BOARDING", "BOARDING", "BOARDING", "ON TIME", "ON TIME", "DELAYED", "TAXIING"]


def _demo_flights(airport: str, airline: str) -> list[dict]:
    """Generate deterministic demo flights when DB returns nothing for today."""
    routes = _DEMO_DESTINATIONS.get(airline, [("JFK", "Boeing 737", 865), ("LAX", "Boeing 737", 2475)])
    today_str = date.today().isoformat()
    flights = []
    for idx, (dest, aircraft, distance) in enumerate(routes[:6]):
        fn = f"{airline}{100 + idx * 37 + len(airport)}"
        h  = int(hashlib.md5(fn.encode()).hexdigest(), 16)
        dep_hour = 6 + (h % 14)      # 06–19
        dep_min  = (h >> 4) % 4 * 15 # 0, 15, 30, 45
        status   = _STATUSES_DEMO[h % len(_STATUSES_DEMO)]
        flights.append({
            "flight_number":   fn,
            "airline":         airline,
            "origin":          airport,
            "destination":     dest,
            "departure_time":  f"{dep_hour:02d}:{dep_min:02d}",
            "distance_miles":  distance,
            "aircraft_type":   aircraft,
            "status":          status,
            "passenger_load_pct": _load_pct(fn, airline),
            "gate":            _gate(fn),
        })
    return flights


# ─── SHAP-style Breakdown ─────────────────────────────────────────────────────

def _compute_breakdown(ov: dict) -> dict:
    """
    Compute the percentage contribution of each delay cause from overrides.
    Scores are normalised to 100.
    """
    WEATHER_TYPE_BONUS = {"Clear": 0, "Rain": 5, "Snow": 12, "Thunderstorm": 15, "Fog": 8, "Ice": 10}

    weather_sev   = float(ov.get("weather_severity", 0))          # 0–1
    weather_type  = str(ov.get("weather_type", "Clear")).capitalize()
    visibility    = float(ov.get("visibility_miles", 10))          # 0–10
    incoming      = float(ov.get("incoming_flight_delay_min", 0))  # 0–180
    gate_closed   = str(ov.get("gate_status", "OPEN")).upper() == "CLOSED"
    crew_short    = str(ov.get("crew_availability", "AVAILABLE")).upper() == "SHORT"
    load_pct      = float(ov.get("passenger_load_pct", 85))        # 50–100
    origin_trf    = str(ov.get("origin_traffic", "LOW")).upper()
    dest_trf      = str(ov.get("dest_traffic", "LOW")).upper()

    weather_raw  = weather_sev * 35 + WEATHER_TYPE_BONUS.get(weather_type, 0) + (10 - visibility) * 1.0
    inbound_raw  = (incoming / 180) * 35
    gate_raw     = 20 if gate_closed else 0
    crew_raw     = 18 if crew_short else 0
    traffic_raw  = ({"LOW": 0, "MEDIUM": 8, "HIGH": 15}.get(origin_trf, 0) +
                    {"LOW": 0, "MEDIUM": 5, "HIGH": 10}.get(dest_trf, 0) +
                    (load_pct - 85) * 0.3 if load_pct > 85 else 0)

    total = weather_raw + inbound_raw + gate_raw + crew_raw + traffic_raw or 1.0
    return {
        "weather":      max(0, round(weather_raw  / total * 100)),
        "inbound_delay":max(0, round(inbound_raw  / total * 100)),
        "gate":         max(0, round(gate_raw     / total * 100)),
        "crew":         max(0, round(crew_raw     / total * 100)),
        "traffic":      max(0, round(traffic_raw  / total * 100)),
    }


def _recommendation(delay_min: int, breakdown: dict) -> str:
    if delay_min < 10:
        return "All parameters within nominal range. No intervention required."
    primary = max(breakdown, key=breakdown.get)
    recs = {
        "weather":       "Coordinate with ops for de-icing / weather hold. Notify passengers proactively.",
        "inbound_delay": "Track inbound aircraft ETA. Coordinate gate hold and notify connecting passengers.",
        "gate":          "Prioritise gate reassignment. Brief ground crew on expedited turnaround procedure.",
        "crew":          "Activate standby crew roster. Initiate minimum crew waiver protocol if eligible.",
        "traffic":       "Request priority sequencing from ATC. Evaluate alternate taxi routes to reduce ground time.",
    }
    return recs.get(primary, "Review operational parameters and consult supervisor.")


def _delay_category(minutes: int) -> str:
    if minutes < 15:  return "MINOR"
    if minutes < 45:  return "MODERATE"
    if minutes < 90:  return "SEVERE"
    return "CRITICAL"


def _cascade_risk(minutes: int) -> str:
    if minutes >= 45: return "HIGH"
    if minutes >= 15: return "MEDIUM"
    return "LOW"


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    flight_number:  str
    airline:        str
    origin:         str
    destination:    str
    date:           str
    departure_time: str
    distance_miles: int = 865
    aircraft_type:  Optional[str] = None
    overrides:      Dict[str, Any] = {}


class SimulateResponse(BaseModel):
    predicted_delay_minutes: int
    on_time_probability:     int
    delay_category:          str
    cascade_risk:            str
    shap_breakdown:          Dict[str, int]
    confidence_score:        int
    recommendation:          str
    engine:                  str


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/active-airlines")
async def get_active_airlines(
    airport_code: str = Query(default="ATL", description="Airport IATA code"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Return distinct airline IATA codes operating from this airport today.
    Falls back to a deterministic demo list if no flights are scheduled today.
    """
    today_obj = date.today()
    today_str = today_obj.isoformat()
    airport = airport_code.upper()

    result = await db.execute(text("""
        SELECT DISTINCT al.iata AS airline_code
        FROM flights f
        JOIN airlines al  ON al.id  = f.airline_id
        JOIN airports ao  ON ao.id  = f.origin_id
        WHERE ao.iata = :airport
          AND DATE(f.scheduled_dep AT TIME ZONE 'UTC') = :today
          AND f.status IN ('BOARDING','DELAYED','SCHEDULED','PUSHBACK')
        ORDER BY al.iata
    """), {"airport": airport, "today": today_obj})

    rows = result.mappings().all()
    airlines = [r["airline_code"] for r in rows]

    # Fallback: use known airlines for this airport hub
    if not airlines:
        airlines = _DEMO_AIRLINES.get(airport, ["DL", "AA", "UA", "WN"])

    return {"airport": airport, "airlines": airlines, "date": today_str}


@router.get("/active-flights")
async def get_active_flights(
    airline: str = Query(..., description="Airline IATA code, e.g. DL"),
    airport_code: str = Query(default="ATL", description="Airport IATA code"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Return today's active flights for an airline from the manager's airport.
    Falls back to deterministic demo data when no real flights exist for today.
    """
    today_obj = date.today()
    airport = airport_code.upper()
    al_code = airline.upper()

    result = await db.execute(text("""
        SELECT
            f.flight_number,
            al.iata             AS airline,
            ao.iata             AS origin,
            ad.iata             AS destination,
            f.scheduled_dep,
            f.status,
            f.gate,
            f.terminal,
            ac.model            AS aircraft_model
        FROM flights f
        JOIN airlines al  ON al.id  = f.airline_id
        JOIN airports ao  ON ao.id  = f.origin_id
        JOIN airports ad  ON ad.id  = f.dest_id
        LEFT JOIN aircraft ac ON ac.id = f.aircraft_id
        WHERE ao.iata   = :airport
          AND al.iata   = :airline
          AND DATE(f.scheduled_dep AT TIME ZONE 'UTC') = :today
          AND f.status IN ('BOARDING','DELAYED','SCHEDULED','PUSHBACK')
        ORDER BY f.scheduled_dep ASC
        LIMIT 50
    """), {"airport": airport, "airline": al_code, "today": today_obj})

    rows = result.mappings().all()

    if rows:
        flights = []
        for r in rows:
            dep_dt = r["scheduled_dep"]
            dep_time = dep_dt.strftime("%H:%M") if dep_dt else "—"
            flights.append({
                "flight_number":      r["flight_number"],
                "airline":            r["airline"],
                "origin":             r["origin"],
                "destination":        r["destination"],
                "departure_time":     dep_time,
                "distance_miles":     865,   # routes table has km, see note below
                "aircraft_type":      r["aircraft_model"] or "Boeing 737",
                "status":             _STATUS_MAP.get(r["status"], r["status"]),
                "passenger_load_pct": _load_pct(r["flight_number"], al_code),
                "gate":               r["gate"] or _gate(r["flight_number"], r["terminal"]),
            })
    else:
        # Today has no seeded flights — use deterministic demo data
        flights = _demo_flights(airport, al_code)

    return {"flights": flights}


@router.post("/simulate", response_model=SimulateResponse)
async def simulate_whatif(
    body: SimulateRequest,
    current_user: User = Depends(get_current_user),
) -> SimulateResponse:
    """
    Run ML inference on a flight + overrides, return structured delay prediction.
    """
    ov = body.overrides

    # Map incoming override keys to run_inference's expected keys
    inference_overrides = {
        "weather_severity": float(ov.get("weather_severity", 0)),
    }

    pred = run_inference(
        airline  = body.airline,
        origin   = body.origin,
        dest     = body.destination,
        date     = body.date,
        time     = body.departure_time,
        distance = body.distance_miles,
        overrides= inference_overrides,
    )

    delay_min = int(pred.get("delay_minutes", 0))
    prob      = float(pred.get("probability", 50))
    engine    = pred.get("engine", "mock")

    # Apply additional override penalties to delay_min (not in xgboost model)
    extra_delay = 0
    if str(ov.get("gate_status", "OPEN")).upper() == "CLOSED":
        extra_delay += 20
    incoming = float(ov.get("incoming_flight_delay_min", 0))
    extra_delay += int(incoming * 0.4)
    if str(ov.get("crew_availability", "AVAILABLE")).upper() == "SHORT":
        extra_delay += 15
    if str(ov.get("origin_traffic", "LOW")).upper() == "HIGH":
        extra_delay += 10
    elif str(ov.get("origin_traffic", "LOW")).upper() == "MEDIUM":
        extra_delay += 5

    delay_min = min(delay_min + extra_delay, 180)
    on_time_prob = max(0, min(100, int(100 - delay_min * 1.8)))

    breakdown      = _compute_breakdown(ov)
    category       = _delay_category(delay_min)
    cascade        = _cascade_risk(delay_min)
    recommendation = _recommendation(delay_min, breakdown)
    confidence     = 91 if engine == "xgboost" else 78

    return SimulateResponse(
        predicted_delay_minutes = delay_min,
        on_time_probability     = on_time_prob,
        delay_category          = category,
        cascade_risk            = cascade,
        shap_breakdown          = breakdown,
        confidence_score        = confidence,
        recommendation          = recommendation,
        engine                  = engine,
    )
