from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import date, datetime

from app.database import get_db
from app.models.user import User
from app.models.generation import Generation
from app.services.auth import get_current_user
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/summary")
async def usage_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get usage summary for current user."""
    today = date.today()
    first_of_month = today.replace(day=1)

    # Daily count
    daily_result = await db.execute(
        select(func.count(Generation.id)).where(
            Generation.user_id == current_user.id,
            func.date(Generation.created_at) == str(today),
            Generation.status != "failed",
        )
    )
    daily_count = daily_result.scalar() or 0

    # Monthly count
    monthly_result = await db.execute(
        select(func.count(Generation.id)).where(
            Generation.user_id == current_user.id,
            Generation.created_at >= datetime.combine(first_of_month, datetime.min.time()),
            Generation.status != "failed",
        )
    )
    monthly_count = monthly_result.scalar() or 0

    # Total count
    total_result = await db.execute(
        select(func.count(Generation.id)).where(
            Generation.user_id == current_user.id,
            Generation.status == "completed",
        )
    )
    total_count = total_result.scalar() or 0

    # Total cost
    cost_result = await db.execute(
        select(func.sum(Generation.cost_estimate)).where(
            Generation.user_id == current_user.id,
            Generation.status == "completed",
        )
    )
    total_cost = cost_result.scalar() or 0.0

    return {
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
        "total_generations": total_count,
        "total_cost_estimate": round(total_cost, 4),
    }


@router.get("/history")
async def usage_history(
    limit: int = 50,
    offset: int = 0,
    provider: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get generation history for current user."""
    query = select(Generation).where(Generation.user_id == current_user.id)

    if provider:
        query = query.where(Generation.provider == provider)

    # Count
    count_query = select(func.count(Generation.id)).where(
        Generation.user_id == current_user.id
    )
    if provider:
        count_query = count_query.where(Generation.provider == provider)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch
    result = await db.execute(
        query.order_by(desc(Generation.created_at)).offset(offset).limit(limit)
    )
    generations = result.scalars().all()

    items = [
        {
            "id": g.id,
            "prompt": g.prompt[:100],
            "provider": g.provider,
            "model": g.model,
            "status": g.status,
            "cost_estimate": g.cost_estimate,
            "duration_ms": g.duration_ms,
            "created_at": str(g.created_at),
        }
        for g in generations
    ]

    return {"generations": items, "total": total}
