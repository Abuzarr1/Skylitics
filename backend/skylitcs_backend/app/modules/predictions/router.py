from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List, Dict, Optional
from pydantic import UUID4
from app.modules.predictions.schemas import (
    Prediction, Explanation, BatchPredictionRequest, WhatIfRequest, WhatIfResponse,
    RealTimePredictRequest, RealTimePredictResponse,
    HeatmapNode, HeatmapResponse,
    FeedbackIn, FeedbackOut, FlightPredictionOut,
)
import app.modules.flights.models  # ensure Flight mapper registers before Prediction
from app.modules.predictions.models import PredictionFeedback
from app.modules.auth.router import get_current_user, RoleChecker
from app.modules.users.models import User, UserRole
import uuid as uuid_lib
from app.db.session import get_db
from datetime import datetime, timezone

# ML modules (Lazy loaded in endpoints)
# from app.ml.inference.predictor import run_inference
# from app.ml.models.xgboost_clf import ENGINE
# from app.ml.explain.shap_explainer import explain_prediction
# from app.ml.pipeline.clean import clean_input
# from app.ml.adapters.skylytics_adapters import from_legacy_input

import asyncio
import json
import hashlib
from concurrent.futures import ThreadPoolExecutor
from app.core.redis import get_redis

executor = ThreadPoolExecutor(max_workers=4)

router = APIRouter()
manager_only = RoleChecker([UserRole.MANAGER, UserRole.ADMIN])


# ─────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────

@router.post("/realtime", response_model=RealTimePredictResponse)
async def predict_realtime(
    request: RealTimePredictRequest,
    db: AsyncSession = Depends(get_db),
    redis_client = Depends(get_redis)
) -> Any:
    """
    Real-time prediction. Auto-fetches live weather severity for origin airport
    from DB unless caller explicitly provides weather_severity.
    Leverages Redis caching and ThreadPoolExecutor.
    """
    try:
        payload_str = request.model_dump_json()
        cache_key = f"predict_realtime:{hashlib.md5(payload_str.encode('utf-8')).hexdigest()}"
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        cache_key = None

    weather_severity = request.weather_severity

    if weather_severity is None:
        # Auto-lookup origin airport weather from DB
        result = await db.execute(text("""
            SELECT ws.severity
            FROM weather_snapshots ws
            JOIN airports ap ON ap.id = ws.airport_id
            WHERE ap.iata = :iata
            ORDER BY ws.observed_at DESC
            LIMIT 1
        """), {"iata": request.origin.upper()})
        row = result.mappings().first()
        weather_severity = float(row["severity"]) if row else 0.0

    overrides = {"weather_severity": weather_severity}
    
    # --- 2. Aircraft History Lookup for Bi-LSTM (Deep Intelligence) ---
    tail_number = request.tail_number or "UNKNOWN"
    history_list = []
    
    if tail_number != "UNKNOWN":
        # Find the last 2 flights of this aircraft prior to current prediction date
        current_dt = datetime.strptime(f"{request.date} {request.time}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
        
        hist_result = await db.execute(text("""
            SELECT 
                f.scheduled_dep, f.scheduled_arr, f.actual_dep, f.actual_arr,
                al.iata as airline, orig.iata as origin, dest.iata as destination,
                f.flight_number, r.distance_km as distance
            FROM flights f
            JOIN aircraft a ON a.id = f.aircraft_id
            JOIN airlines al ON al.id = f.airline_id
            JOIN airports orig ON orig.id = f.origin_id
            JOIN airports dest ON dest.id = f.dest_id
            LEFT JOIN routes r ON (r.origin_id = f.origin_id AND r.dest_id = f.dest_id)
            WHERE a.registration = :tail
              AND f.scheduled_dep < :current_dep
            ORDER BY f.scheduled_dep DESC
            LIMIT 2
        """), {"tail": tail_number, "current_dep": current_dt})
        
        hist_rows = hist_result.mappings().all()
        
        # Convert to the format needed by SkylyticsPipeline
        for row in reversed(hist_rows): # Pipeline expects oldest to newest
            # Calculate lag delay (actual - scheduled) in minutes
            lag = 0.0
            if row["actual_dep"] and row["scheduled_dep"]:
                lag = (row["actual_dep"] - row["scheduled_dep"]).total_seconds() / 60.0
            
            h_legacy = {
                "airline": row["airline"],
                "origin": row["origin"],
                "destination": row["destination"],
                "date": row["scheduled_dep"].strftime("%Y-%m-%d"),
                "time": row["scheduled_dep"].strftime("%H:%M"),
                "distance": row["distance"] or 500
            }
            # Format using adapter
            h_dict = from_legacy_input(h_legacy, tail_number=tail_number, tail_delay_lag=lag)
            history_list.append(h_dict)

    from app.ml.inference.predictor import run_inference
    from app.ml.adapters.skylytics_adapters import from_legacy_input
    
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        executor, 
        run_inference,
        request.airline, request.origin, request.destination,
        request.date, request.time, request.distance, overrides,
        tail_number, history_list
    )
    
    result["weather_severity"] = round(weather_severity, 2)
    
    if cache_key:
        try:
            await redis_client.setex(cache_key, 60, json.dumps(result))
        except Exception:
            pass

    return result

