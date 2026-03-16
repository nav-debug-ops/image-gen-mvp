from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.generation_service import generate_image
from app.services.providers import get_all_providers
from app.services.asin_lookup import lookup_asin
from app.services.hero_prompt_builder import build_hero_prompt

router = APIRouter()

STYLE_KEYWORDS = {
    "photorealistic": "photorealistic, 8k, professional photography",
    "anime": "anime style, vibrant colors, detailed illustration",
    "watercolor": "watercolor painting, soft colors, artistic",
    "digital_art": "digital art, vibrant, modern",
    "fantasy": "fantasy art, magical, ethereal",
}


def enhance_prompt_text(prompt: str, style: Optional[str] = None) -> str:
    if style and style in STYLE_KEYWORDS:
        return f"{prompt}, {STYLE_KEYWORDS[style]}"
    return f"{prompt}, highly detailed, professional quality, beautiful lighting"


class GenerateRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None
    model: Optional[str] = None
    aspect_ratio: Optional[str] = "1:1"
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    style: Optional[str] = None
    failover: Optional[bool] = True
    reference_image_url: Optional[str] = None


class GenerateResponse(BaseModel):
    success: bool
    generation_id: int
    image_url: Optional[str] = None
    image_id: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    cost_estimate: Optional[float] = None
    duration_ms: Optional[int] = None
    failover_from: Optional[str] = None
    error: Optional[str] = None


@router.post("/", response_model=GenerateResponse)
async def create_generation(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an image from a text prompt."""
    try:
        # Enhance prompt with style if provided
        prompt = request.prompt
        if request.style:
            prompt = f"{prompt}, {request.style} style"

        gen = await generate_image(
            user_id=current_user.id,
            prompt=prompt,
            provider_name=request.provider,
            model=request.model,
            aspect_ratio=request.aspect_ratio,
            width=request.width,
            height=request.height,
            failover=request.failover,
            db=db,
            reference_image_url=request.reference_image_url,
        )

        return GenerateResponse(
            success=True,
            generation_id=gen.id,
            image_url=gen.image_url,
            image_id=gen.image_id,
            provider=gen.provider,
            model=gen.model,
            cost_estimate=gen.cost_estimate,
            duration_ms=gen.duration_ms,
            failover_from=gen.failover_from,
        )
    except HTTPException:
        raise  # Re-raise 429 rate limit errors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class HeroGenerateRequest(BaseModel):
    asin: str
    marketplace: str = "US"
    template_name: str = "Plain White Background"
    aspect_ratio: str = "1:1"


@router.post("/hero", response_model=GenerateResponse)
async def create_hero_generation(
    request: HeroGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an Amazon hero image from an ASIN using dynamic prompt + Imagen 3."""
    if len(request.asin) != 10:
        raise HTTPException(status_code=422, detail="ASIN must be exactly 10 characters")

    try:
        product = await lookup_asin(request.asin, request.marketplace)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not fetch product data: {e}")

    prompt = build_hero_prompt(product, request.template_name)

    try:
        gen = await generate_image(
            user_id=current_user.id,
            prompt=prompt,
            provider_name="gemini",
            model="imagen-4.0-generate-001",
            aspect_ratio=request.aspect_ratio,
            width=1024,
            height=1024,
            failover=True,
            db=db,
        )
        return GenerateResponse(
            success=True,
            generation_id=gen.id,
            image_url=gen.image_url,
            image_id=gen.image_id,
            provider=gen.provider,
            model=gen.model,
            cost_estimate=gen.cost_estimate,
            duration_ms=gen.duration_ms,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance-prompt")
async def enhance_prompt(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Enhance a simple prompt to get better results."""
    enhanced = enhance_prompt_text(request.prompt, request.style)
    return {"original": request.prompt, "enhanced": enhanced}


@router.get("/providers")
async def list_providers(current_user: User = Depends(get_current_user)):
    """List all configured AI providers and their models."""
    providers = get_all_providers()
    result = []

    for name, provider in providers.items():
        result.append({
            "id": name,
            "name": name.capitalize(),
            "available": True,
            "models": provider.get_available_models(),
        })

    return {"providers": result, "default_provider": "replicate"}
