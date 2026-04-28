import uuid
import enum
from sqlalchemy import Column, String, Integer, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ExplanationMethod(str, enum.Enum):
    SHAP = "SHAP"
    LIME = "LIME"

class ModelAlgorithm(str, enum.Enum):
    XGBOOST = "XGBOOST"
    LIGHTGBM = "LIGHTGBM"
    RANDOM_FOREST = "RANDOM_FOREST"
    LSTM = "LSTM"
    TRANSFORMER = "TRANSFORMER"

class ModelStatus(str, enum.Enum):
    TRAINING = "TRAINING"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"
    ARCHIVED = "ARCHIVED"

class MlModel(Base):
    __tablename__ = "ml_models"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    algorithm = Column(Enum(ModelAlgorithm), nullable=False)
    metrics = Column(JSONB, nullable=True)
    artifact_path = Column(String, nullable=False)
    status = Column(Enum(ModelStatus), default=ModelStatus.STAGING, nullable=False)
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    promoted_at = Column(DateTime(timezone=True), nullable=True)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flight_id = Column(UUID(as_uuid=True), ForeignKey("flights.id", ondelete="CASCADE"), nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey("ml_models.id"), nullable=False)
    delay_probability = Column(Float, nullable=False)
    predicted_delay_min = Column(Integer, nullable=False)
    confidence_lower = Column(Integer, nullable=True)
    confidence_upper = Column(Integer, nullable=True)
    features_snapshot = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    flight = relationship("Flight")
    model = relationship("MlModel")
    explanation = relationship("Explanation", back_populates="prediction", uselist=False, cascade="all, delete-orphan")

class Explanation(Base):
    __tablename__ = "explanations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, unique=True)
    method = Column(Enum(ExplanationMethod), nullable=False)
    shap_values = Column(JSONB, nullable=True)
    top_factors = Column(JSONB, nullable=True)
    plain_text = Column(Text, nullable=True)
    
    prediction = relationship("Prediction", back_populates="explanation")

class PredictionFeedback(Base):
    __tablename__ = "prediction_feedback"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id",       ondelete="CASCADE"), nullable=True,  index=True)
    actual_delay  = Column(Integer, nullable=True)   # actual delay in minutes (ground truth)
    rating        = Column(String,  nullable=True)   # "ACCURATE" | "TOO_HIGH" | "TOO_LOW"
    comment       = Column(Text,    nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    prediction = relationship("Prediction")


class WhatifScenario(Base):
    __tablename__ = "whatif_scenarios"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    flight_id = Column(UUID(as_uuid=True), ForeignKey("flights.id", ondelete="CASCADE"), nullable=False)
    overrides = Column(JSONB, nullable=False)
    result = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    flight = relationship("Flight")
