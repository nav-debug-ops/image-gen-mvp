from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.auth import get_current_user
from app.services.campaigns_service import analyze_campaign

router = APIRouter()


class CampaignRequest(BaseModel):
    asin: str
    marketplace: str = "US"


@router.post("/analyze")
async def analyze(req: CampaignRequest, user=Depends(get_current_user)):
    if len(req.asin) != 10:
        raise HTTPException(status_code=400, detail="ASIN must be exactly 10 characters")
    try:
        result = await analyze_campaign(req.asin, req.marketplace)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Campaign analysis failed: {e}")
