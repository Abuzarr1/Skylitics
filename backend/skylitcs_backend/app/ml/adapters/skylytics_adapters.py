"""
Skylytics Integration Adapters
================================
Task 4: to_legacy_format() — converts new pipeline output to old frontend schema
Task 5: from_legacy_input() — converts old frontend request to new pipeline input

Drop this file into your backend alongside skylytics_predict.py.

Usage:
    from skylytics_adapters import from_legacy_input, to_legacy_format, enrich_weather_features
"""

import math
import re
from datetime import datetime, timedelta

# ============================================================
# US Federal Holidays (2024-2027 coverage)
# ============================================================
US_HOLIDAYS = {
    "2024-01-01", "2024-07-04", "2024-11-28", "2024-12-25",
    "2025-01-01", "2025-07-04", "2025-11-27", "2025-12-25",
    "2026-01-01", "2026-07-04", "2026-11-26", "2026-12-25",
    "2027-01-01", "2027-07-05", "2027-11-25", "2027-12-25",
}


def compute_holiday_pulse(date_str: str) -> float:
    """Compute 3-day weighted holiday proximity pulse.

    Args:
        date_str: Date in 'YYYY-MM-DD' format.

    Returns:
        Float: 1.0 on holiday, 0.75 within ±1 day, 0.50 within ±2 days, else 0.0.
    """
    dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    for offset in range(3):
        for delta in (-offset, offset):
            neighbor = dt + timedelta(days=delta)
            if neighbor.isoformat() in US_HOLIDAYS:
                if offset == 0:
                    return 1.0
                elif offset == 1:
                    return 0.75
                elif offset == 2:
                    return 0.50
    return 0.0


# ============================================================
# TASK 5: INPUT ADAPTER — Old Frontend → New Pipeline
# ============================================================

