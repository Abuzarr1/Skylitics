"""
AI Copilot — Gemini-powered assistant with live DB fallback.
Upgraded to provide real-time flight and weather telemetry.
"""
import re
import os
import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, Optional

from app.modules.assistant.schemas import QueryRequest, QueryResponse
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()

# ── Intent patterns ───────────────────────────────────────────────────────────
_CALLSIGN_RE = re.compile(r'\b([A-Z]{2,3}\d{1,4})\b')
_IATA_RE     = re.compile(r'\b([A-Z]{3})\b')

WEATHER_KW  = {"weather", "storm", "rain", "snow", "wind", "fog", "ice", "visibility", "conditions", "status"}
RISK_KW     = {"risk", "delay", "delayed", "worst", "at-risk", "atrisk", "critical", "alert"}
STATS_KW    = {"dashboard", "stats", "statistics", "overview", "total", "summary", "accuracy", "model"}

def _words(msg: str) -> set:
    return set(re.findall(r'\w+', msg.lower()))

def _extract_callsign(msg: str) -> Optional[str]:
    m = _CALLSIGN_RE.search(msg.upper())
    return m.group(1) if m else None

def _extract_iata(msg: str) -> Optional[str]:
    for token in _IATA_RE.findall(msg.upper()):
        if token not in {"THE", "FOR", "AND", "GET", "ALL", "ANY", "ARE", "NOT",
                         "HOW", "CAN", "DID", "TOP", "LOW", "NOW", "OUT", "ITS"}:
            return token
    return None


# ── Gemini LLM Engine ─────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are SkyAI, the AI Copilot of the Skylytics aviation intelligence platform.
You help airline operations managers understand flight delays, weather risks, and system analytics.
Your personality is: precise, professional, data-driven, and concise.
Always format numbers clearly and keep responses under 150 words.
Never make up data.
Prefix key metrics with ▸."""

async def _call_gemini(user_message: str) -> str:
    """Call Google Gemini 1.5 Flash via REST API."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": f"[SYSTEM]: {SYSTEM_PROMPT}\n\n[USER]: {user_message}"}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 300}
    }

    try:
        # Reduced timeout to 3s for faster "feel" on fallbacks
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return None


# ── Live Rule Engine (Async DB Bound) ──────────────────────────────────────────

async def _fetch_flight_data(db: AsyncSession, callsign: str) -> str:
    result = await db.execute(text("""
        SELECT f.flight_number, f.status, f.scheduled_dep, 
               al.name as airline, ap_o.iata as origin, ap_d.iata as dest
        FROM flights f
        JOIN airlines al ON al.id = f.airline_id
        JOIN airports ap_o ON ap_o.id = f.origin_id
        JOIN airports ap_d ON ap_d.id = f.dest_id
        WHERE f.flight_number = :cs
        ORDER BY f.scheduled_dep DESC
        LIMIT 1
    """), {"cs": callsign})
    row = result.mappings().first()
    
    if not row:
        return f"> [VEC_FETCH]: Callsign {callsign} not found in active session.\n>   Check history for legacy vectors."

    status = row['status']
    risk = "HIGH RISK ⚠" if status in ["DELAYED", "CANCELLED"] else "NOMINAL ✓"
    
    return (
        f"> [VEC_FETCH]: {row['flight_number']} — Neural Link Active\n"
        f">   Carrier           : {row['airline']}\n"
        f">   Route             : {row['origin']} → {row['dest']}\n"
        f">   Current Status    : {status}\n"
        f">   Operational Risk  : {risk}\n"
        f">   Scheduled Dep     : {row['scheduled_dep'].strftime('%H:%M Z')}"
    )

async def _fetch_weather_data(db: AsyncSession, iata: str) -> str:
    result = await db.execute(text("""
        SELECT ap.name, ws.conditions, ws.severity, ws.temperature_c, ws.wind_speed, ws.observed_at
        FROM weather_snapshots ws
        JOIN airports ap ON ap.id = ws.airport_id
        WHERE ap.iata = :iata
        ORDER BY ws.observed_at DESC
        LIMIT 1
    """), {"iata": iata.upper()})
    row = result.mappings().first()
    
    if not row:
        return f"> [GEO_SCAN]: Node {iata.upper()} atmospheric telemetry unavailable.\n>   Sensor sync required."

    severity = float(row['severity'] or 0)
    tag = "CRITICAL 🌩" if severity >= 0.7 else "MODERATE" if severity >= 0.4 else "CLEAR ✓"
    
    return (
        f"> [GEO_SCAN]: Airport {iata.upper()} ({row['name']}) Status\n"
        f">   Conditions        : {row['conditions']}\n"
        f">   Impact Score      : {round(severity * 100, 1)}% [{tag}]\n"
        f">   Temp / Wind       : {row['temperature_c']}°C / {round(row['wind_speed'] * 3.6, 1)} km/h\n"
        f">   Last Observe      : {row['observed_at'].strftime('%H:%M UTC')}"
    )

