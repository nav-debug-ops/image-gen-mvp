"""
LLM-as-Judge — Ecommerce Image Quality Evaluator
=================================================

Uses Gemini 2.5 Flash (vision-capable) to score a single image against
the rubric defined in rubric.py. Returns a structured EvaluationResult.

Usage:
    result = await judge_image(
        image_url="https://example.com/image.png",
        prompt="A blue water bottle on white background...",
        content_type="listing_main",
    )
"""

import json
import re
import httpx
from dataclasses import dataclass, field
from typing import Optional

from app.config import get_settings
from app.eval.rubric import (
    get_profile,
    get_all_dimensions_for,
    compute_weighted_score,
    VALID_CONTENT_TYPES,
)

settings = get_settings()

_JUDGE_MODEL = "gemini-2.5-flash"
_GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent?key={key}"
)


# ── Output Schema ──────────────────────────────────────────────────────────────

@dataclass
class DimensionScore:
    dimension_id: str
    dimension_name: str
    score: float           # 1–5
    rationale: str         # 1–2 sentence explanation


@dataclass
class EvaluationResult:
    image_url: str
    prompt: str
    content_type: str

    dimension_scores: list[DimensionScore]
    scores_by_id: dict[str, float]          # dim_id → score (for runner)

    weighted_composite: float               # computed from rubric weights
    judge_overall: float                    # judge's own holistic impression (1–5)
    passed: bool                            # composite >= profile.pass_threshold

    strengths: list[str]                    # top 2–3 things done well
    improvements: list[str]                 # top 2–3 actionable suggestions

    raw_response: Optional[str] = None     # full LLM text (for debugging)
    error: Optional[str] = None            # set if scoring failed


# ── System Prompt Factory ──────────────────────────────────────────────────────

def _build_system_prompt(content_type: str) -> str:
    """Build the LLM judge system prompt for a given content type."""
    profile = get_profile(content_type)
    dimensions = get_all_dimensions_for(content_type)

    # Build dimension scoring guide block
    dim_lines = []
    for dim in dimensions:
        weight_pct = round(profile.weights.get(dim.id, 0) * 100)
        dim_lines.append(f"\n### {dim.name} (weight: {weight_pct}%)")
        dim_lines.append(f"{dim.description}")
        dim_lines.append("Scoring anchors:")
        for score_val in sorted(dim.anchors.keys()):
            dim_lines.append(f"  {score_val} — {dim.anchors[score_val]}")

    dimensions_block = "\n".join(dim_lines)

    # Build expected JSON shape
    dim_ids = [d.id for d in dimensions]
    example_scores = {
        "dimension_scores": [
            {
                "dimension_id": d.id,
                "dimension_name": d.name,
                "score": 4,
                "rationale": "One to two sentences explaining the score."
            }
            for d in dimensions[:2]
        ] + [{"...": "one object per dimension"}],
        "judge_overall": 3.8,
        "strengths": ["Strength 1", "Strength 2"],
        "improvements": ["Actionable suggestion 1", "Actionable suggestion 2"]
    }

    return f"""You are an expert ecommerce image quality evaluator specialising in Amazon product listings.

## Your Task
Evaluate the provided image against the scoring rubric for **{profile.name}**.

## Content Type Context
{profile.purpose}

## Scoring Rubric
Score each dimension on a **1–5 integer scale** using the anchors below.
Assign scores rigorously — a 5 is genuinely exceptional, a 3 is acceptable but ordinary.
{dimensions_block}

## Instructions
1. Examine the image carefully in the context of the prompt/brief provided.
2. Score EVERY dimension listed in the rubric. Do not skip any.
3. For each dimension, provide a concise rationale (1–2 sentences) that references specific visual evidence.
4. Give `judge_overall`: your holistic impression score (1–5, decimals allowed) as an experienced ecommerce art director.
5. List 2–3 specific `strengths` (what works well).
6. List 2–3 specific, actionable `improvements` (concrete changes that would raise the score).

## Critical Rules
- Be honest and calibrated. Do not inflate scores.
- Reference visual specifics in rationales — not just "looks good".
- `improvements` must be actionable: "Increase contrast between callout text and background" not "improve text".
- All scores must be integers 1–5. `judge_overall` may use one decimal place.

## Output Format
Respond with ONLY a valid JSON object matching this exact structure — no markdown, no preamble:
{json.dumps(example_scores, indent=2)}

The full `dimension_scores` array must contain one object for each of these dimension IDs (in order):
{json.dumps(dim_ids)}
"""


# ── Judge Call ─────────────────────────────────────────────────────────────────

