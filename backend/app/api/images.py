from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import os

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.models.generation import Generation
from app.services.auth import get_current_user

router = APIRouter()
settings = get_settings()


@router.get("/")
async def list_images(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's generated images with pagination."""
    # Count total
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count(Generation.id)).where(
            Generation.user_id == current_user.id,
            Generation.status == "completed",
        )
    )
    total = count_result.scalar() or 0

    # Fetch page
    result = await db.execute(
        select(Generation)
        .where(Generation.user_id == current_user.id, Generation.status == "completed")
        .order_by(desc(Generation.created_at))
        .offset(offset)
        .limit(limit)
    )
    generations = result.scalars().all()

    images = [
        {
            "id": g.image_id,
            "generation_id": g.id,
            "prompt": g.prompt,
            "image_url": g.image_url,
            "provider": g.provider,
            "model": g.model,
            "aspect_ratio": g.aspect_ratio,
            "cost_estimate": g.cost_estimate,
            "created_at": str(g.created_at),
        }
        for g in generations
    ]

    return {"images": images, "total": total, "limit": limit, "offset": offset}


@router.get("/{image_id}")
async def get_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details for a specific image."""
    result = await db.execute(
        select(Generation).where(
            Generation.image_id == image_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()

    if not gen:
        raise HTTPException(status_code=404, detail="Image not found")

    return {
        "id": gen.image_id,
        "generation_id": gen.id,
        "prompt": gen.prompt,
        "image_url": gen.image_url,
        "provider": gen.provider,
        "model": gen.model,
        "aspect_ratio": gen.aspect_ratio,
        "cost_estimate": gen.cost_estimate,
        "duration_ms": gen.duration_ms,
        "created_at": str(gen.created_at),
    }


@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a generated image."""
    result = await db.execute(
        select(Generation).where(
            Generation.image_id == image_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()

    if not gen:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete file
    filepath = os.path.join(settings.storage_path, f"{image_id}.png")
    if os.path.exists(filepath):
        os.remove(filepath)

    # Mark as deleted
    gen.status = "deleted"
    await db.commit()

    return {"success": True, "message": "Image deleted"}
