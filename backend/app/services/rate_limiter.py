from datetime import datetime, date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.generation import Generation
from app.config import get_settings

settings = get_settings()


async def check_rate_limit(user_id: int, db: AsyncSession) -> dict:
    """Check if user is within rate limits. Raises 429 if exceeded."""
    today = date.today()
    first_of_month = today.replace(day=1)

    # Daily count
    daily_result = await db.execute(
        select(func.count(Generation.id)).where(
            Generation.user_id == user_id,
            func.date(Generation.created_at) == str(today),
            Generation.status != "failed",
        )
    )
    daily_count = daily_result.scalar() or 0

    # Monthly count
    monthly_result = await db.execute(
        select(func.count(Generation.id)).where(
            Generation.user_id == user_id,
            Generation.created_at >= datetime.combine(first_of_month, datetime.min.time()),
            Generation.status != "failed",
        )
    )
    monthly_count = monthly_result.scalar() or 0

    limits = {
        "daily": {
            "used": daily_count,
            "limit": settings.daily_generation_limit,
            "remaining": max(0, settings.daily_generation_limit - daily_count),
        },
        "monthly": {
            "used": monthly_count,
            "limit": settings.monthly_generation_limit,
            "remaining": max(0, settings.monthly_generation_limit - monthly_count),
        },
    }

    if daily_count >= settings.daily_generation_limit:
        raise HTTPException(
            status_code=429,
            detail={"message": "Daily generation limit reached", "limits": limits},
        )

    if monthly_count >= settings.monthly_generation_limit:
        raise HTTPException(
            status_code=429,
            detail={"message": "Monthly generation limit reached", "limits": limits},
        )

    return limits