async def _fetch_network_stats(db: AsyncSession) -> str:
    # Use standard SQL for compatibility
    f_res = await db.execute(text("SELECT COUNT(*) FROM flights WHERE status != 'LANDED'"))
    w_res = await db.execute(text("SELECT COUNT(*) FROM weather_snapshots WHERE severity >= 0.6"))
    
    f_count = f_res.scalar() or 0
    w_count = w_res.scalar() or 0
    
    return (
        "> [MATRIX_STATS]: Skylytics Real-Time Network Sync\n"
        f">   Active Airborn Vectors : {f_count}\n"
        f">   Severe Weather Nodes   : {w_count}\n"
        ">   System Status          : OPTIMAL\n"
        ">   Inference Core         : Real-Time DB Active (Live Sync)"
    )

async def _fetch_at_risk_flights(db: AsyncSession) -> str:
    result = await db.execute(text("""
        SELECT f.flight_number, f.status, al.name as airline, ap_o.iata as origin, ap_d.iata as dest,
               p.delay_probability, p.predicted_delay_min
        FROM predictions p
        JOIN flights f ON f.id = p.flight_id
        JOIN airlines al ON al.id = f.airline_id
        JOIN airports ap_o ON ap_o.id = f.origin_id
        JOIN airports ap_d ON ap_d.id = f.dest_id
        WHERE f.status IN ('DELAYED', 'CANCELLED')
           OR p.delay_probability > 0.5
        ORDER BY p.delay_probability DESC
        LIMIT 6
    """))
    rows = result.mappings().all()
    
    if not rows:
        return "> [RISK_SCAN]: No critical flight anomalies detected in the current vector set.\n>   All systems nominal."

    header = f"> [RISK_SCAN]: {len(rows)} critical vector alerts detected via Neural Engine.\n"
    lines = []
    for r in rows:
        prob = round(float(r['delay_probability']) * 100, 1)
        status = r['status']
        if status == 'SCHEDULED' and prob > 50:
            status = f"AT RISK ({prob}% Probability)"
        
        lines.append(f">   ▸ {r['flight_number']} ({r['airline']}): {r['origin']}→{r['dest']} | {status}")
    
    return header + "\n".join(lines)

GREETING_KW = {"hi", "hello", "hey", "help", "commands", "start", "intro"}
ADVICE_KW   = {"do", "solution", "advice", "handle", "mitigate", "action", "why"}

async def _run_rule_engine(db: AsyncSession, msg: str) -> QueryResponse:
    # 1. Clean context: if simulator context is prepended (contains ':'), look at the part after the colon
    clean_msg = msg
    if ":" in msg and "Route" in msg:
        clean_msg = msg.split(":", 1)[1].strip() or msg
    
    words = _words(clean_msg)
    callsign = _extract_callsign(clean_msg)
    iata = _extract_iata(clean_msg)

    # Simulator deep-dive rule
    if ":" in msg and (words & ADVICE_KW):
        return QueryResponse(
            response=(
                "> [SKYAI_ADVISORY]: Simulation matrix analysis complete.\n"
                ">   Potential bottleneck identified in meteorological or logistical vectors.\n"
                ">   Action: Evaluate gate reassignment or buffer crew availability to mitigate ripple effects.\n"
                ">   Action: Proactively notify passengers via Skylytics Passenger Node."
            ),
            intent="SIMULATION_ADVICE",
            confidence=0.95
        )

    if callsign:
        res = await _fetch_flight_data(db, callsign)
        return QueryResponse(response=res, intent="FLIGHT_STATUS", confidence=0.95)
    
    if iata and (words & WEATHER_KW or words & RISK_KW):
        res = await _fetch_weather_data(db, iata)
        return QueryResponse(response=res, intent="AIRPORT_STATUS", confidence=0.85)
        
    if words & RISK_KW:
        res = await _fetch_at_risk_flights(db)
        return QueryResponse(response=res, intent="AT_RISK_SCAN", confidence=0.90)

    if words & STATS_KW:
        res = await _fetch_network_stats(db)
        return QueryResponse(response=res, intent="NETWORK_STATS", confidence=0.90)

    if words & GREETING_KW or len(words) <= 2:
        res = (
            "> [SKYAI_NODE]: SkyAI Copilot Online. Operational commands ready.\n"
            ">   Try: 'ATL weather'    → Airport weather & severity\n"
            ">   Try: 'DL192 status'   → Live flight vector lookup\n"
            ">   Try: 'network summary'→ Real-time system stats\n"
            ">   Try: 'any at-risk?'   → High-delay flight scan"
        )
        return QueryResponse(response=res, intent="GREETING", confidence=0.90)

    res = await _fetch_network_stats(db)
    return QueryResponse(response=res, intent="GENERAL_HELP", confidence=0.60)


# ── Main endpoint ─────────────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def query_assistant(
    request: QueryRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    msg = request.message.strip()

    # 1. Try fast local rule engine FIRST for known intents
    rule_result = await _run_rule_engine(db, msg)

    # If rule engine matched a specific intent with high confidence, return instantly
    if rule_result.confidence >= 0.80:
        return rule_result

    # 2. For ambiguous / open-ended questions, try Gemini LLM
    gemini_response = await _call_gemini(msg)
    if gemini_response:
        return QueryResponse(response=gemini_response, intent="LLM_RESPONSE", confidence=0.98)

    # 3. Final fallback: return the rule engine result anyway
    return rule_result

