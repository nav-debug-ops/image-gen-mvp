import json

from fastapi import APIRouter, HTTPException, Depends, Query

from app.services.auth import get_current_user
from app.services.keyword_suggester import suggest_keywords
from app.models.user import User

router = APIRouter()

_VALID_TYPES = {"benefits", "features", "comparison", "lifestyle", "quality", "howto"}


@router.get("/suggest")
async def get_keyword_suggestions(
    asin: str = Query(..., description="Amazon ASIN"),
    type: str = Query(..., description="Image type id"),
    title: str = Query(default=""),
    brand: str = Query(default=""),
    bullets: str = Query(default="[]", description="JSON array of bullet strings"),
    category: str = Query(default=""),
    current_user: User = Depends(get_current_user),
):
    """Generate AI keyword chip suggestions for a given ASIN + image type."""
    if type not in _VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type '{type}'. Must be one of: {', '.join(sorted(_VALID_TYPES))}",
        )

    try:
        bullets_list = json.loads(bullets) if bullets else []
        if not isinstance(bullets_list, list):
            bullets_list = []
    except Exception:
        bullets_list = []

    product = {
        "title": title,
        "brand": brand,
        "bullets": bullets_list,
        "category": category,
    }

    try:
        keywords = await suggest_keywords(asin.upper(), type, product)
        return {"keywords": keywords, "type": type, "asin": asin.upper()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Keyword suggestion failed: {str(e)}")
