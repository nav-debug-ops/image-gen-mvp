from fastapi import APIRouter
from typing import List

router = APIRouter()

# Beginner-friendly prompt templates and suggestions
STYLE_PRESETS = {
    "photorealistic": "photorealistic, highly detailed, professional photography, 8k",
    "anime": "anime style, vibrant colors, detailed illustration",
    "watercolor": "watercolor painting, soft colors, artistic, flowing",
    "oil_painting": "oil painting, classical art style, textured brushstrokes",
    "digital_art": "digital art, vibrant, modern illustration",
    "sketch": "pencil sketch, hand-drawn, detailed linework",
    "3d_render": "3D render, octane render, highly detailed, realistic lighting",
    "cartoon": "cartoon style, bold colors, fun, playful",
    "minimalist": "minimalist, clean, simple, modern design",
    "fantasy": "fantasy art, magical, ethereal, detailed"
}

PROMPT_STARTERS = [
    {"category": "Nature", "prompts": [
        "A peaceful mountain lake at sunset",
        "Cherry blossoms in full bloom",
        "A cozy cabin in a snowy forest"
    ]},
    {"category": "Animals", "prompts": [
        "A majestic lion resting under a tree",
        "Colorful tropical fish in coral reef",
        "A cute puppy playing in autumn leaves"
    ]},
    {"category": "Fantasy", "prompts": [
        "A magical floating castle in the clouds",
        "An enchanted forest with glowing mushrooms",
        "A dragon perched on a mountain peak"
    ]},
    {"category": "Food", "prompts": [
        "A delicious stack of pancakes with berries",
        "Fresh sushi platter on wooden board",
        "A steaming cup of coffee with latte art"
    ]},
    {"category": "Architecture", "prompts": [
        "A futuristic city skyline at night",
        "A cozy Mediterranean village street",
        "Ancient temple ruins in the jungle"
    ]}
]


@router.get("/styles")
async def get_styles():
    """Get available style presets for beginners."""
    return {
        "styles": [
            {"id": key, "name": key.replace("_", " ").title(), "keywords": value}
            for key, value in STYLE_PRESETS.items()
        ]
    }


@router.get("/suggestions")
async def get_suggestions():
    """Get prompt suggestions organized by category."""
    return {"categories": PROMPT_STARTERS}


@router.get("/tips")
async def get_tips():
    """Get tips for writing better prompts."""
    return {
        "tips": [
            "Be specific - describe colors, lighting, and mood",
            "Include the subject, setting, and style",
            "Use descriptive adjectives (vibrant, peaceful, dramatic)",
            "Mention the time of day for outdoor scenes",
            "Add quality keywords like 'detailed' or 'professional'",
            "Try combining unexpected elements for unique results"
        ]
    }
