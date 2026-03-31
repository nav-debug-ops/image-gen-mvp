import json
import uuid

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.user import User
from app.models.generation import Generation
from app.services.auth import get_current_user
from app.services.storage import storage

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

router = APIRouter()


@router.post("/upload-reference")
async def upload_reference_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a reference image for img2img generation. Returns a URL usable in generate requests."""
    content_type = file.content_type or ""
    if content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="File must be a JPEG, PNG, WebP, or GIF image.")

    content = await file.read()
    if len(content) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File size must be less than 10 MB.")

    ref_id = uuid.uuid4().hex[:12]
    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    filename = f"ref_{ref_id}.{ext}"

    url = await storage.save(content, filename=filename, content_type=content_type)
    return {"url": url, "filename": filename}


@router.get("/")
async def list_images(
    limit: int = 20,
    offset: int = 0,
    archived: bool = False,
    search: str = None,
    sort_by: str = "newest",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's generated images with pagination, optional prompt search and sort."""
    from sqlalchemy import func, asc

    base_filter = [
        Generation.user_id == current_user.id,
        Generation.status == "completed",
        Generation.is_archived == archived,
    ]

    if search:
        base_filter.append(Generation.prompt.ilike(f"%{search}%"))

    order_clause = {
        "newest": desc(Generation.created_at),
        "oldest": asc(Generation.created_at),
        "provider": asc(Generation.provider),
    }.get(sort_by, desc(Generation.created_at))

    count_result = await db.execute(
        select(func.count(Generation.id)).where(*base_filter)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Generation)
        .where(*base_filter)
        .order_by(order_clause)
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
            "is_archived": g.is_archived,
            "eval_score": json.loads(g.eval_score) if g.eval_score else None,
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
        "eval_score": json.loads(gen.eval_score) if gen.eval_score else None,
        "created_at": str(gen.created_at),
    }


@router.patch("/{image_id}/archive")
async def archive_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle archive status of a generated image."""
    result = await db.execute(
        select(Generation).where(
            Generation.image_id == image_id,
            Generation.user_id == current_user.id,
        )
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Image not found")

    gen.is_archived = not gen.is_archived
    await db.commit()
    return {"success": True, "is_archived": gen.is_archived}


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

    # Delete file from active storage backend
    await storage.delete(f"{image_id}.png")

    gen.status = "deleted"
    await db.commit()

    return {"success": True, "message": "Image deleted"}
