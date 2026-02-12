from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-in-production"

    # JWT
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    # AI Provider Keys
    replicate_api_token: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""

    # Default provider
    default_provider: str = "replicate"

    # Database
    database_url: str = "sqlite+aiosqlite:///./imagegen.db"

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Storage
    storage_path: str = "./generated"

    # Rate Limits
    daily_generation_limit: int = 50
    monthly_generation_limit: int = 1000

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
