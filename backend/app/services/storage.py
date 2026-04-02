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

    async def health_check(self) -> dict:
        try:
            test_file = self.base_path / "_healthcheck.tmp"
            test_file.write_bytes(b"ok")
            test_file.unlink()
            return {"ok": True, "backend": "local", "path": str(self.base_path)}
        except Exception as e:
            return {"ok": False, "backend": "local", "error": str(e)}


class R2Storage:
    """Cloudflare R2 storage via boto3-compatible S3 API."""

    def __init__(self):
        try:
            import boto3
            from botocore.config import Config
            if not settings.r2_account_id:
                raise RuntimeError("R2_ACCOUNT_ID is not set. Check your .env file.")
            if not settings.r2_access_key_id or not settings.r2_secret_access_key:
                raise RuntimeError("R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY is not set.")
            if not settings.r2_public_url:
                raise RuntimeError("R2_PUBLIC_URL is not set — images won't be publicly accessible.")
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
        last_err = None
        for attempt in range(3):
            try:
                await loop.run_in_executor(
                    None,
                    lambda: self._s3.put_object(
                        Bucket=self._bucket,
                        Key=filename,
                        Body=data,
                        ContentType=content_type,
                        CacheControl="max-age=31536000, immutable",
                    )
                )
                return f"{self._public_url}/{filename}"
            except Exception as e:
                last_err = e
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
        raise last_err

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

    async def health_check(self) -> dict:
        import asyncio
        test_key = "_healthcheck.tmp"
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._s3.put_object(
                Bucket=self._bucket, Key=test_key, Body=b"ok", ContentType="text/plain"
            ))
            await loop.run_in_executor(None, lambda: self._s3.delete_object(Bucket=self._bucket, Key=test_key))
            return {"ok": True, "backend": "r2", "bucket": self._bucket, "public_url": self._public_url}
        except Exception as e:
            return {"ok": False, "backend": "r2", "error": str(e)}


class S3Storage:
    """AWS S3 storage."""

    def __init__(self):
        try:
            import boto3
            if not settings.aws_access_key_id or not settings.aws_secret_access_key:
                raise RuntimeError("AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY is not set.")
            if not settings.s3_public_url:
                raise RuntimeError("S3_PUBLIC_URL is not set — images won't be publicly accessible.")
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
        last_err = None
        for attempt in range(3):
            try:
                await loop.run_in_executor(
                    None,
                    lambda: self._s3.put_object(
                        Bucket=self._bucket,
                        Key=filename,
                        Body=data,
                        ContentType=content_type,
                        CacheControl="max-age=31536000, immutable",
                    )
                )
                return f"{self._public_url}/{filename}"
            except Exception as e:
                last_err = e
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
        raise last_err

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

    async def health_check(self) -> dict:
        import asyncio
        test_key = "_healthcheck.tmp"
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._s3.put_object(
                Bucket=self._bucket, Key=test_key, Body=b"ok", ContentType="text/plain"
            ))
            await loop.run_in_executor(None, lambda: self._s3.delete_object(Bucket=self._bucket, Key=test_key))
            return {"ok": True, "backend": "s3", "bucket": self._bucket, "region": settings.aws_region}
        except Exception as e:
            return {"ok": False, "backend": "s3", "error": str(e)}


def _create_storage():
    backend = getattr(settings, "storage_backend", "local")
    if backend == "r2":
        return R2Storage()
    if backend == "s3":
        return S3Storage()
    return LocalStorage(settings.storage_path)


# Singleton — import and use directly
storage = _create_storage()
