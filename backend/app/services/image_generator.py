import replicate
import httpx
import os
import json
import uuid
from datetime import datetime
from typing import Optional

from app.config import get_settings

settings = get_settings()


class ImageGenerator:
    """Service for generating images using AI models."""

    def __init__(self):
        self.client = replicate.Client(api_token=settings.replicate_api_token)

        # Default model - Flux Schnell (fast and good quality)
        self.model = "black-forest-labs/flux-schnell"

    async def generate(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        model: Optional[str] = None
    ) -> dict:
        """Generate an image from a text prompt."""

        # Map aspect ratios to dimensions
        dimensions = {
            "1:1": (1024, 1024),
            "16:9": (1344, 768),
            "9:16": (768, 1344),
            "4:3": (1152, 896),
            "3:4": (896, 1152)
        }

        width, height = dimensions.get(aspect_ratio, (1024, 1024))

        # Run the model
        output = self.client.run(
            model or self.model,
            input={
                "prompt": prompt,
                "width": width,
                "height": height,
                "num_outputs": 1,
                "output_format": "png"
            }
        )

        # Get the image URL from output
        image_url = output[0] if isinstance(output, list) else output

        # Download and save locally
        image_id = str(uuid.uuid4())[:8]
        local_path = await self._save_image(image_url, image_id)

        # Save metadata
        self._save_metadata(image_id, prompt, aspect_ratio, local_path)

        return {
            "id": image_id,
            "url": f"/images/{image_id}.png",
            "prompt": prompt
        }

    async def _save_image(self, url: str, image_id: str) -> str:
        """Download and save image locally."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()

            filepath = os.path.join(settings.storage_path, f"{image_id}.png")
            with open(filepath, "wb") as f:
                f.write(response.content)

            return filepath

    def _save_metadata(
        self,
        image_id: str,
        prompt: str,
        aspect_ratio: str,
        filepath: str
    ):
        """Save image metadata to JSON file."""
        metadata_file = os.path.join(settings.storage_path, "metadata.json")

        # Load existing metadata
        if os.path.exists(metadata_file):
            with open(metadata_file, "r") as f:
                metadata = json.load(f)
        else:
            metadata = []

        # Add new entry
        metadata.append({
            "id": image_id,
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "filepath": filepath,
            "created_at": datetime.utcnow().isoformat()
        })

        # Save updated metadata
        with open(metadata_file, "w") as f:
            json.dump(metadata, f, indent=2)

    def enhance_prompt(self, prompt: str, style: Optional[str] = None) -> str:
        """Enhance a simple prompt with quality keywords."""
        enhancements = [
            "highly detailed",
            "professional quality",
            "beautiful lighting"
        ]

        style_keywords = {
            "photorealistic": "photorealistic, 8k, professional photography",
            "anime": "anime style, vibrant colors, detailed illustration",
            "watercolor": "watercolor painting, soft colors, artistic",
            "digital_art": "digital art, vibrant, modern",
            "fantasy": "fantasy art, magical, ethereal"
        }

        enhanced = prompt

        if style and style in style_keywords:
            enhanced = f"{prompt}, {style_keywords[style]}"
        else:
            enhanced = f"{prompt}, {', '.join(enhancements)}"

        return enhanced
