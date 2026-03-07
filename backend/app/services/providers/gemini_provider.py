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
            {"id": "gemini-2.0-flash-exp-image-generation", "name": "Gemini 2.0 Flash Image", "description": "Fast native image generation"},
            {"id": "gemini-2.5-flash-image", "name": "Gemini 2.5 Flash Image", "description": "High quality native generation"},
            {"id": "imagen-4.0-fast-generate-001", "name": "Imagen 4 Fast", "description": "Fast, high quality"},
            {"id": "imagen-4.0-generate-001", "name": "Imagen 4", "description": "Best quality"},
        ]

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        aspect_ratio: str = "1:1",
        width: int = 1024,
        height: int = 1024,
        reference_image_url: Optional[str] = None,
        **kwargs,
    ) -> GenerationResult:
        model_id = model or "gemini-2.0-flash-exp-image-generation"

        if model_id.startswith("imagen"):
            return await self._generate_imagen(prompt, model_id, aspect_ratio)
        elif reference_image_url:
            return await self._edit_with_image(prompt, model_id, reference_image_url)
        else:
            return await self._generate_native(prompt, model_id)

    async def _fetch_image_as_base64(self, image_url: str) -> tuple[str, str]:
        """Download an image from URL and return (base64_data, mime_type)."""
        async with httpx.AsyncClient(timeout=30.0, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.amazon.com/",
        }) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            content_type = response.headers.get("content-type", "image/jpeg").split(";")[0]
            return base64.b64encode(response.content).decode("utf-8"), content_type

    async def _edit_with_image(self, prompt: str, model_id: str, reference_image_url: str) -> GenerationResult:
        """Gemini image editing — uses the actual product photo as input and transforms it."""
        image_b64, mime_type = await self._fetch_image_as_base64(reference_image_url)

        edit_prompt = (
            f"You are a professional Amazon product photographer. "
            f"Using the product shown in this image as the EXACT subject, "
            f"create a new professional Amazon main listing image: {prompt}. "
            f"Keep the product identical — same shape, color, branding, labels, and design. "
            f"Only change the background, lighting, and composition as specified. "
            f"Output must be photorealistic, not illustrated or stylized."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={self.api_key}"
        request_body = {
            "contents": [{
                "parts": [
                    {"inlineData": {"mimeType": mime_type, "data": image_b64}},
                    {"text": edit_prompt},
                ]
            }],
            "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=request_body)
            if response.status_code != 200:
                error = response.json()
                raise Exception(error.get("error", {}).get("message", f"Gemini edit error: {response.status_code}"))
            data = response.json()

        image_base64 = None
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if part.get("inlineData", {}).get("mimeType", "").startswith("image/"):
                    image_base64 = part["inlineData"]["data"]
                    break
            if image_base64:
                break

        if not image_base64:
            raise Exception("No image returned from Gemini edit. Try a different prompt.")

        return GenerationResult(
            image_url=self._save_base64_image(image_base64),
            provider=self.provider_name,
            model=model_id,
            cost_estimate=0.0,
        )

    async def _generate_native(self, prompt: str, model_id: str) -> GenerationResult:
        """Gemini 2.0 native text-to-image generation."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={self.api_key}"

        request_body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["IMAGE", "TEXT"],
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
        """Google Imagen API — uses API key auth (AI Studio key)."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:predict?key={self.api_key}"

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
                headers={"Content-Type": "application/json"},
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

        cost = 0.03 if "ultra" in model_id else (0.02 if "fast" not in model_id else 0.01)

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
