from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func

from app.database import Base


class CalibrationEntry(Base):
    __tablename__ = "calibration_entries"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    image_id      = Column(String(50), nullable=False, index=True)
    image_url     = Column(String(500), nullable=False)
    prompt        = Column(Text, nullable=False)
    content_type  = Column(String(50), default="listing_main")

    # Human scorer data
    human_scores    = Column(Text, nullable=False)   # JSON: {dim_id: score}
    human_composite = Column(Float, nullable=False)
    human_passed    = Column(Boolean, nullable=False, default=False)
    human_notes     = Column(Text, nullable=True)

    # AI judge snapshot (captured at calibration time)
    ai_scores    = Column(Text, nullable=True)        # JSON: {dim_id: score}
    ai_composite = Column(Float, nullable=True)
    ai_passed    = Column(Boolean, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
