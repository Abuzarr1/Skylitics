from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime
from app.modules.flights.models import FlightStatus, EventType

class AirlineBase(BaseModel):
    iata: str
    name: str

class Airline(AirlineBase):
    id: UUID4
    class Config:
        from_attributes = True

class AirportBase(BaseModel):
    iata: str
    name: str
    city: str
    latitude: float
    longitude: float

class Airport(AirportBase):
    id: UUID4
    class Config:
        from_attributes = True

class FlightBase(BaseModel):
    flight_number: str
    scheduled_dep: datetime
    scheduled_arr: datetime
    status: FlightStatus

class Flight(FlightBase):
    id: UUID4
    airline: Optional[Airline] = None
    origin: Optional[Airport] = None
    dest: Optional[Airport] = None
    actual_dep: Optional[datetime] = None
    actual_arr: Optional[datetime] = None
    gate: Optional[str] = None
    terminal: Optional[str] = None

    class Config:
        from_attributes = True
