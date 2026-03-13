from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.auth import get_current_user
from app.services.copywriter_service import generate_listing_copy

router = APIRouter()


class CopywriterRequest(BaseModel):
    asin: str
    marketplace: str = "US"
    language: str = "English"
    tone: str = "professional"
    keywords: list[str] = []


class CopywriterResponse(BaseModel):
    titles: list[str]
    bullets: list[str]
    description: str
    search_terms: str
    product_title: Optional[str] = None


@router.post("/generate", response_model=CopywriterResponse)
async def generate_copy(req: CopywriterRequest, user=Depends(get_current_user)):
    if len(req.asin) != 10:
        raise HTTPException(status_code=400, detail="ASIN must be exactly 10 characters")

    try:
        result = await generate_listing_copy(
            asin=req.asin,
            marketplace=req.marketplace,
            language=req.language,
            tone=req.tone,
            keywords=req.keywords,
        )
        return CopywriterResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copy generation failed: {e}")
