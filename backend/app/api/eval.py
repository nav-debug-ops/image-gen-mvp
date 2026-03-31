import json
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.eval.judge import judge_image
from app.eval.rubric import VALID_CONTENT_TYPES, get_profile
from app.models.generation import Generation

router = APIRouter()


class EvalRequest(BaseModel):
    image_url: str
    prompt: str
    content_type: str
    image_id: Optional[str] = None  # if provided, score is persisted to generation record


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
async def score_image(
    req: EvalRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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

    response = EvalResponse(
        composite=result.weighted_composite,
        judge_overall=result.judge_overall,
        passed=result.passed,
        dimensions=dims,
        strengths=result.strengths,
        improvements=result.improvements,
        error=result.error,
    )

    # Persist score to generation record if image_id provided
    if req.image_id and not result.error:
        try:
            gen_result = await db.execute(
                select(Generation).where(
                    Generation.image_id == req.image_id,
                    Generation.user_id == user.id,
                )
            )
            gen = gen_result.scalar_one_or_none()
            if gen:
                gen.eval_score = json.dumps({
                    "composite": response.composite,
                    "judge_overall": response.judge_overall,
                    "passed": response.passed,
                    "dimensions": [d.model_dump() for d in dims],
                    "strengths": response.strengths,
                    "improvements": response.improvements,
                })
                await db.commit()
        except Exception as e:
            print(f"[eval] Failed to persist score for {req.image_id}: {e}")

    return response
