"""
Storage Service
===============
Abstraction over local filesystem, Cloudflare R2, and AWS S3.
Controlled by STORAGE_BACKEND env var: 'local' | 'r2' | 's3'

Usage:
    from app.services.storage import storage
    url = await storage.save(image_bytes, filename="abc123.webp")
    await storage.delete("abc123.webp")
"""

import os
import uuid
from pathlib import Path
from typing import Optional

from app.config import get_settings

settings = get_settings()


class LocalStorage:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, data: bytes, filename: Optional[str] = None, content_type: str = "image/webp") -> str:
        if not filename:
            ext = content_type.split("/")[-1]
            filename = f"{uuid.uuid4().hex}.{ext}"
        dest = self.base_path / filename
        dest.write_bytes(data)
        return f"/images/{filename}"

    async def delete(self, filename: str) -> None:
        path = self.base_path / filename
        if path.exists():
            path.unlink()

    async def exists(self, filename: str) -> bool:
        return (self.base_path / filename).exists()


class R2Storage:
    """Cloudflare R2 storage via boto3-compatible S3 API."""

    def __init__(self):
        try:
            import boto3
            from botocore.config import Config
            self._s3 = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                config=Config(signature_version="s3v4"),
                region_name="auto",
            )
            self._bucket = settings.r2_bucket_name
            self._public_url = settings.r2_public_url.rstrip("/")
        except ImportError:
            raise RuntimeError("boto3 is required for R2 storage. Run: pip install boto3")

    async def save(self, data: bytes, filename: Optional[str] = None, content_type: str = "image/webp") -> str:
        import asyncio
        if not filename:
            ext = content_type.split("/")[-1]
            filename = f"{uuid.uuid4().hex}.{ext}"
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self._s3.put_object(
                Bucket=self._bucket,
                Key=filename,
                Body=data,
                ContentType=content_type,
            )
        )
        return f"{self._public_url}/{filename}"

    async def delete(self, filename: str) -> None:
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: self._s3.delete_object(Bucket=self._bucket, Key=filename))

    async def exists(self, filename: str) -> bool:
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._s3.head_object(Bucket=self._bucket, Key=filename))
            return True
        except Exception:
            return False


class S3Storage:
    """AWS S3 storage."""

    def __init__(self):
        try:
            import boto3
            self._s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region,
            )
            self._bucket = settings.s3_bucket_name
            self._public_url = settings.s3_public_url.rstrip("/")
        except ImportError:
            raise RuntimeError("boto3 is required for S3 storage. Run: pip install boto3")

    async def save(self, data: bytes, filename: Optional[str] = None, content_type: str = "image/webp") -> str:
        import asyncio
        if not filename:
            ext = content_type.split("/")[-1]
            filename = f"{uuid.uuid4().hex}.{ext}"
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self._s3.put_object(
                Bucket=self._bucket,
                Key=filename,
                Body=data,
                ContentType=content_type,
                ACL="public-read",
            )
        )
        return f"{self._public_url}/{filename}"

    async def delete(self, filename: str) -> None:
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: self._s3.delete_object(Bucket=self._bucket, Key=filename))

    async def exists(self, filename: str) -> bool:
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._s3.head_object(Bucket=self._bucket, Key=filename))
            return True
        except Exception:
            return False


def _create_storage():
    backend = getattr(settings, "storage_backend", "local")
    if backend == "r2":
        return R2Storage()
    if backend == "s3":
        return S3Storage()
    return LocalStorage(settings.storage_path)


# Singleton — import and use directly
storage = _create_storage()
