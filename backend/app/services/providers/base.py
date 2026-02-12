from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class GenerationResult:
    image_url: str
    provider: str
    model: str
    cost_estimate: float = 0.0
    duration_ms: int = 0
    metadata: dict = field(default_factory=dict)


class ImageProvider(ABC):
    provider_name: str = ""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        aspect_ratio: str = "1:1",
        width: int = 1024,
        height: int = 1024,
        **kwargs,
    ) -> GenerationResult:
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def get_available_models(self) -> list:
        pass
