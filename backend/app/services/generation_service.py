from __future__ import annotations

from typing import Optional
import time
import uuid
import os
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.generation import Generation
from app.services.rate_limiter import check_rate_limit
from app.services.providers import get_provider, get_all_providers, FAILOVER_ORDER

settings = get_settings()


async def download_and_save(image_url: str) -> tuple[str, str]:
    """Download image from URL and save locally. Returns (image_id, local_url)."""
    image_id = str(uuid.uuid4())[:8]
    filepath = os.path.join(settings.storage_path, f"{image_id}.png")
    os.makedirs(settings.storage_path, exist_ok=True)

    # If it's already a local path, skip download
    if image_url.startswith("/images/"):
        return image_url.split("/")[-1].replace(".png", ""), image_url

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(image_url)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            f.write(response.content)

    return image_id, f"/images/{image_id}.png"


async def generate_image(
    user_id: int,
    prompt: str,
    provider_name: Optional[str],
    model: Optional[str],
    aspect_ratio: str,
    width: int,
    height: int,
    failover: bool,
    auth_token: Optional[str] = None,
    db: AsyncSession = None,
) -> Generation:
    """Orchestrate image generation with rate limiting, provider selection, and failover."""

    # 1. Check rate limits
    await check_rate_limit(user_id, db)

    # 2. Build provider list
    providers_to_try = []
    if provider_name:
        providers_to_try.append(provider_name)

    if failover:
        for p in FAILOVER_ORDER:
            if p not in providers_to_try and get_provider(p):
                providers_to_try.append(p)

    # If no specific provider, use all configured
    if not providers_to_try:
        providers_to_try = [p for p in FAILOVER_ORDER if get_provider(p)]

    if not providers_to_try:
        raise Exception("No AI providers configured. Set API keys in backend .env")

    # 3. Create pending generation record
    gen = Generation(
        user_id=user_id,
        prompt=prompt,
        provider=providers_to_try[0],
        model=model or "default",
        status="processing",
        aspect_ratio=aspect_ratio,
        width=width,
        height=height,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)

    # 4. Try each provider
    last_error = None
    failover_from = None

    for pname in providers_to_try:
        provider = get_provider(pname)
        if not provider:
            continue

        try:
            start = time.time()
            result = await provider.generate(
                prompt=prompt,
                model=model if pname == providers_to_try[0] else None,
                aspect_ratio=aspect_ratio,
                width=width,
                height=height,
                auth_token=auth_token,
            )
            duration = int((time.time() - start) * 1000)

            # Download and save image locally if it's a remote URL
            image_id, local_url = await download_and_save(result.image_url)

            # Update generation record
            gen.status = "completed"
            gen.provider = pname
            gen.model = result.model
            gen.image_url = local_url
            gen.image_id = image_id
            gen.cost_estimate = result.cost_estimate
            gen.duration_ms = duration
            gen.failover_from = failover_from
            await db.commit()

            return gen

        except Exception as e:
            failover_from = pname
            last_error = e
            continue

    # All providers failed
    gen.status = "failed"
    gen.error_message = str(last_error)
    await db.commit()
    raise Exception(f"All providers failed. Last error: {last_error}")
