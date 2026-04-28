import os
import json
from pydantic import BaseModel, UUID4, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime

# ─── Load Valid Codes for Validation ──────────────────────────────────────────
CODES_FILE = os.path.join(os.path.dirname(__file__), "../../../skylytics_model_assets/production/skylytics_valid_codes.json")
try:
    with open(CODES_FILE, "r") as f:
        _codes = json.load(f)
    VALID_AIRLINES = set(_codes.get("valid_airlines", []))
    VALID_ORIGINS = set(_codes.get("valid_origin_airports", []))
    VALID_DESTINATIONS = set(_codes.get("valid_destination_airports", []))
except Exception:
    VALID_AIRLINES = VALID_ORIGINS = VALID_DESTINATIONS = set()


class PredictionBase(BaseModel):
    delay_probability: float
    predicted_delay_min: int
    confidence_lower: Optional[int] = None
    confidence_upper: Optional[int] = None

class Prediction(PredictionBase):
    id: UUID4
    flight_id: UUID4
    model_id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExplanationBase(BaseModel):
    method: str
    shap_values: Optional[Dict[str, Any]] = None
    top_factors: Optional[Dict[str, Any]] = None
    plain_text: Optional[str] = None

class Explanation(ExplanationBase):
    id: UUID4
    prediction_id: UUID4
    
    class Config:
        from_attributes = True

class BatchPredictionRequest(BaseModel):
    # DDOS Protection mechanism: cap batch lookups
    flight_ids: List[UUID4] = Field(..., max_length=100)

class WhatIfRequest(BaseModel):
    airline: str
    origin: str
    destination: str
    date: str
    time: str
    distance: int = 500
    overrides: Dict[str, Any]

    @field_validator("airline")
    def validate_airline(cls, v):
        v = v.upper()
        if VALID_AIRLINES and v not in VALID_AIRLINES:
            raise ValueError(f"Airline '{v}' not recognized in dictionary.")
        return v
        
    @field_validator("origin")
    def validate_origin(cls, v):
        v = v.upper()
        if VALID_ORIGINS and v not in VALID_ORIGINS:
            raise ValueError(f"Origin '{v}' not modeled in system.")
        return v

    @field_validator("destination")
    def validate_dest(cls, v):
        v = v.upper()
        if VALID_DESTINATIONS and v not in VALID_DESTINATIONS:
            raise ValueError(f"Destination '{v}' not modeled in system.")
        return v
        
    @field_validator("date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format.")
        return v

    @field_validator("time")
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Time must be in HH:MM format.")
        return v

class WhatIfResponse(BaseModel):
    original: Dict[str, Any]
    modified: Dict[str, Any]
    delta_probability: float
    warning: Optional[str] = None

class RealTimePredictRequest(BaseModel):
    airline: str
    origin: str
    destination: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    distance: int = 500  # Default if not provided
    weather_severity: Optional[float] = 0.0
    tail_number: Optional[str] = "UNKNOWN"
    flight_number: Optional[str] = None

    @field_validator("airline")
    def validate_airline(cls, v):
        v = v.upper()
        if VALID_AIRLINES and v not in VALID_AIRLINES:
            raise ValueError(f"Airline '{v}' not recognized in dictionary.")
        return v
        
    @field_validator("origin")
    def validate_origin(cls, v):
        v = v.upper()
        if VALID_ORIGINS and v not in VALID_ORIGINS:
            raise ValueError(f"Origin '{v}' not modeled in system.")
        return v

    @field_validator("destination")
    def validate_dest(cls, v):
        v = v.upper()
        if VALID_DESTINATIONS and v not in VALID_DESTINATIONS:
            raise ValueError(f"Destination '{v}' not modeled in system.")
        return v

    @field_validator("date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format.")
        return v

    @field_validator("time")
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Time must be in HH:MM format.")
        return v

class RealTimePredictData(BaseModel):
    prediction_type: str
    predicted_delayed: bool
    hybrid_probability: float
    estimated_delay_minutes: float

class ExplainabilityTag(BaseModel):
    feature: str
    impact_minutes: str
    type: str

class RealTimePredictResponse(BaseModel):
    status: str
    data: RealTimePredictData
    explainability_tags: List[ExplainabilityTag]


class FeedbackIn(BaseModel):
    prediction_id: str
    actual_delay: Optional[int] = None        # minutes
    rating: Optional[str] = None              # "ACCURATE" | "TOO_HIGH" | "TOO_LOW"
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    id: str
    prediction_id: str
    actual_delay: Optional[int]
    rating: Optional[str]
    comment: Optional[str]
    created_at: str


class FlightPredictionOut(BaseModel):
    prediction_id: str
    flight_id: str
    flight_number: str
    origin: str
    dest: str
    scheduled_dep: str
    delay_probability: float
    predicted_delay_min: int
    confidence_lower: Optional[int]
    confidence_upper: Optional[int]
    weather_severity: Optional[float]
    created_at: str

class HeatmapNode(BaseModel):
    airport: str
    risk: float
    lat: float
    lon: float
    color: str
    reasoning: Optional[str] = None

class HeatmapResponse(BaseModel):
    nodes: List[HeatmapNode]
    timestamp: str
