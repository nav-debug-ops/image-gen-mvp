"""
Calibration API
===============
Human vs. AI scorer calibration.

Routes:
  POST /api/eval/calibration         — submit human scores for an image
  GET  /api/eval/calibration         — list all calibration entries for user
  GET  /api/eval/calibration/report  — aggregate agreement stats
"""

import json
import statistics
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.eval.judge import judge_image
from app.eval.rubric import get_profile, compute_weighted_score, VALID_CONTENT_TYPES
from app.models.calibration import CalibrationEntry
from app.models.generation import Generation

router = APIRouter()


class HumanScoreSubmit(BaseModel):
    image_id: str
    image_url: str
    prompt: str
    content_type: str = "listing_main"
    human_scores: dict[str, float]   # {dim_id: 1–5}
    notes: Optional[str] = None


@router.post("")
async def submit_calibration(
    req: HumanScoreSubmit,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Save a human scorecard for one image and return the side-by-side comparison
    with the Gemini judge score (fetched from generation record or run on-demand).
    """
    ct = req.content_type if req.content_type in VALID_CONTENT_TYPES else "listing_main"
    profile = get_profile(ct)

    # ── Human composite ──────────────────────────────────────────────────────────
    human_composite = compute_weighted_score(req.human_scores, ct)
    human_passed = human_composite >= profile.pass_threshold

    # ── AI score: try generation record first, else call judge ──────────────────
    ai_composite = None
    ai_passed = None
    ai_scores_dict = None

    gen_result = await db.execute(
        select(Generation).where(
            Generation.image_id == req.image_id,
            Generation.user_id == user.id,
        )
    )
    gen = gen_result.scalar_one_or_none()

    if gen and gen.eval_score:
        cached = json.loads(gen.eval_score)
        ai_composite = cached.get("composite")
        ai_passed = cached.get("passed")
        ai_scores_dict = {d["id"]: d["score"] for d in cached.get("dimensions", [])}
    else:
        # Run Gemini judge now
        judge_result = await judge_image(req.image_url, req.prompt, ct)
        if not judge_result.error:
            ai_composite = judge_result.weighted_composite
            ai_passed = judge_result.passed
            ai_scores_dict = judge_result.scores_by_id

            # Persist the AI score to the generation record for future use
            if gen:
                dims_payload = [
                    {
                        "id": ds.dimension_id,
                        "name": ds.dimension_name,
                        "score": ds.score,
                        "rationale": ds.rationale,
                        "weight": profile.weights.get(ds.dimension_id, 0),
                    }
                    for ds in judge_result.dimension_scores
                ]
                gen.eval_score = json.dumps({
                    "composite": ai_composite,
                    "judge_overall": judge_result.judge_overall,
                    "passed": ai_passed,
                    "dimensions": dims_payload,
                    "strengths": judge_result.strengths,
                    "improvements": judge_result.improvements,
                })
                await db.commit()

    # ── Prevent duplicate calibration entries ────────────────────────────────────
    existing = await db.execute(
        select(CalibrationEntry).where(
            CalibrationEntry.image_id == req.image_id,
            CalibrationEntry.user_id == user.id,
        )
    )
    entry = existing.scalar_one_or_none()

    if entry:
        # Update existing entry
        entry.human_scores    = json.dumps(req.human_scores)
        entry.human_composite = human_composite
        entry.human_passed    = human_passed
        entry.human_notes     = req.notes
        entry.ai_scores       = json.dumps(ai_scores_dict) if ai_scores_dict else None
        entry.ai_composite    = ai_composite
        entry.ai_passed       = ai_passed
    else:
        entry = CalibrationEntry(
            user_id       = user.id,
            image_id      = req.image_id,
            image_url     = req.image_url,
            prompt        = req.prompt,
            content_type  = ct,
            human_scores  = json.dumps(req.human_scores),
            human_composite = human_composite,
            human_passed  = human_passed,
            human_notes   = req.notes,
            ai_scores     = json.dumps(ai_scores_dict) if ai_scores_dict else None,
            ai_composite  = ai_composite,
            ai_passed     = ai_passed,
        )
        db.add(entry)

    await db.commit()
    await db.refresh(entry)

    # ── Per-dimension comparison ─────────────────────────────────────────────────
    dim_comparison = []
    for dim_id, human_score in req.human_scores.items():
        ai_score = (ai_scores_dict or {}).get(dim_id)
        dim_comparison.append({
            "dim_id": dim_id,
            "human": human_score,
            "ai": ai_score,
            "delta": round(human_score - ai_score, 2) if ai_score is not None else None,
        })

    return {
        "entry_id": entry.id,
        "image_id": req.image_id,
        "human_composite": human_composite,
        "human_passed": human_passed,
        "ai_composite": ai_composite,
        "ai_passed": ai_passed,
        "composite_delta": round(human_composite - ai_composite, 2) if ai_composite is not None else None,
        "pass_agreement": human_passed == ai_passed if ai_passed is not None else None,
        "dim_comparison": dim_comparison,
    }


@router.get("")
async def list_calibrations(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all calibration entries for the current user, newest first."""
    result = await db.execute(
        select(CalibrationEntry)
        .where(CalibrationEntry.user_id == user.id)
        .order_by(CalibrationEntry.created_at.desc())
    )
    entries = result.scalars().all()

    return {
        "entries": [_serialize_entry(e) for e in entries],
        "total": len(entries),
    }


@router.get("/report")
async def get_calibration_report(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregate calibration statistics across all scored images.

    Returns:
      - Overall: n, MAE, bias, pass-agreement %
      - Per-dimension: mean human, mean AI, mean delta
      - All entries (for table display)
    """
    result = await db.execute(
        select(CalibrationEntry)
        .where(
            CalibrationEntry.user_id == user.id,
            CalibrationEntry.ai_composite.isnot(None),
        )
        .order_by(CalibrationEntry.created_at.desc())
    )
    entries = result.scalars().all()

    if not entries:
        return {
            "n": 0,
            "mean_human": None,
            "mean_ai": None,
            "mae": None,
            "bias": None,
            "pass_agreement_pct": None,
            "calibration_label": None,
            "by_dimension": [],
            "entries": [],
        }

    human_composites = [e.human_composite for e in entries]
    ai_composites    = [e.ai_composite for e in entries]
    deltas           = [h - a for h, a in zip(human_composites, ai_composites)]
    abs_errors       = [abs(d) for d in deltas]

    mae  = round(statistics.mean(abs_errors), 3)
    bias = round(statistics.mean(deltas), 3)

    agreed = sum(1 for e in entries if e.human_passed == e.ai_passed)
    pass_agreement_pct = round((agreed / len(entries)) * 100, 1)

    # Calibration quality label
    if mae < 0.3:
        calibration_label = "Excellent"
    elif mae < 0.6:
        calibration_label = "Good"
    elif mae < 1.0:
        calibration_label = "Moderate"
    else:
        calibration_label = "Poor"

    # Per-dimension stats
    dim_data: dict[str, dict] = {}
    for entry in entries:
        h_scores = json.loads(entry.human_scores) if entry.human_scores else {}
        a_scores = json.loads(entry.ai_scores) if entry.ai_scores else {}
        for dim_id, h_score in h_scores.items():
            a_score = a_scores.get(dim_id)
            if a_score is None:
                continue
            if dim_id not in dim_data:
                dim_data[dim_id] = {"human": [], "ai": []}
            dim_data[dim_id]["human"].append(h_score)
            dim_data[dim_id]["ai"].append(a_score)

    by_dimension = []
    for dim_id, vals in dim_data.items():
        mean_h = round(statistics.mean(vals["human"]), 2)
        mean_a = round(statistics.mean(vals["ai"]), 2)
        by_dimension.append({
            "dim_id": dim_id,
            "mean_human": mean_h,
            "mean_ai": mean_a,
            "mean_delta": round(mean_h - mean_a, 2),
            "n": len(vals["human"]),
        })
    by_dimension.sort(key=lambda d: abs(d["mean_delta"]), reverse=True)

    return {
        "n": len(entries),
        "mean_human": round(statistics.mean(human_composites), 2),
        "mean_ai":    round(statistics.mean(ai_composites), 2),
        "mae":        mae,
        "bias":       bias,
        "pass_agreement_pct": pass_agreement_pct,
        "calibration_label":  calibration_label,
        "by_dimension": by_dimension,
        "entries": [_serialize_entry(e) for e in entries],
    }


def _serialize_entry(e: CalibrationEntry) -> dict:
    return {
        "id":              e.id,
        "image_id":        e.image_id,
        "image_url":       e.image_url,
        "prompt":          e.prompt,
        "content_type":    e.content_type,
        "human_composite": e.human_composite,
        "human_passed":    e.human_passed,
        "ai_composite":    e.ai_composite,
        "ai_passed":       e.ai_passed,
        "delta":           round(e.human_composite - e.ai_composite, 2) if e.ai_composite is not None else None,
        "human_scores":    json.loads(e.human_scores) if e.human_scores else {},
        "ai_scores":       json.loads(e.ai_scores) if e.ai_scores else {},
        "notes":           e.human_notes,
        "created_at":      str(e.created_at),
    }