def from_legacy_input(legacy_request: dict,
                      weather: dict = None,
                      network_stats: dict = None,
                      tail_number: str = "UNKNOWN",
                      tail_delay_lag: float = 0.0,
                      operational_strain: int = 1,
                      origin_traffic_3h: int = 80) -> dict:
    """Convert old frontend request format to SkylyticsPipeline.predict_single() input.

    Args:
        legacy_request: Dict with keys: airline, origin, destination, date, time, distance,
                       weather_severity (ignored — replaced by real weather data).
        weather: Optional dict with Open-Meteo weather fields for the origin airport.
                 Keys: temperature_2m, relative_humidity_2m, dew_point_2m, precipitation,
                       snow_depth, surface_pressure, wind_speed_10m, wind_direction_10m,
                       weather_code. If None, imputation defaults (training means) are used.
        network_stats: Optional dict with pre-computed network features.
                       Keys: hub_connectivity_degree, carrier_hub_dominance_ratio.
                       If None, imputation defaults are used.
        tail_number: Aircraft tail number. Defaults to 'UNKNOWN' if not available.
        tail_delay_lag: Arrival delay (minutes) of the previous flight by this tail.
                       Defaults to 0.0 (no known prior delay).
        operational_strain: Number of flights this tail has operated today (including this one).
                           Defaults to 1.
        origin_traffic_3h: Count of departures from origin in the 3h window.
                          Defaults to 80 (approximate training mean).

    Returns:
        Dict ready to pass to SkylyticsPipeline.predict_single(flight_dict).

    Example:
        >>> legacy = {
        ...     "airline": "DL", "origin": "ATL", "destination": "JFK",
        ...     "date": "2026-04-21", "time": "08:30", "distance": 865
        ... }
        >>> flight_dict = from_legacy_input(legacy)
        >>> result = pipeline.predict_single(flight_dict)
    """
    # --- Parse date and time ---
    date_str = legacy_request["date"]
    time_str = legacy_request["time"]
    dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")

    month = dt.month
    day_of_week = dt.isoweekday()  # 1=Monday, 7=Sunday
    hour = dt.hour + dt.minute / 60.0

    # --- Cyclic encodings ---
    month_sin = math.sin(2 * math.pi * month / 12)
    month_cos = math.cos(2 * math.pi * month / 12)
    dow_sin = math.sin(2 * math.pi * day_of_week / 7)
    dow_cos = math.cos(2 * math.pi * day_of_week / 7)
    hour_sin = math.sin(2 * math.pi * hour / 24)
    hour_cos = math.cos(2 * math.pi * hour / 24)

    # --- Holiday pulse ---
    holiday_pulse = compute_holiday_pulse(date_str)

    # --- Weather features (from API or imputation defaults) ---
    # IMPUTATION DEFAULTS = training set means from skylytics_imputation_means.json
    w = weather or {}
    temperature_2m = w.get("temperature_2m", 18.41)
    relative_humidity_2m = w.get("relative_humidity_2m", 62.45)
    dew_point_2m = w.get("dew_point_2m", 9.69)
    precipitation = w.get("precipitation", 0.12)
    snow_depth = w.get("snow_depth", 0.0045)
    surface_pressure = w.get("surface_pressure", 985.80)
    wind_speed_10m = w.get("wind_speed_10m", 11.92)
    wind_direction_10m = w.get("wind_direction_10m", 185.33)
    weather_code = w.get("weather_code", 8.56)

    # --- Derived physics features ---
    air_density_proxy = surface_pressure / (temperature_2m + 273.15)
    crosswind_component_proxy = abs(math.sin(
        wind_direction_10m * math.pi / 180)) * wind_speed_10m

    # --- Temperature gradient (requires 2 weather readings) ---
    # If weather dict has 'temperature_2m_prev', compute delta; else use 0.0
    temp_prev = w.get("temperature_2m_prev", temperature_2m)
    temp_gradient_prev = temperature_2m - temp_prev

    # --- Network features ---
    ns = network_stats or {}
    hub_connectivity_degree = ns.get("hub_connectivity_degree", 72.06)
    carrier_hub_dominance_ratio = ns.get("carrier_hub_dominance_ratio", 0.30)

    # --- Build the flight dict ---
    scheduled_departure_utc = dt.strftime("%Y-%m-%d %H:%M:%S")

    flight_dict = {
        # Identifiers (used by pipeline for categorical encoding)
        "TAIL_NUMBER": tail_number,
        "AIRLINE": legacy_request["airline"],
        "ORIGIN_AIRPORT": legacy_request["origin"],
        "DESTINATION_AIRPORT": legacy_request["destination"],
        "SCHEDULED_DEPARTURE_UTC": scheduled_departure_utc,

        # Numeric whitelist features (all 25)
        "month_sin": month_sin,
        "month_cos": month_cos,
        "dow_sin": dow_sin,
        "dow_cos": dow_cos,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "holiday_pulse_weighted": holiday_pulse,
        "temperature_2m": temperature_2m,
        "relative_humidity_2m": relative_humidity_2m,
        "dew_point_2m": dew_point_2m,
        "precipitation": precipitation,
        "snow_depth": snow_depth,
        "surface_pressure": surface_pressure,
        "wind_speed_10m": wind_speed_10m,
        "wind_direction_10m": wind_direction_10m,
        "weather_code": weather_code,
        "air_density_proxy": air_density_proxy,
        "crosswind_component_proxy": crosswind_component_proxy,
        "temp_gradient_prev": temp_gradient_prev,
        "DISTANCE": legacy_request.get("distance", 833),
        "hub_connectivity_degree": hub_connectivity_degree,
        "carrier_hub_dominance_ratio": carrier_hub_dominance_ratio,
        "operational_strain_daily": operational_strain,
        "tail_delay_lag": tail_delay_lag,
        "origin_traffic_density_3h": origin_traffic_3h,
    }

    return flight_dict


# ============================================================
# TASK 4: OUTPUT ADAPTER — New Pipeline → Legacy Frontend
# ============================================================

