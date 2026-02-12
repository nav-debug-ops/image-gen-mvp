import asyncio
from typing import Optional

from app.config import get_settings
from app.services.providers.base import ImageProvider, GenerationResult

settings = get_settings()

COST_MAP = {
    "black-forest-labs/flux-schnell": 0.003,
    "black-forest-labs/flux-1.1-pro": 0.055,
    "black-forest-labs/flux-redux-schnell": 0.003,
    "stability-ai/sdxl": 0.004,
}


class ReplicateProvider(ImageProvider):
    provider_name = "replicate"

    def __init__(self):
        self.token = settings.replicate_api_token
        self.client = None

    def _get_client(self):
        if self.client is None and self.token:
            import replicate
            self.client = replicate.Client(api_token=self.token)
        return self.client

    def is_configured(self) -> bool:
        return bool(self.token)

    def get_available_models(self) -> list:
        return [
            {"id": "black-forest-labs/flux-schnell", "name": "Flux Schnell", "description": "Fast, high quality"},
            {"id": "black-forest-labs/flux-1.1-pro", "name": "Flux 1.1 Pro", "description": "Best quality, slower"},
            {"id": "stability-ai/sdxl", "name": "SDXL", "description": "Stable Diffusion XL"},
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
        model_id = model or "black-forest-labs/flux-schnell"

        if "flux" in model_id:
            input_params = {
                "prompt": prompt,
                "num_outputs": 1,
                "aspect_ratio": aspect_ratio,
                "output_format": "webp",
                "output_quality": 90,
            }
        else:
            input_params = {
                "prompt": prompt,
                "width": width,
                "height": height,
                "num_outputs": 1,
            }

        client = self._get_client()
        if not client:
            raise RuntimeError("Replicate client not configured")

        # Run in thread pool since replicate client is synchronous
        output = await asyncio.to_thread(
            client.run,
            model_id,
            input=input_params,
        )

        image_url = output[0] if isinstance(output, list) else str(output)

        return GenerationResult(
            image_url=image_url,
            provider=self.provider_name,
            model=model_id,
            cost_estimate=COST_MAP.get(model_id, 0.003),
        )
