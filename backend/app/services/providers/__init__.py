from app.services.providers.replicate_provider import ReplicateProvider
from app.services.providers.openai_provider import OpenAIProvider
from app.services.providers.gemini_provider import GeminiProvider

_providers = {}

FAILOVER_ORDER = ["replicate", "gemini", "openai"]


def init_providers():
    """Initialize all providers. Call on app startup."""
    for ProviderClass in [ReplicateProvider, OpenAIProvider, GeminiProvider]:
        provider = ProviderClass()
        if provider.is_configured():
            _providers[provider.provider_name] = provider
            print(f"[startup] Provider configured: {provider.provider_name}")

    if not _providers:
        print("[startup] WARNING: No AI providers configured. Set API keys in .env")


def get_provider(name: str):
    return _providers.get(name)


def get_all_providers():
    return _providers


def get_configured_provider_names():
    return list(_providers.keys())