def to_legacy_format(pipeline_result: dict,
                     explainability_tags: list = None) -> dict:
    """Convert SkylyticsPipeline.predict_single() output to legacy frontend format.

    Args:
        pipeline_result: Dict returned by predict_single() with keys:
                        hybrid_probability, predicted_delayed, estimated_delay_minutes,
                        prediction_type, xgb_probability, lstm_probability.
        explainability_tags: Optional list of dicts with keys:
                            feature, impact_minutes, type.
                            If provided, converted to shap_factors format.

    Returns:
        Dict in legacy format: probability, delay_minutes, is_delayed, shap_factors, engine.

    Example:
        >>> result = pipeline.predict_single(flight_dict)
        >>> legacy_response = to_legacy_format(result)
        >>> # legacy_response = {"probability": 85.0, "delay_minutes": 42.5, ...}
    """
    # --- Map prediction_type → engine ---
    engine_map = {
        "HYBRID": "hybrid",
        "XGB_ONLY": "xgboost",
    }
    engine = engine_map.get(
        pipeline_result.get("prediction_type", "XGB_ONLY"), "xgboost")

    # --- Map probability (0-1 float → 0-100 percentage) ---
    probability = round(
        pipeline_result.get("hybrid_probability", 0.0) * 100, 1)

    # --- Map delay minutes ---
    delay_minutes = round(
        pipeline_result.get("estimated_delay_minutes", 0.0), 1)

    # --- Map is_delayed ---
    is_delayed = bool(pipeline_result.get("predicted_delayed", False))

    # --- Convert explainability_tags → shap_factors ---
    shap_factors = []
    if explainability_tags:
        for tag in explainability_tags:
            # Parse impact_minutes string like "+15" or "-5" to numeric
            impact_str = str(tag.get("impact_minutes", "0"))
            try:
                contribution = abs(float(impact_str.replace("+", "")))
            except ValueError:
                contribution = 0.0

            # Map type values: "warning" → "negative", "success" → "positive"
            tag_type = tag.get("type", "neutral")
            if tag_type == "warning":
                factor_type = "negative"
            elif tag_type == "success":
                factor_type = "positive"
            else:
                factor_type = "neutral"

            shap_factors.append({
                "feature": tag.get("feature", "Unknown"),
                "contribution": contribution,
                "type": factor_type,
            })

    return {
        "probability": probability,
        "delay_minutes": delay_minutes,
        "is_delayed": is_delayed,
        "shap_factors": shap_factors,
        "engine": engine,
    }


# ============================================================
# WEATHER ENRICHMENT HELPER
# ============================================================

def build_open_meteo_request(airport_lat: float, airport_lon: float,
                             date_str: str, hour: int) -> dict:
    """Build an Open-Meteo API request for weather enrichment.

    This is a helper that shows the EXACT request format the backend
    must use to fetch weather data for the pipeline.

    Args:
        airport_lat: Latitude of the origin airport.
        airport_lon: Longitude of the origin airport.
        date_str: Date in 'YYYY-MM-DD' format.
        hour: Departure hour (0-23).

    Returns:
        Dict with 'url' and 'params' ready for requests.get().

    Example:
        >>> req = build_open_meteo_request(33.6367, -84.4281, "2026-04-21", 8)
        >>> response = requests.get(req['url'], params=req['params'])
        >>> hourly = response.json()['hourly']
        >>> # Extract the row matching the departure hour
    """
    return {
        "url": "https://api.open-meteo.com/v1/forecast",
        "params": {
            "latitude": airport_lat,
            "longitude": airport_lon,
            "hourly": ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "dew_point_2m",
                "precipitation",
                "snow_depth",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "weather_code",
            ]),
            "start_date": date_str,
            "end_date": date_str,
            "timezone": "UTC",
        },
        "note": (
            "After fetching, extract the hourly arrays and pick index={hour}. "
            "For temp_gradient_prev, also fetch hour-1 temperature and subtract."
        ),
    }


# ============================================================
# STANDALONE TEST
# ============================================================

if __name__ == "__main__":
    # --- Test Input Adapter ---
    legacy_input = {
        "airline": "DL",
        "origin": "ATL",
        "destination": "JFK",
        "date": "2026-04-21",
        "time": "08:30",
        "distance": 865,
        "weather_severity": 0.0,  # ignored by new pipeline
    }

    flight_dict = from_legacy_input(legacy_input)
    print("=== INPUT ADAPTER TEST ===")
    print(f"Keys in flight_dict: {len(flight_dict)}")
    for k, v in flight_dict.items():
        print(f"  {k}: {v}")

    # --- Test Output Adapter ---
    mock_pipeline_result = {
        "hybrid_probability": 0.85,
        "predicted_delayed": True,
        "estimated_delay_minutes": 42.5,
        "prediction_type": "HYBRID",
        "xgb_probability": 0.82,
        "lstm_probability": 0.90,
    }

    mock_tags = [
        {"feature": "Inbound Aircraft History",
         "impact_minutes": "+15", "type": "warning"},
        {"feature": "Origin Airport Congestion",
         "impact_minutes": "+12", "type": "warning"},
        {"feature": "Optimal Weather",
         "impact_minutes": "-5", "type": "success"},
    ]

    legacy_output = to_legacy_format(mock_pipeline_result, mock_tags)
    print("\n=== OUTPUT ADAPTER TEST ===")
    for k, v in legacy_output.items():
        print(f"  {k}: {v}")
