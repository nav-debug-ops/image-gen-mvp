from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.database import Base


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    enhanced_prompt = Column(Text, nullable=True)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    image_url = Column(String(500), nullable=True)
    image_id = Column(String(50), nullable=True, index=True)
    aspect_ratio = Column(String(10), default="1:1")
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    cost_estimate = Column(Float, default=0.0)
    duration_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    failover_from = Column(String(50), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
