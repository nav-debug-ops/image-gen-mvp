import json
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ContentDraft(Base):
    __tablename__ = "content_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tool_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # listing_copywriter | aplus_content | brand_story | storefront_designer | campaign
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled")
    data: Mapped[str] = mapped_column(Text, nullable=False)  # JSON blob
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    def data_dict(self) -> dict:
        try:
            return json.loads(self.data)
        except Exception:
            return {}
