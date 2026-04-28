import uuid
import enum
from sqlalchemy import Column, String, Integer, Float, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class FlightStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    BOARDING = "BOARDING"
    PUSHBACK = "PUSHBACK"
    EN_ROUTE = "EN_ROUTE"
    LANDED = "LANDED"
    CANCELLED = "CANCELLED"
    DELAYED = "DELAYED"

class EventType(str, enum.Enum):
    STATUS_CHANGE = "STATUS_CHANGE"
    GATE_CHANGE = "GATE_CHANGE"
    DELAY_LOGGED = "DELAY_LOGGED"

class Airport(Base):
    __tablename__ = "airports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    iata = Column(String(3), unique=True, index=True, nullable=False)
    icao = Column(String(4), nullable=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timezone = Column(String, nullable=False)
    elevation_ft = Column(Integer, nullable=True)

class Airline(Base):
    __tablename__ = "airlines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    iata = Column(String(2), unique=True, index=True, nullable=False)
    icao = Column(String(3), nullable=True)
    name = Column(String, nullable=False)
    country = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)

class Aircraft(Base):
    __tablename__ = "aircraft"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    icao_type = Column(String, nullable=False)
    registration = Column(String, nullable=False)
    model = Column(String, nullable=False)
    capacity = Column(Integer, nullable=True)

class Route(Base):
    __tablename__ = "routes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    origin_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    dest_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    distance_km = Column(Integer, nullable=True)
    avg_duration_min = Column(Integer, nullable=True)
    
    origin = relationship("Airport", foreign_keys=[origin_id])
    dest = relationship("Airport", foreign_keys=[dest_id])

class Flight(Base):
    __tablename__ = "flights"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flight_number = Column(String, index=True, nullable=False)
    airline_id = Column(UUID(as_uuid=True), ForeignKey("airlines.id"), nullable=False)
    origin_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    dest_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    aircraft_id = Column(UUID(as_uuid=True), ForeignKey("aircraft.id"), nullable=True)
    scheduled_dep = Column(DateTime(timezone=True), nullable=False)
    scheduled_arr = Column(DateTime(timezone=True), nullable=False)
    actual_dep = Column(DateTime(timezone=True), nullable=True)
    actual_arr = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(FlightStatus), default=FlightStatus.SCHEDULED, nullable=False)
    gate = Column(String, nullable=True)
    terminal = Column(String, nullable=True)
    data_source = Column(String, nullable=False)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    airline = relationship("Airline")
    origin = relationship("Airport", foreign_keys=[origin_id])
    dest = relationship("Airport", foreign_keys=[dest_id])
    aircraft = relationship("Aircraft")
    events = relationship("FlightEvent", back_populates="flight", cascade="all, delete-orphan")

class FlightEvent(Base):
    __tablename__ = "flight_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flight_id = Column(UUID(as_uuid=True), ForeignKey("flights.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(Enum(EventType), nullable=False)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
    metadata_ = Column("metadata", JSONB, nullable=True)
    
    flight = relationship("Flight", back_populates="events")

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    airport_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    temperature_c = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_dir = Column(Integer, nullable=True)
    visibility_m = Column(Integer, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    conditions = Column(String, nullable=True)
    severity = Column(Float, nullable=True)          # 0.0 – 1.0 computed severity
    source = Column(String, nullable=False)

    airport = relationship("Airport")
