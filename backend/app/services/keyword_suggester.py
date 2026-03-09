"""
Keyword suggestion service for Amazon listing secondary image types.
Uses Gemini REST API (text-only) to generate type-specific keyword chips.
Results are cached in-memory per (asin, image_type) for 1 hour.
"""
import json
import re
import time

import httpx

from app.config import get_settings

settings = get_settings()

# ── In-memory cache ────────────────────────────────────────────────────────────
_cache: dict[str, tuple[float, list[str]]] = {}
_CACHE_TTL = 3600  # 1 hour


def _cache_key(asin: str, image_type: str) -> str:
    return f"{asin.upper()}:{image_type}"


def _get_cached(asin: str, image_type: str) -> list[str] | None:
    key = _cache_key(asin, image_type)
    if key in _cache:
        ts, keywords = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            return keywords
        del _cache[key]
    return None


def _set_cached(asin: str, image_type: str, keywords: list[str]) -> None:
    _cache[_cache_key(asin, image_type)] = (time.time(), keywords)


# ── Per-type prompt instructions ───────────────────────────────────────────────
_TYPE_INSTRUCTIONS: dict[str, str] = {
    "benefits": (
        "List 8–10 short keyword phrases (2–6 words each) describing the key CUSTOMER BENEFITS "
        "of this product. Focus on emotional and functional outcomes, not specs. "
        "Examples: '24-hour cold retention', 'leak-proof guarantee', 'eco-friendly materials'."
    ),
    "features": (
        "List 8–10 short keyword phrases (2–6 words each) describing the most important "
        "TECHNICAL FEATURES and specifications. Focus on concrete specs and design details. "
        "Examples: 'stainless steel body', 'BPA-free certified', 'wide mouth opening'."
    ),
    "comparison": (
        "List 8–10 short keyword phrases (2–6 words each) describing the strongest "
        "COMPETITIVE ADVANTAGES over generic alternatives. Frame as superiority claims. "
        "Examples: '3x longer lasting', 'premium vs plastic alternatives', 'lifetime warranty included'."
    ),
    "lifestyle": (
        "List 8–10 short keyword phrases (2–6 words each) describing the best LIFESTYLE SCENARIOS, "
        "target users, or real-life settings for this product. "
        "Examples: 'busy gym-goer', 'morning commute ready', 'outdoor hiking trail', 'home office setup'."
    ),
    "quality": (
        "List 8–10 short keyword phrases (2–6 words each) describing QUALITY SIGNALS, "
        "certifications, materials, and trust indicators for this product. "
        "Examples: 'FDA approved', 'food-grade stainless steel', 'military-grade construction', '5-year warranty'."
    ),
    "howto": (
        "List 6–8 short ACTION STEP phrases (3–7 words each) describing the step-by-step "
        "instructions for using this product. Use imperative verbs. "
        "Examples: 'Fill with your favorite drink', 'Secure the lid tightly', 'Enjoy anywhere anytime'."
    ),
}


async def suggest_keywords(
    asin: str,
    image_type: str,
    product: dict,
) -> list[str]:
    """
    Generate keyword chip suggestions for a given ASIN + image type.
    Returns cached results if available, otherwise calls Gemini.
    Falls back to bullet extraction if Gemini fails.
    """
    cached = _get_cached(asin, image_type)
    if cached is not None:
        return cached

    title = product.get("title", "this product")
    brand = product.get("brand", "")
    bullets = product.get("bullets", [])
    category = product.get("category", "")

    instruction = _TYPE_INSTRUCTIONS.get(
        image_type,
        "List 8–10 short keyword phrases (2–6 words each) most relevant to this product image.",
    )

    bullets_text = (
        "\n".join(f"• {b}" for b in bullets[:6])
        if bullets
        else "No bullet points available."
    )

    gemini_prompt = (
        f"You are an Amazon listing image expert.\n\n"
        f"Product: {title}\n"
        f"Brand: {brand}\n"
        f"Category: {category}\n"
        f"Product listing bullets:\n{bullets_text}\n\n"
        f"Task: {instruction}\n\n"
        f"Return ONLY a valid JSON array of strings. No markdown, no explanation.\n"
        f'Example: ["keyword one", "keyword two", "keyword three"]'
    )

    keywords = await _call_gemini(gemini_prompt)
    if not keywords:
        keywords = _extract_from_bullets(bullets, image_type)

    _set_cached(asin, image_type, keywords)
    return keywords


async def _call_gemini(prompt: str) -> list[str]:
    """Call Gemini 2.0 Flash text model and parse JSON array response."""
    if not settings.gemini_api_key:
        return []

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, json=body)
            if resp.status_code != 200:
                print(f"[KEYWORDS] Gemini error {resp.status_code}: {resp.text[:200]}")
                return []
            data = resp.json()

        text = ""
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "text" in part:
                    text = part["text"].strip()
                    break
            if text:
                break

        # Extract JSON array from text (handle markdown code blocks + truncation)
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > start:
            try:
                parsed = json.loads(text[start:end])
                if isinstance(parsed, list):
                    return [str(k).strip() for k in parsed if k and str(k).strip()][:10]
            except json.JSONDecodeError:
                # Truncated — extract partial strings with regex
                partial = re.findall(r'"([^"]+)"', text[start:])
                if partial:
                    return [p.strip() for p in partial if p.strip()][:10]

    except Exception as e:
        print(f"[KEYWORDS] Gemini call failed: {e}")

    return []


def _extract_from_bullets(bullets: list[str], image_type: str) -> list[str]:
    """
    Programmatic fallback: extract short keyword phrases from product bullets.
    Produces reasonable chips even when Gemini is unavailable.
    """
    phrases: list[str] = []
    for bullet in bullets[:6]:
        # Split on punctuation separators to get sub-clauses
        segments = re.split(r"[—–:;,]", bullet)
        for seg in segments:
            seg = seg.strip()
            words = seg.split()
            if 2 <= len(words) <= 7:
                phrases.append(seg[:60])
            elif len(words) > 7:
                phrases.append(" ".join(words[:5]))

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for p in phrases:
        key = p.lower()
        if key not in seen:
            seen.add(key)
            unique.append(p)

    if unique:
        return unique[:8]

    # Last-resort defaults per type
    defaults: dict[str, list[str]] = {
        "benefits": ["Premium quality", "Built to last", "Easy to use", "Great value", "Trusted brand"],
        "features": ["Premium materials", "Precision engineering", "Durable construction", "Ergonomic design"],
        "comparison": ["Better than competitors", "Superior quality", "Best in class", "Industry leading"],
        "lifestyle": ["Everyday use", "Active lifestyle", "Home and travel", "Perfect gift"],
        "quality": ["Premium grade materials", "Quality certified", "Built to last", "Rigorously tested"],
        "howto": ["Easy setup", "Simple to use", "Step by step", "Ready in minutes"],
    }
    return defaults.get(image_type, ["Premium quality", "Easy to use", "Great value", "Trusted brand"])
