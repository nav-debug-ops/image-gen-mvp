from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.auth import get_current_user
from app.eval.judge import judge_image
from app.eval.rubric import VALID_CONTENT_TYPES, get_profile

router = APIRouter()


class EvalRequest(BaseModel):
    image_url: str
    prompt: str
    content_type: str


class DimScore(BaseModel):
    id: str
    name: str
    score: float
    rationale: str
    weight: float


class EvalResponse(BaseModel):
    composite: float
    judge_overall: float
    passed: bool
    dimensions: list[DimScore]
    strengths: list[str]
    improvements: list[str]
    error: Optional[str] = None


@router.post("/score", response_model=EvalResponse)
async def score_image(req: EvalRequest, user=Depends(get_current_user)):
    ct = req.content_type if req.content_type in VALID_CONTENT_TYPES else "listing_main"
    result = await judge_image(req.image_url, req.prompt, ct)
    profile = get_profile(ct)

    dims = [
        DimScore(
            id=ds.dimension_id,
            name=ds.dimension_name,
            score=ds.score,
            rationale=ds.rationale,
            weight=profile.weights.get(ds.dimension_id, 0),
        )
        for ds in result.dimension_scores
    ]
    dims.sort(key=lambda d: d.weight, reverse=True)

    return EvalResponse(
        composite=result.weighted_composite,
        judge_overall=result.judge_overall,
        passed=result.passed,
        dimensions=dims,
        strengths=result.strengths,
        improvements=result.improvements,
        error=result.error,
    )