async def judge_image(
    image_url: str,
    prompt: str,
    content_type: str,
) -> EvaluationResult:
    """
    Score a single image using the LLM judge.

    Args:
        image_url:    Public URL or local /images/ path of the generated image.
        prompt:       The original generation prompt / creative brief.
        content_type: One of VALID_CONTENT_TYPES.

    Returns:
        EvaluationResult with all dimension scores and composite.
    """
    if content_type not in VALID_CONTENT_TYPES:
        raise ValueError(f"Invalid content_type '{content_type}'. Use: {VALID_CONTENT_TYPES}")

    if not settings.gemini_api_key:
        return EvaluationResult(
            image_url=image_url, prompt=prompt, content_type=content_type,
            dimension_scores=[], scores_by_id={},
            weighted_composite=0.0, judge_overall=0.0, passed=False,
            strengths=[], improvements=[],
            error="GEMINI_API_KEY not configured",
        )

    profile = get_profile(content_type)
    dimensions = get_all_dimensions_for(content_type)
    system_prompt = _build_system_prompt(content_type)

    user_message = (
        f"**Content Type:** {profile.name}\n\n"
        f"**Original Prompt / Brief:**\n{prompt}\n\n"
        f"**Image to evaluate:** (see attached image)\n\n"
        "Please evaluate the image now and return only the JSON object."
    )

    # Resolve image for Gemini — try to fetch as base64 for local paths,
    # otherwise pass as fileData URI for public URLs.
    image_part = await _resolve_image_part(image_url)

    request_body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{
            "parts": [
                {"text": user_message},
                image_part,
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,   # Low temperature for consistent scoring
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }

    url = _GEMINI_ENDPOINT.format(model=_JUDGE_MODEL, key=settings.gemini_api_key)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=request_body)

        if resp.status_code != 200:
            err = resp.json().get("error", {}).get("message", f"HTTP {resp.status_code}")
            return _error_result(image_url, prompt, content_type, f"Gemini error: {err}")

        data = resp.json()
        raw_text = _extract_text(data)

        if not raw_text:
            return _error_result(image_url, prompt, content_type, "Empty response from judge")

        return _parse_response(raw_text, image_url, prompt, content_type, profile, dimensions)

    except httpx.TimeoutException:
        return _error_result(image_url, prompt, content_type, "Judge request timed out")
    except Exception as e:
        return _error_result(image_url, prompt, content_type, f"Unexpected error: {e}")


# ── Image Resolution ───────────────────────────────────────────────────────────

async def _resolve_image_part(image_url: str) -> dict:
    """
    Return a Gemini content part for the image.
    - Local /images/ paths: read file and encode as base64 inlineData.
    - Public URLs: use fileData with the URL directly.
    """
    import base64
    import os

    if image_url.startswith("/images/"):
        # Local generated image — read from storage_path
        filename = image_url.lstrip("/images/")
        filepath = os.path.join(settings.storage_path, filename)
        if os.path.exists(filepath):
            with open(filepath, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
            return {"inlineData": {"mimeType": "image/png", "data": b64}}

    # Public URL — fetch and encode
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(image_url)
            r.raise_for_status()
            mime = r.headers.get("content-type", "image/jpeg").split(";")[0]
            b64 = base64.b64encode(r.content).decode("utf-8")
            return {"inlineData": {"mimeType": mime, "data": b64}}
    except Exception:
        # Last resort: pass as text URL reference (judge won't see the image but
        # will attempt to reason from context — degraded but non-fatal)
        return {"text": f"[Image URL — could not fetch for inline display: {image_url}]"}


# ── Response Parsing ───────────────────────────────────────────────────────────

def _extract_text(data: dict) -> str:
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                return part["text"].strip()
    return ""


def _parse_response(
    raw_text: str,
    image_url: str,
    prompt: str,
    content_type: str,
    profile,
    dimensions,
) -> EvaluationResult:
    """Parse the judge's JSON response into an EvaluationResult."""
    try:
        # Strip markdown code fences if present
        clean = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
        clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()
        data = json.loads(clean)
    except json.JSONDecodeError as e:
        return _error_result(image_url, prompt, content_type,
                             f"JSON parse error: {e} — raw: {raw_text[:300]}")

    # Build dimension scores
    dim_map = {d.id: d for d in dimensions}
    dimension_scores: list[DimensionScore] = []
    scores_by_id: dict[str, float] = {}

    for item in data.get("dimension_scores", []):
        dim_id = item.get("dimension_id", "")
        score_raw = item.get("score", 0)
        try:
            score = max(1.0, min(5.0, float(score_raw)))
        except (TypeError, ValueError):
            score = 1.0

        dim = dim_map.get(dim_id)
        dimension_scores.append(DimensionScore(
            dimension_id=dim_id,
            dimension_name=item.get("dimension_name", dim.name if dim else dim_id),
            score=score,
            rationale=item.get("rationale", ""),
        ))
        scores_by_id[dim_id] = score

    # Fill any missing dimensions with score=1 (penalise incomplete responses)
    for dim in dimensions:
        if dim.id not in scores_by_id:
            dimension_scores.append(DimensionScore(
                dimension_id=dim.id,
                dimension_name=dim.name,
                score=1.0,
                rationale="[Score not provided by judge]",
            ))
            scores_by_id[dim.id] = 1.0

    weighted = compute_weighted_score(scores_by_id, content_type)

    try:
        judge_overall = max(1.0, min(5.0, float(data.get("judge_overall", weighted))))
    except (TypeError, ValueError):
        judge_overall = weighted

    return EvaluationResult(
        image_url=image_url,
        prompt=prompt,
        content_type=content_type,
        dimension_scores=dimension_scores,
        scores_by_id=scores_by_id,
        weighted_composite=weighted,
        judge_overall=judge_overall,
        passed=weighted >= profile.pass_threshold,
        strengths=data.get("strengths", [])[:3],
        improvements=data.get("improvements", [])[:3],
        raw_response=raw_text,
    )


def _error_result(image_url: str, prompt: str, content_type: str, error: str) -> EvaluationResult:
    return EvaluationResult(
        image_url=image_url,
        prompt=prompt,
        content_type=content_type,
        dimension_scores=[],
        scores_by_id={},
        weighted_composite=0.0,
        judge_overall=0.0,
        passed=False,
        strengths=[],
        improvements=[],
        error=error,
    )
