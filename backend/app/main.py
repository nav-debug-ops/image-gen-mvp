from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.database import create_tables
from app.services.providers import init_providers
from app.api import auth, generate, images, prompts, usage

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    os.makedirs(settings.storage_path, exist_ok=True)
    init_providers()
    print(f"[startup] Database tables created")
    print(f"[startup] Storage path: {settings.storage_path}")
    yield
    # Shutdown


app = FastAPI(
    title="ImageGen MVP",
    description="Secure image generation proxy API",
    version="0.2.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for generated images
app.mount("/images", StaticFiles(directory=settings.storage_path), name="images")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(generate.router, prefix="/api/generate", tags=["Generation"])
app.include_router(images.router, prefix="/api/images", tags=["Images"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["Prompts"])
app.include_router(usage.router, prefix="/api/usage", tags=["Usage"])


@app.get("/")
async def root():
    return {"message": "ImageGen MVP API", "status": "running", "version": "0.2.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
