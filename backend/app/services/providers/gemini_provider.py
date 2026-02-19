from __future__ import annotations

import httpx
import base64
import uuid
import os
from typing import Optional

from app.config import get_settings
from app.services.providers.base import ImageProvider, GenerationResult

settings = get_settings()


class GeminiProvider(ImageProvider):
    provider_name = "gemini"

    def __init__(self):
        self.api_key = settings.gemini_api_key

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_available_models(self) -> list:
        return [
            {"id": "gemini-2.0-flash-exp-image-generation", "name": "Gemini 2.0 Flash", "description": "Native image generation"},
            {"id": "imagen-3.0-generate-002", "name": "Imagen 3", "description": "High quality Google model"},
            {"id": "imagen-3.0-fast-generate-001", "name": "Imagen 3 Fast", "description": "Faster generation"},
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
        model_id = model or "gemini-2.0-flash-exp-image-generation"

        if model_id.startswith("imagen"):
            return await self._generate_imagen(prompt, model_id, aspect_ratio)
        else:
            return await self._generate_native(prompt, model_id)

    async def _generate_native(self, prompt: str, model_id: str) -> GenerationResult:
        """Gemini 2.0 native image generation."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={self.api_key}"

        request_body = {
            "contents": [{"parts": [{"text": f"Generate {prompt}"}]}],
            "generationConfig": {
                "response_modalities": ["Text", "Image"],
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=request_body)

            if response.status_code != 200:
                error = response.json()
                raise Exception(error.get("error", {}).get("message", f"Gemini API error: {response.status_code}"))

            data = response.json()

        # Extract image from response
        image_base64 = None
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if part.get("inlineData", {}).get("mimeType", "").startswith("image/"):
                    image_base64 = part["inlineData"]["data"]
                    break
            if image_base64:
                break

        if not image_base64:
            raise Exception("No image generated. Try a different prompt.")

        # Save base64 to file and return local URL
        image_url = self._save_base64_image(image_base64)

        return GenerationResult(
            image_url=image_url,
            provider=self.provider_name,
            model=model_id,
            cost_estimate=0.0,  # Free during preview
        )

    async def _generate_imagen(self, prompt: str, model_id: str, aspect_ratio: str) -> GenerationResult:
        """Google Imagen API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:predict"

        request_body = {
            "instances": [{"prompt": prompt}],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": aspect_ratio,
                "safetyFilterLevel": "block_few",
                "personGeneration": "allow_adult",
                "outputOptions": {"mimeType": "image/png"},
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key,
                },
                json=request_body,
            )

            if response.status_code != 200:
                error = response.json()
                raise Exception(error.get("error", {}).get("message", f"Imagen API error: {response.status_code}"))

            data = response.json()

        image_data = (
            data.get("predictions", [{}])[0].get("bytesBase64Encoded")
            or data.get("predictions", [{}])[0].get("image", {}).get("bytesBase64Encoded")
        )

        if not image_data:
            raise Exception("No image returned from Imagen API")

        image_url = self._save_base64_image(image_data)

        cost = 0.02 if "fast" not in model_id else 0.01

        return GenerationResult(
            image_url=image_url,
            provider=self.provider_name,
            model=model_id,
            cost_estimate=cost,
        )

    def _save_base64_image(self, base64_data: str) -> str:
        """Save base64 image data to file and return the local path."""
        image_id = str(uuid.uuid4())[:8]
        filepath = os.path.join(settings.storage_path, f"{image_id}.png")
        os.makedirs(settings.storage_path, exist_ok=True)

        with open(filepath, "wb") as f:
            f.write(base64.b64decode(base64_data))

        return f"/images/{image_id}.png"