@router.post("/whatif", response_model=WhatIfResponse)
async def run_whatif(request: WhatIfRequest) -> Any:
    """
    What-if simulator. Pass overrides object (e.g. {"weather_severity": 0.8}).
    Runs calculations securely via ThreadPoolExecutor.
    """
    from app.ml.inference.predictor import run_inference
    loop = asyncio.get_running_loop()
    
    original = await loop.run_in_executor(
        executor,
        run_inference,
        request.airline, request.origin, request.destination, request.date, request.time, request.distance, None
    )
    
    modified = await loop.run_in_executor(
        executor,
        run_inference,
        request.airline, request.origin, request.destination, request.date, request.time, request.distance, request.overrides
    )
    
    return {
        "original": original,
        "modified": modified,
        "delta_probability": round(modified["probability"] - original["probability"], 1)
    }

@router.get("/heatmap", response_model=HeatmapResponse, dependencies=[Depends(manager_only)])
async def get_heatmap(db: AsyncSession = Depends(get_db)) -> Any:
    """
    Real-time AI-driven risk heatmap.
    Forecasts operational pressure for the next 12 hours by running the 
    Hybrid ML model against the live flight schedule.
    """
    # 1. Fetch top hubs and their upcoming flights
    result = await db.execute(text("""
        WITH Hubs AS (
            SELECT ap.id, ap.iata, ap.latitude, ap.longitude
            FROM flights f
            JOIN airports ap ON ap.id = f.origin_id
            GROUP BY ap.id, ap.iata, ap.latitude, ap.longitude
            ORDER BY COUNT(f.id) DESC
            LIMIT 40
        )
        SELECT 
            h.iata, h.latitude, h.longitude,
            f.flight_number, al.iata as airline_iata, 
            dest.iata as dest_iata, f.scheduled_dep, 
            COALESCE(r.distance_km, 500) as distance
        FROM Hubs h
        JOIN flights f ON f.origin_id = h.id
        JOIN airlines al ON al.id = f.airline_id
        JOIN airports dest ON dest.id = f.dest_id
        LEFT JOIN routes r ON r.origin_id = h.id AND r.dest_id = f.dest_id
        WHERE f.scheduled_dep > NOW()
        ORDER BY h.iata, f.scheduled_dep ASC
    """))
    rows = result.mappings().all()

    # 2. Group flights by hub for sampled inference
    hubs_data: Dict[str, Dict] = {}
    for r in rows:
        iata = r["iata"]
        if iata not in hubs_data:
            hubs_data[iata] = {
                "lat": float(r["latitude"]),
                "lon": float(r["longitude"]),
                "flights": []
            }
        if len(hubs_data[iata]["flights"]) < 5:  # Sample next 5 flights
            hubs_data[iata]["flights"].append(r)

    # 3. Run inferred risk in parallel across hubs
    loop = asyncio.get_running_loop()
    
    async def get_hub_risk(iata: str, data: Dict):
        inf_tasks = []
        from app.ml.inference.predictor import run_inference
        for f in data["flights"]:
            # Parallel inference for the sample
            inf_tasks.append(loop.run_in_executor(
                executor,
                run_inference,
                f["airline_iata"], iata, f["dest_iata"],
                f["scheduled_dep"].strftime("%Y-%m-%d"),
                f["scheduled_dep"].strftime("%H:%M"),
                int(f["distance"]),
                None
            ))
        
        if not inf_tasks:
            return HeatmapNode(airport=iata, risk=0.1, lat=data["lat"], lon=data["lon"], color="#4ade80", reasoning="No active data")
        
        results = await asyncio.gather(*inf_tasks)
        avg_prob = sum(res["probability"] for res in results) / len(results)
        
        # Determine primary stressor from the first flight in sample
        top_stressor = results[0]["explainability_tags"][0]["feature"] if results[0]["explainability_tags"] else "Nominal"
        
        risk = round(avg_prob, 3)
        color = "#f87171" if risk >= 0.65 else "#fbbf24" if risk >= 0.35 else "#4ade80"
        
        return HeatmapNode(
            airport=iata,
            risk=risk,
            lat=data["lat"],
            lon=data["lon"],
            color=color,
            reasoning=f"Delay Driver: {top_stressor}"
        )

    node_tasks = [get_hub_risk(iata, data) for iata, data in hubs_data.items()]
    nodes = await asyncio.gather(*node_tasks)

    return {
        "nodes": nodes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/history", dependencies=[Depends(manager_only)])
async def get_prediction_history(limit: int = 50, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Real prediction history from DB — joins predictions, flights, airlines, airports.
    Computes ground-truth error where actual arrival is known.
    """
    result = await db.execute(text("""
        SELECT
            p.id::text                                                          AS id,
            f.scheduled_dep::date                                               AS date,
            f.flight_number                                                     AS flight,
            ao.iata                                                             AS origin,
            ad.iata                                                             AS dest,
            CASE
                WHEN f.actual_arr IS NOT NULL AND f.scheduled_arr IS NOT NULL
                THEN ROUND(EXTRACT(EPOCH FROM (f.actual_arr - f.scheduled_arr)) / 60)
                ELSE NULL
            END                                                                 AS true_delay,
            p.predicted_delay_min                                               AS pred_delay,
            p.delay_probability                                                 AS probability
        FROM predictions p
        JOIN flights  f  ON f.id  = p.flight_id
        JOIN airlines al ON al.id = f.airline_id
        JOIN airports ao ON ao.id = f.origin_id
        JOIN airports ad ON ad.id = f.dest_id
        ORDER BY p.delay_probability DESC
        LIMIT :limit
    """), {"limit": limit})

    rows = result.mappings().all()
    records = []
    for r in rows:
        true_delay = int(r["true_delay"]) if r["true_delay"] is not None else None
        pred_delay = int(r["pred_delay"])
        if true_delay is not None:
            error = pred_delay - true_delay
            acc_val = max(0, 100 - abs(error))
            acc = f"{acc_val}%"
        else:
            error = None
            acc = "N/A"
        records.append({
            "id":        r["id"][:8].upper(),
            "date":      str(r["date"]),
            "flight":    r["flight"],
            "origin":    r["origin"],
            "dest":      r["dest"],
            "trueDelay": true_delay,
            "predDelay": pred_delay,
            "error":     error,
            "acc":       acc,
            "probability": round(float(r["probability"]) * 100, 1),
        })
    return records


@router.get("/trends", dependencies=[Depends(manager_only)])
async def get_trends(db: AsyncSession = Depends(get_db)) -> Any:
    """
    Real delay trends aggregated from predictions + flights tables.
    """
    # By hour of day
    hour_result = await db.execute(text("""
        SELECT
            EXTRACT(HOUR FROM f.scheduled_dep)::int         AS hour,
            ROUND(AVG(p.delay_probability * 100)::numeric, 1) AS avg_delay
        FROM predictions p
        JOIN flights f ON f.id = p.flight_id
        GROUP BY EXTRACT(HOUR FROM f.scheduled_dep)
        ORDER BY hour
    """))
    by_hour = [
        {"hour": f"{int(r['hour']):02d}:00", "avg_delay": float(r["avg_delay"])}
        for r in hour_result.mappings().all()
    ]

    # By airline — on-time percentage
    airline_result = await db.execute(text("""
        SELECT
            al.iata                                                         AS airline,
            ROUND(
                100.0 * COUNT(*) FILTER (WHERE p.delay_probability <= 0.5)
                / NULLIF(COUNT(*), 0)
            , 1)                                                            AS on_time_pct
        FROM predictions p
        JOIN flights  f  ON f.id  = p.flight_id
        JOIN airlines al ON al.id = f.airline_id
        GROUP BY al.iata
        ORDER BY on_time_pct DESC
    """))
    by_airline = [
        {"airline": r["airline"], "on_time_pct": float(r["on_time_pct"])}
        for r in airline_result.mappings().all()
    ]

    return {"by_hour": by_hour, "by_airline": by_airline}

@router.get("/models")
async def list_models() -> Any:
    """
    Registry of loaded models.
    """
    from app.ml.models.xgboost_clf import ENGINE
    if ENGINE == "xgboost":
        return [
            {"id": "xgb-cls-1.0", "name": "XGBoost Classifier", "version": "v1.0.0", "status": "PRODUCTION"},
            {"id": "xgb-reg-1.0", "name": "XGBoost Regressor", "version": "v1.0.0", "status": "PRODUCTION"},
        ]
    return [{"id": "mock-bridge-1.0", "name": "Deterministic Mock Bridge", "version": "v1.0.0", "status": "FALLBACK"}]

# ─────────────────────────────────────────────
# Per-flight prediction lookup (DB)
# ─────────────────────────────────────────────

_FLIGHT_PRED_SQL = """
    SELECT
        p.id::text                                                      AS prediction_id,
        f.id::text                                                      AS flight_id,
        f.flight_number,
        ao.iata                                                         AS origin,
        ad.iata                                                         AS dest,
        f.scheduled_dep::text                                           AS scheduled_dep,
        p.delay_probability,
        p.predicted_delay_min,
        p.confidence_lower,
        p.confidence_upper,
        ws_latest.severity                                              AS weather_severity,
        p.created_at::text                                              AS created_at
    FROM predictions p
    JOIN flights  f   ON f.id  = p.flight_id
    JOIN airports ao  ON ao.id = f.origin_id
    JOIN airports ad  ON ad.id = f.dest_id
    LEFT JOIN LATERAL (
        SELECT severity FROM weather_snapshots ws
        WHERE ws.airport_id = f.origin_id
        ORDER BY ws.observed_at DESC LIMIT 1
    ) ws_latest ON TRUE
"""


@router.get("/flight/{flight_id}", response_model=FlightPredictionOut)
async def get_flight_prediction(
    flight_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Return the highest-probability prediction for a given flight UUID.
    """
    result = await db.execute(
        text(_FLIGHT_PRED_SQL + "WHERE f.id = :fid ORDER BY p.delay_probability DESC LIMIT 1"),
        {"fid": flight_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="No prediction found for this flight")
    return dict(row)


# ─────────────────────────────────────────────
# Batch lookup (DB — no inference)
# ─────────────────────────────────────────────

@router.post("/batch", response_model=List[FlightPredictionOut])
async def batch_predict(
    request: BatchPredictionRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Return DB predictions for a list of flight UUIDs (max 100).
    No model inference — reads existing predictions table.
    """
    if not request.flight_ids:
        return []
    ids = [str(fid) for fid in request.flight_ids[:100]]

    result = await db.execute(
        text(_FLIGHT_PRED_SQL + """
            WHERE f.id = ANY(CAST(:ids AS uuid[]))
            ORDER BY p.delay_probability DESC
        """),
        {"ids": ids},
    )
    rows = result.mappings().all()
    # One prediction per flight (highest probability wins)
    seen: set = set()
    out = []
    for r in rows:
        if r["flight_id"] not in seen:
            seen.add(r["flight_id"])
            out.append(dict(r))
    return out


# ─────────────────────────────────────────────
# Feedback
# ─────────────────────────────────────────────

@router.post("/feedback", response_model=FeedbackOut, status_code=201)
async def submit_feedback(
    feedback: FeedbackIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Submit ground-truth feedback for a prediction.
    Stores actual delay, accuracy rating, and optional comment.
    """
    # Verify prediction exists
    pred_check = await db.execute(
        text("SELECT id FROM predictions WHERE id = :pid"),
        {"pid": feedback.prediction_id},
    )
    if not pred_check.mappings().first():
        raise HTTPException(status_code=404, detail="Prediction not found")

    fb = PredictionFeedback(
        prediction_id=uuid_lib.UUID(feedback.prediction_id),
        user_id=current_user.id,
        actual_delay=feedback.actual_delay,
        rating=feedback.rating,
        comment=feedback.comment,
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)

    return FeedbackOut(
        id=str(fb.id),
        prediction_id=str(fb.prediction_id),
        actual_delay=fb.actual_delay,
        rating=fb.rating,
        comment=fb.comment,
        created_at=fb.created_at.isoformat() if fb.created_at else "",
    )


# ─────────────────────────────────────────────
# SHAP Explain endpoints
# ─────────────────────────────────────────────

_FLIGHT_INPUT_SQL = """
    SELECT
        al.iata                                             AS airline,
        ao.iata                                             AS origin,
        ad.iata                                             AS dest,
        f.scheduled_dep                                     AS scheduled_dep,
        COALESCE(r.distance_km, 500)                        AS distance,
        ws_latest.severity                                  AS weather_severity
    FROM flights f
    JOIN airlines al ON al.id = f.airline_id
    JOIN airports ao ON ao.id = f.origin_id
    JOIN airports ad ON ad.id = f.dest_id
    LEFT JOIN routes r ON r.origin_id = f.origin_id AND r.dest_id = f.dest_id
    LEFT JOIN LATERAL (
        SELECT severity FROM weather_snapshots ws
        WHERE ws.airport_id = f.origin_id
        ORDER BY ws.observed_at DESC LIMIT 1
    ) ws_latest ON TRUE
    WHERE f.id = :fid
"""


async def _fetch_flight_cleaned(flight_id: str, db: AsyncSession) -> dict:
    """Fetch flight row from DB and return a clean_input-compatible dict."""
    result = await db.execute(text(_FLIGHT_INPUT_SQL), {"fid": flight_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Flight not found")

    from app.ml.pipeline.clean import clean_input
    dep: datetime = row["scheduled_dep"]
    return clean_input(
        airline=row["airline"],
        origin=row["origin"],
        dest=row["dest"],
        date=dep.strftime("%Y-%m-%d"),
        time=dep.strftime("%H:%M"),
        distance=int(row["distance"] or 500),
    )


@router.get("/flight/{flight_id}/explain")
async def explain_prediction_endpoint(
    flight_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Any:
    """
    Full SHAP breakdown for a flight's delay prediction.
    Returns per-feature SHAP values and top-5 ranked factors.
    """
    from app.ml.explain.shap_explainer import explain_prediction as shap_explain
    cleaned = await _fetch_flight_cleaned(flight_id, db)
    return shap_explain(cleaned)


@router.get("/flight/{flight_id}/explain/simple")
async def explain_prediction_simple(
    flight_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Any:
    """
    Plain-language one-paragraph explanation of the top delay driver.
    """
    from app.ml.explain.shap_explainer import explain_simple as shap_simple
    cleaned = await _fetch_flight_cleaned(flight_id, db)
    return shap_simple(cleaned)


# ─────────────────────────────────────────────
# Model registry — promote
# ─────────────────────────────────────────────

@router.post("/models/{model_id}/promote")
async def promote_model(
    model_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Promote a model to PRODUCTION status and demote all others.
    Admin-only.
    """
    # Verify model exists
    check = await db.execute(
        text("SELECT id, name, version FROM ml_models WHERE id = :mid"),
        {"mid": model_id},
    )
    model = check.mappings().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    now = datetime.now(timezone.utc)

    # Demote current production models
    await db.execute(
        text("UPDATE ml_models SET status = 'ARCHIVED' WHERE status = 'PRODUCTION' AND id != :mid"),
        {"mid": model_id},
    )
    # Promote target
    await db.execute(
        text("UPDATE ml_models SET status = 'PRODUCTION', promoted_at = :now WHERE id = :mid"),
        {"mid": model_id, "now": now},
    )
    await db.commit()

    return {
        "status":      "promoted",
        "model_id":    model_id,
        "name":        model["name"],
        "version":     model["version"],
        "promoted_at": now.isoformat(),
    }


# ─────────────────────────────────────────────
# Retrain trigger
# ─────────────────────────────────────────────

@router.post("/models/retrain")
async def trigger_retrain(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
) -> Any:
    """
    Queue a model retrain job. Creates a new ml_models record with
    status TRAINING that represents the in-progress run.
    Admin-only.
    """
    now = datetime.now(timezone.utc)
    # Derive next version from current production model
    result = await db.execute(
        text("SELECT version FROM ml_models WHERE status = 'PRODUCTION' ORDER BY trained_at DESC LIMIT 1")
    )
    row = result.mappings().first()
    current_ver = row["version"] if row else "v1.0.0"
    parts = current_ver.lstrip("v").split(".")
    try:
        next_minor = int(parts[1]) + 1
        next_ver = f"v{parts[0]}.{next_minor}.0"
    except Exception:
        next_ver = "v2.0.0"

    new_id = str(uuid_lib.uuid4())
    await db.execute(
        text("""
            INSERT INTO ml_models (id, name, version, algorithm, artifact_path, status, trained_at)
            VALUES (:id, :name, :version, 'XGBOOST', :path, 'TRAINING', :now)
        """),
        {
            "id":      new_id,
            "name":    f"XGBoost Delay Classifier + Regressor",
            "version": next_ver,
            "path":    "skylytics_model_assets/xgb_classifier.pkl",
            "now":     now,
        },
    )
    await db.commit()

    return {
        "status":     "queued",
        "job_id":     new_id,
        "version":    next_ver,
        "message":    f"Retrain job {new_id} queued. Model {next_ver} will appear with status TRAINING.",
        "queued_at":  now.isoformat(),
    }
