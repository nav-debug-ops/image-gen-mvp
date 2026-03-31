from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.auth import get_current_user
from app.services.campaigns_service import analyze_campaign, chat_with_campaign
from app.services.infographic_brief_service import generate_infographic_brief

router = APIRouter()


class CampaignRequest(BaseModel):
    asin: str = ""
    marketplace: str = "US"
    keyword: str = ""
    processing_mode: str = "fast"


class InfographicRequest(BaseModel):
    asin: str
    marketplace: str = "US"


class ChatRequest(BaseModel):
    message: str
    context_summary: str = ""
    marketplace: str = "US"


@router.post("/analyze")
async def analyze(req: CampaignRequest, user=Depends(get_current_user)):
    if not req.asin and not req.keyword:
        raise HTTPException(status_code=400, detail="Provide either an ASIN or a keyword")
    if req.asin and len(req.asin) != 10:
        raise HTTPException(status_code=400, detail="ASIN must be exactly 10 characters")
    try:
        result = await analyze_campaign(
            asin=req.asin,
            marketplace=req.marketplace,
            keyword=req.keyword,
            processing_mode=req.processing_mode,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Campaign analysis failed: {e}")


@router.post("/infographic-brief")
async def infographic_brief(req: InfographicRequest, user=Depends(get_current_user)):
    """
    Generate a complete 7-infographic creative campaign brief for Amazon Secondary Images.
    Returns strategic analysis, color palette, competitor gap, and all 7 infographic briefs.
    """
    if len(req.asin) != 10:
        raise HTTPException(status_code=400, detail="ASIN must be exactly 10 characters")
    try:
        result = await generate_infographic_brief(req.asin, req.marketplace)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Infographic brief generation failed: {e}")


@router.post("/chat")
async def campaign_chat(req: ChatRequest, user=Depends(get_current_user)):
    """Answer a question grounded in the user's campaign market intelligence."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        reply = await chat_with_campaign(req.message, req.context_summary, req.marketplace)
        return {"reply": reply}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")
