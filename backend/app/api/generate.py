from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.image_generator import ImageGenerator

router = APIRouter()
generator = ImageGenerator()


class GenerateRequest(BaseModel):
    prompt: str
    style: Optional[str] = None  # e.g., "photorealistic", "anime", "watercolor"
    aspect_ratio: Optional[str] = "1:1"  # "1:1", "16:9", "9:16"


class GenerateResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    image_id: Optional[str] = None
    error: Optional[str] = None


@router.post("/", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """Generate an image from a text prompt."""
    try:
        # Enhance prompt for beginners (add style if specified)
        enhanced_prompt = request.prompt
        if request.style:
            enhanced_prompt = f"{request.prompt}, {request.style} style"

        result = await generator.generate(
            prompt=enhanced_prompt,
            aspect_ratio=request.aspect_ratio
        )

        return GenerateResponse(
            success=True,
            image_url=result["url"],
            image_id=result["id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance-prompt")
async def enhance_prompt(request: GenerateRequest):
    """Enhance a simple prompt to get better results."""
    enhanced = generator.enhance_prompt(request.prompt, request.style)
    return {"original": request.prompt, "enhanced": enhanced}
