from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.database import create_tables, engine
from app.services.providers import init_providers
from app.api import auth, generate, images, prompts, usage, asin, keywords, eval as eval_api, copywriter, campaigns, content, drafts
from app.api import calibration as calibration_api
from app.models import content_draft  # ensure table is created on startup  # noqa: F401
from app.models import calibration as calibration_model  # noqa: F401

settings = get_settings()

# Ensure storage directory exists before StaticFiles mount
os.makedirs(settings.storage_path, exist_ok=True)


async def run_migrations():
    """
    Apply column-level migrations that CREATE TABLE IF NOT EXISTS won't handle.
    Each ALTER TABLE is wrapped in a try/except so it's safe to run on every startup.
    """
    migrations = [
        # Added after initial schema — eval score JSON stored on the generation record
        "ALTER TABLE generations ADD COLUMN eval_score TEXT",
        # Added for content draft persistence
        "ALTER TABLE generations ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
    ]
    async with engine.begin() as conn:
        for sql in migrations:
            try:
                await conn.execute(__import__('sqlalchemy').text(sql))
            except Exception:
                pass  # column already exists — safe to ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    await run_migrations()
    init_providers()
    print(f"[startup] Database tables created + migrations applied")
    print(f"[startup] Storage backend: {settings.storage_backend}")
    if settings.storage_backend == "local":
        print(f"[startup] Storage path: {settings.storage_path}")
        if settings.app_env == "production":
            print("[startup] WARNING: STORAGE_BACKEND=local in production. Images will be lost on redeploy. Set STORAGE_BACKEND=r2 or s3.")
    elif settings.storage_backend == "r2":
        if not settings.r2_public_url:
            print("[startup] WARNING: R2_PUBLIC_URL is not set. Generated image URLs will be broken.")
        else:
            print(f"[startup] R2 bucket: {settings.r2_bucket_name} → {settings.r2_public_url}")
    elif settings.storage_backend == "s3":
        if not settings.s3_public_url:
            print("[startup] WARNING: S3_PUBLIC_URL is not set. Generated image URLs will be broken.")
        else:
            print(f"[startup] S3 bucket: {settings.s3_bucket_name} ({settings.aws_region}) → {settings.s3_public_url}")
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
app.include_router(asin.router, prefix="/api/asin", tags=["ASIN"])
app.include_router(keywords.router, prefix="/api/keywords", tags=["Keywords"])
app.include_router(eval_api.router, prefix="/api/eval", tags=["Eval"])
app.include_router(copywriter.router, prefix="/api/copywriter", tags=["Copywriter"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(content.router, prefix="/api/content", tags=["Content"])
app.include_router(drafts.router, prefix="/api/drafts", tags=["Drafts"])
app.include_router(calibration_api.router, prefix="/api/eval/calibration", tags=["Calibration"])


@app.get("/")
async def root():
    return {"message": "ImageGen MVP API", "status": "running", "version": "0.2.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
