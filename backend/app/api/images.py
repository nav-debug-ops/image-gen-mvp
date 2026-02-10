from fastapi import APIRouter, HTTPException
from typing import List
import os
import json
from datetime import datetime

from app.config import get_settings

router = APIRouter()
settings = get_settings()

METADATA_FILE = os.path.join(settings.storage_path, "metadata.json")


def load_metadata() -> List[dict]:
    """Load image metadata from file."""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return []


@router.get("/")
async def list_images(limit: int = 20, offset: int = 0):
    """List all generated images with pagination."""
    metadata = load_metadata()
    # Sort by newest first
    metadata.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    total = len(metadata)
    images = metadata[offset:offset + limit]

    return {
        "images": images,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/{image_id}")
async def get_image(image_id: str):
    """Get details for a specific image."""
    metadata = load_metadata()

    for image in metadata:
        if image.get("id") == image_id:
            return image

    raise HTTPException(status_code=404, detail="Image not found")


@router.delete("/{image_id}")
async def delete_image(image_id: str):
    """Delete a generated image."""
    metadata = load_metadata()

    for i, image in enumerate(metadata):
        if image.get("id") == image_id:
            # Delete file
            filepath = os.path.join(settings.storage_path, f"{image_id}.png")
            if os.path.exists(filepath):
                os.remove(filepath)

            # Remove from metadata
            metadata.pop(i)
            with open(METADATA_FILE, "w") as f:
                json.dump(metadata, f)

            return {"success": True, "message": "Image deleted"}

    raise HTTPException(status_code=404, detail="Image not found")
