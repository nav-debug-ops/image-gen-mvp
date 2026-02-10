from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.api import generate, images, prompts

settings = get_settings()

app = FastAPI(
    title="ImageGen MVP",
    description="Simple image generation API for everyone",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure storage directory exists
os.makedirs(settings.storage_path, exist_ok=True)

# Mount static files for generated images
app.mount("/images", StaticFiles(directory=settings.storage_path), name="images")

# Include routers
app.include_router(generate.router, prefix="/api/generate", tags=["Generation"])
app.include_router(images.router, prefix="/api/images", tags=["Images"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["Prompts"])


@app.get("/")
async def root():
    return {"message": "ImageGen MVP API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
