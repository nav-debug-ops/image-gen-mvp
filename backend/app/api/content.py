from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.auth import get_current_user
from app.services.content_service import generate_content

router = APIRouter()


class ContentRequest(BaseModel):
    asin: str
    page_type: str          # aplus | brand_story | storefront
    module_type: str        # e.g. single-image-highlights, brand-qa, hero-header
    marketplace: str = "US"


@router.post("/generate")
async def generate_module_content(req: ContentRequest, user=Depends(get_current_user)):
    """
    Generate Amazon-compliant copy for an A+ Content, Brand Story,
    or Storefront Designer module.

    Returns: headline, body, highlights[], specs[], qa_pairs[]
    """
    if len(req.asin) != 10:
        raise HTTPException(status_code=400, detail="ASIN must be exactly 10 characters")
    if req.page_type not in ("aplus", "brand_story", "storefront"):
        raise HTTPException(
            status_code=400,
            detail="page_type must be one of: aplus, brand_story, storefront"
        )
    try:
        result = await generate_content(
            asin=req.asin,
            page_type=req.page_type,
            module_type=req.module_type,
            marketplace=req.marketplace,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {e}")
