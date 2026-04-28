from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, Dict, List, Optional
from app.db.session import get_db
from app.modules.auth.router import RoleChecker
from app.modules.users.models import UserRole

router = APIRouter()
manager_only = RoleChecker([UserRole.MANAGER, UserRole.ADMIN])


@router.get("/dashboard")
async def get_dashboard(
    airport_code: Optional[str] = Query(None, description="Filter by airport IATA code"),
    db: AsyncSession = Depends(get_db),
    _: Any = Depends(manager_only),
) -> Dict[str, Any]:
    """
    Real KPI dashboard — queries flights + predictions tables.
    Pass airport_code to scope to a specific airport; omit for all airports.
    """
    airport_filter = "AND ao.iata = :airport" if airport_code else ""
    params: dict = {"airport": airport_code} if airport_code else {}

    result = await db.execute(text(f"""
        SELECT
            COUNT(*)                                                        AS total_tracked,
            COUNT(*) FILTER (WHERE f.status = 'DELAYED')                   AS delayed_count,
            COUNT(*) FILTER (WHERE p.delay_probability > 0.5)              AS at_risk_count,
            ROUND(AVG(p.predicted_delay_min)::numeric, 1)                  AS avg_delay_min,
            ROUND(
                100.0 * COUNT(*) FILTER (WHERE p.delay_probability <= 0.5)
                / NULLIF(COUNT(*), 0)
            , 1)                                                            AS on_time_pct,
            (SELECT ROUND((metrics->>'accuracy')::numeric * 100, 1)
             FROM ml_models WHERE status = 'PRODUCTION' LIMIT 1)           AS model_accuracy_pct
        FROM flights f
        JOIN predictions p ON p.flight_id = f.id
        JOIN airports ao   ON ao.id = f.origin_id
        WHERE 1=1 {airport_filter}
    """), params)
    row = result.mappings().one()

    return {
        "total_tracked":      int(row["total_tracked"] or 0),
        "delayed_count":      int(row["delayed_count"] or 0),
        "at_risk_count":      int(row["at_risk_count"] or 0),
        "avg_delay_min":      float(row["avg_delay_min"] or 0),
        "on_time_pct":        float(row["on_time_pct"] or 0),
        "model_accuracy_pct": float(row["model_accuracy_pct"] or 0),
        "airport":            airport_code,
    }


@router.get("/at-risk")
async def get_at_risk(
    limit: int = 5,
    airport_code: Optional[str] = Query(None, description="Filter by airport IATA code"),
    db: AsyncSession = Depends(get_db),
    _: Any = Depends(manager_only),
) -> List[Dict[str, Any]]:
    """
    Top N flights with highest delay probability.
    Pass airport_code to scope to a specific airport; omit for all airports.
    """
    airport_filter = "AND ao.iata = :airport" if airport_code else ""
    params: dict = {"limit": limit, **({"airport": airport_code} if airport_code else {})}

    result = await db.execute(text(f"""
        SELECT
            f.id::text                                       AS flight_id,
            f.flight_number                                  AS callsign,
            ao.iata || ' → ' || ad.iata                     AS route,
            p.delay_probability                              AS risk,
            f.status                                         AS status,
            p.predicted_delay_min                            AS predicted_delay
        FROM predictions p
        JOIN flights  f  ON f.id  = p.flight_id
        JOIN airlines al ON al.id = f.airline_id
        JOIN airports ao ON ao.id = f.origin_id
        JOIN airports ad ON ad.id = f.dest_id
        WHERE 1=1 {airport_filter}
        ORDER BY p.delay_probability DESC
        LIMIT :limit
    """), params)

    rows = result.mappings().all()
    return [
        {
            "flight_id":       r["flight_id"],
            "callsign":        r["callsign"],
            "route":           r["route"],
            "risk":            round(float(r["risk"]), 4),
            "status":          r["status"].lower(),
            "predicted_delay": int(r["predicted_delay"]),
        }
        for r in rows
    ]


@router.get("/analytics/routes")
async def get_route_analytics(
    airport_code: Optional[str] = Query(None, description="Filter by origin airport IATA code"),
    db: AsyncSession = Depends(get_db),
    _: Any = Depends(manager_only),
) -> List[Dict[str, Any]]:
    """
    Top routes by average delay probability.
    """
    airport_filter = "AND ao.iata = :airport" if airport_code else ""
    params: dict = {"airport": airport_code} if airport_code else {}

    result = await db.execute(text(f"""
        SELECT
            ao.iata || ' → ' || ad.iata                     AS route,
            ROUND(AVG(p.predicted_delay_min)::numeric, 1)   AS avg_delay,
            ROUND(AVG(p.delay_probability)::numeric, 4)      AS risk_score,
            COUNT(*)                                         AS flights_total
        FROM predictions p
        JOIN flights  f  ON f.id  = p.flight_id
        JOIN airports ao ON ao.id = f.origin_id
        JOIN airports ad ON ad.id = f.dest_id
        WHERE 1=1 {airport_filter}
        GROUP BY ao.iata, ad.iata
        ORDER BY risk_score DESC
        LIMIT 10
    """), params)
    rows = result.mappings().all()
    return [
        {
            "route":         r["route"],
            "avg_delay":     float(r["avg_delay"]),
            "risk_score":    float(r["risk_score"]),
            "flights_total": int(r["flights_total"]),
        }
        for r in rows
    ]


@router.get("/analytics/airports")
async def get_airport_analytics(
    airport_code: Optional[str] = Query(None, description="Filter to a specific airport"),
    db: AsyncSession = Depends(get_db),
    _: Any = Depends(manager_only),
) -> List[Dict[str, Any]]:
    """
    Airport-level congestion based on average outbound delay probability.
    """
    airport_filter = "AND ao.iata = :airport" if airport_code else ""
    params: dict = {"airport": airport_code} if airport_code else {}

    result = await db.execute(text(f"""
        SELECT
            ao.iata                                         AS airport,
            ROUND(AVG(p.delay_probability)::numeric, 4)    AS congestion_score,
            COUNT(*)                                        AS flights_out
        FROM predictions p
        JOIN flights  f  ON f.id  = p.flight_id
        JOIN airports ao ON ao.id = f.origin_id
        WHERE 1=1 {airport_filter}
        GROUP BY ao.iata
        ORDER BY congestion_score DESC
        LIMIT 10
    """), params)
    rows = result.mappings().all()
    return [
        {
            "airport":          r["airport"],
            "congestion_score": float(r["congestion_score"]),
            "flights_out":      int(r["flights_out"]),
        }
        for r in rows
    ]
