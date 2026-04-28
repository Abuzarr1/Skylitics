from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List

from app.db.session import get_db
from app.integrations.meteostat import fetch_airport_weather, refresh_airport_weather

router = APIRouter()


def _fmt(row: dict) -> dict:
    return {
        "iata":             row["iata"],
        "airport_name":     row["name"],
        "city":             row["city"],
        "observed_at":      row["observed_at"].isoformat() if row["observed_at"] else None,
        "conditions":       row["conditions"],
        "severity":         round(float(row["severity"] or 0), 2),
        "temperature_c":    round(float(row["temperature_c"] or 0), 1),
        "wind_speed_kmh":   round(float(row["wind_speed"] or 0) * 3.6, 1),
        "visibility_m":     int(row["visibility_m"] or 0),
        "precipitation_mm": round(float(row["precipitation_mm"] or 0), 2),
        "wind_dir":         int(row["wind_dir"] or 0),
    }


# ── Current conditions for one airport ───────────────────────────────────────

@router.get("/current/{iata}")
async def get_current_weather(iata: str, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Latest weather for a single airport.
    Tries Meteostat for fresh real-world data first; falls back to DB snapshot.
    """
    # Get airport coords for Meteostat lookup
    ap_row = await db.execute(
        text("SELECT latitude, longitude, name, city FROM airports WHERE iata = :iata"),
        {"iata": iata.upper()},
    )
    ap = ap_row.mappings().first()

    if ap:
        live = fetch_airport_weather(iata.upper(), float(ap["latitude"]), float(ap["longitude"]))
        if live:
            # Persist to DB in background so future DB queries stay fresh
            await refresh_airport_weather(db, iata.upper(), float(ap["latitude"]), float(ap["longitude"]))
            return {
                "iata":             iata.upper(),
                "airport_name":     ap["name"],
                "city":             ap["city"],
                "observed_at":      live["observed_at"].isoformat(),
                "conditions":       live["conditions"],
                "severity":         live["severity"],
                "temperature_c":    live["temperature_c"],
                "wind_speed_kmh":   round(live["wind_speed"] * 3.6, 1),
                "visibility_m":     live["visibility_m"],
                "precipitation_mm": live["precipitation_mm"],
                "wind_dir":         live["wind_dir"],
                "source":           "meteostat",
            }

    # Fallback: return latest DB snapshot
    result = await db.execute(text("""
        SELECT
            ap.iata, ap.name, ap.city,
            ws.observed_at, ws.conditions, ws.severity,
            ws.temperature_c, ws.wind_speed, ws.wind_dir,
            ws.visibility_m, ws.precipitation_mm
        FROM weather_snapshots ws
        JOIN airports ap ON ap.id = ws.airport_id
        WHERE ap.iata = :iata
        ORDER BY ws.observed_at DESC
        LIMIT 1
    """), {"iata": iata.upper()})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail=f"No weather data for {iata.upper()}")
    return {**_fmt(dict(row)), "source": "db"}


# ── Severity score only (used internally by predictions engine) ───────────────

@router.get("/severity/{iata}")
async def get_severity(iata: str, db: AsyncSession = Depends(get_db)) -> Any:
    """Returns severity score 0.0–1.0 for the given airport."""
    result = await db.execute(text("""
        SELECT ws.severity
        FROM weather_snapshots ws
        JOIN airports ap ON ap.id = ws.airport_id
        WHERE ap.iata = :iata
        ORDER BY ws.observed_at DESC
        LIMIT 1
    """), {"iata": iata.upper()})
    row = result.mappings().first()
    if not row:
        return {"iata": iata.upper(), "severity": 0.0}
    return {"iata": iata.upper(), "severity": round(float(row["severity"] or 0), 2)}


# ── All airports — current conditions (for ops heatmap) ──────────────────────

@router.get("/current")
async def get_all_current(severity_min: float = 0.0, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Latest snapshot for every airport.
    Optionally filter by severity_min (e.g. ?severity_min=0.4 returns only
    airports with moderate or worse conditions).
    """
    result = await db.execute(text("""
        SELECT DISTINCT ON (ap.id)
            ap.iata, ap.name, ap.city, ap.latitude, ap.longitude,
            ws.observed_at, ws.conditions, ws.severity,
            ws.temperature_c, ws.wind_speed, ws.wind_dir,
            ws.visibility_m, ws.precipitation_mm
        FROM weather_snapshots ws
        JOIN airports ap ON ap.id = ws.airport_id
        WHERE ws.severity >= :severity_min
        ORDER BY ap.id, ws.observed_at DESC
    """), {"severity_min": severity_min})
    rows = result.mappings().all()
    return [
        {**_fmt(dict(r)), "latitude": float(r["latitude"]), "longitude": float(r["longitude"])}
        for r in rows
    ]


# ── 48-hour trend for one airport ─────────────────────────────────────────────

@router.get("/history/{iata}")
async def get_history(iata: str, hours: int = 48, db: AsyncSession = Depends(get_db)) -> Any:
    """Hourly weather history for a single airport (default: last 48 h)."""
    result = await db.execute(text("""
        SELECT
            ws.observed_at, ws.conditions, ws.severity,
            ws.temperature_c, ws.wind_speed, ws.precipitation_mm
        FROM weather_snapshots ws
        JOIN airports ap ON ap.id = ws.airport_id
        WHERE ap.iata = :iata
        ORDER BY ws.observed_at DESC
        LIMIT :hours
    """), {"iata": iata.upper(), "hours": hours})
    rows = result.mappings().all()
    return [
        {
            "observed_at":      r["observed_at"].isoformat(),
            "conditions":       r["conditions"],
            "severity":         round(float(r["severity"] or 0), 2),
            "temperature_c":    round(float(r["temperature_c"] or 0), 1),
            "wind_speed_kmh":   round(float(r["wind_speed"] or 0) * 3.6, 1),
            "precipitation_mm": round(float(r["precipitation_mm"] or 0), 2),
        }
        for r in rows
    ]


# ── Network-wide severity summary (for dashboard) ────────────────────────────

@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)) -> Any:
    """Aggregated network weather summary across all airports."""
    result = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE latest.severity >= 0.7)  AS severe_count,
            COUNT(*) FILTER (WHERE latest.severity >= 0.4
                              AND  latest.severity <  0.7)  AS moderate_count,
            COUNT(*) FILTER (WHERE latest.severity <  0.4)  AS clear_count,
            ROUND(AVG(latest.severity)::numeric, 3)          AS avg_severity
        FROM (
            SELECT DISTINCT ON (ap.id) ws.severity
            FROM weather_snapshots ws
            JOIN airports ap ON ap.id = ws.airport_id
            ORDER BY ap.id, ws.observed_at DESC
        ) latest
    """))
    row = result.mappings().first()
    return {
        "severe_airports":   int(row["severe_count"]   or 0),
        "moderate_airports": int(row["moderate_count"] or 0),
        "clear_airports":    int(row["clear_count"]    or 0),
        "avg_severity":      float(row["avg_severity"] or 0),
        "total_airports":    int((row["severe_count"] or 0) + (row["moderate_count"] or 0) + (row["clear_count"] or 0)),
    }
