from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.generation_service import generate_image
from app.services.providers import get_all_providers

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
