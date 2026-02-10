from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-in-production"

    # AI Service
    replicate_api_token: str = ""

    # Database
    database_url: str = "sqlite+aiosqlite:///./imagegen.db"

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Storage
    storage_path: str = "./generated"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
