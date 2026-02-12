import httpx
from typing import Optional

from app.config import get_settings
from app.services.providers.base import ImageProvider, GenerationResult

settings = get_settings()

COST_MAP = {
    "dall-e-3": 0.04,
    "dall-e-3-hd": 0.08,
    "dall-e-2": 0.02,
}

SIZE_MAP = {
    "1:1": "1024x1024",
    "4:3": "1024x1024",
    "3:2": "1792x1024",
}


class OpenAIProvider(ImageProvider):
    provider_name = "openai"

    def __init__(self):
        self.api_key = settings.openai_api_key

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_available_models(self) -> list:
        return [
            {"id": "dall-e-3", "name": "DALL-E 3", "description": "Latest model, high quality"},
            {"id": "dall-e-2", "name": "DALL-E 2", "description": "Supports variations"},
        ]

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        aspect_ratio: str = "1:1",
        width: int = 1024,
        height: int = 1024,
        **kwargs,
    ) -> GenerationResult:
        model_id = model or "dall-e-3"
        size = SIZE_MAP.get(aspect_ratio, "1024x1024")
        quality = kwargs.get("quality", "standard")

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model_id,
                    "prompt": prompt,
                    "n": 1,
                    "size": size,
                    "quality": quality,
                    "response_format": "url",
                },
            )

            if response.status_code != 200:
                error = response.json()
                raise Exception(error.get("error", {}).get("message", f"OpenAI API error: {response.status_code}"))

            data = response.json()

        cost_key = f"{model_id}-hd" if quality == "hd" else model_id

        return GenerationResult(
            image_url=data["data"][0]["url"],
            provider=self.provider_name,
            model=model_id,
            cost_estimate=COST_MAP.get(cost_key, 0.04),
            metadata={"revised_prompt": data["data"][0].get("revised_prompt")},
        )
