"""
Amazon Listing Copywriter Service
==================================
Uses Gemini 2.5 Flash to generate optimized Amazon listing copy.
Fetches live product data via ASIN lookup, then builds a structured
prompt and returns 3 title variants, 5 bullets, description, and
search terms — all compliant with Amazon's listing guidelines.
"""

import json
import re

import httpx

from app.config import get_settings
from app.services.asin_lookup import lookup_asin

settings = get_settings()

_GEMINI_MODEL = "gemini-2.5-flash"
_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{_GEMINI_MODEL}:generateContent?key={{key}}"
)

_TONE_DESCRIPTIONS: dict[str, str] = {
    "professional":   "corporate, authoritative, and trustworthy",
    "witty":          "clever, playful, and memorable",
    "friendly":       "warm, approachable, and conversational",
    "persuasive":     "compelling, action-oriented, and urgent",
    "informative":    "educational, detailed, and factual",
    "empathetic":     "understanding, supportive, and caring",
    "casual":         "relaxed, everyday, and relatable",
    "formal":         "proper, respectful, and traditional",
    "confident":      "bold, assured, and strong",
    "direct":         "straightforward, no-nonsense, and clear",
    "encouraging":    "motivating, positive, and uplifting",
    "neutral":        "balanced, objective, and unbiased",
    "luxurious":      "premium, exclusive, and sophisticated",
    "eco-conscious":  "sustainable, green, and environmentally responsible",
}


async def generate_listing_copy(
    asin: str,
    marketplace: str,
    language: str,
    tone: str,
    keywords: list[str],
) -> dict:
    """
    Generate complete Amazon listing copy for a given ASIN.

    Returns:
        {
            titles:       [str, str, str]   — 3 title variants
            bullets:      [str x5]          — 5 bullet points
            description:  str               — product description
            search_terms: str               — comma-separated backend search terms
            product_title: str              — original product title from Amazon
        }
    """
    # ── 1. Fetch product data (non-fatal — generate even without ASIN data) ──
    product: dict = {}
    try:
        product = await lookup_asin(asin, marketplace)
    except Exception as e:
        print(f"[COPYWRITER] ASIN lookup failed for {asin}: {e} — generating without product data")

    # ── 2. Build the generation prompt ──
    prompt = _build_prompt(product, marketplace, language, tone, keywords)

    # ── 3. Call Gemini ──
    result = await _call_gemini(prompt)
    result["product_title"] = product.get("title", "")
    return result


def _build_prompt(
    product: dict,
    marketplace: str,
    language: str,
    tone: str,
    keywords: list[str],
) -> str:
    tone_desc = _TONE_DESCRIPTIONS.get(tone, tone)
    keyword_str = ", ".join(keywords) if keywords else "none provided"

    title    = product.get("title", "Unknown product")
    brand    = product.get("brand", "")
    category = product.get("category", "")
    bullets  = product.get("bullets", [])
    bullets_text = (
        "\n".join(f"• {b}" for b in bullets[:6])
        if bullets else "No bullet points available."
    )

    return f"""You are an expert Amazon listing copywriter with deep knowledge of Amazon SEO and conversion optimization.

PRODUCT DATA FROM AMAZON:
Title: {title}
Brand: {brand}
Category: {category}
Existing Bullet Points:
{bullets_text}

COPY REQUIREMENTS:
- Target Marketplace: Amazon {marketplace}
- Output Language: {language}
- Tone: {tone_desc}
- Additional Keywords to incorporate naturally: {keyword_str}

AMAZON COMPLIANCE RULES (strictly follow):
TITLE (max 200 characters each):
  • Include brand name, top 1–2 features, size/quantity/count if relevant
  • No promotional phrases (Best Seller, #1, Amazing, Buy Now, Sale, Free)
  • No special characters (&, !, *, $) unless part of the product name
  • No ALL CAPS (except accepted abbreviations like USB, LED, BPA)

BULLET POINTS (max 500 characters each):
  • Begin each with a SHORT ALL-CAPS keyword phrase (2–5 words) followed by an em dash or hyphen
  • Lead with the customer benefit, then explain the feature that delivers it
  • One focused idea per bullet — no comma-spliced feature lists
  • Naturally include the additional keywords across the 5 bullets

DESCRIPTION (max 2000 characters):
  • Narrative format — tell the product story
  • Expand on benefits mentioned in bullets with more context
  • Include social proof language (trusted by, loved by, designed for)
  • No HTML tags, no contact info, no URLs, no promotional claims

SEARCH TERMS (max 250 bytes total, comma-separated):
  • Do NOT repeat any word already in the title
  • Do NOT include the brand name or ASIN
  • Include: synonyms, related use cases, common alternate spellings, complementary products
  • Do NOT include competitor brand names

OUTPUT: Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  "titles": ["title variant 1", "title variant 2", "title variant 3"],
  "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "description": "full product description text",
  "search_terms": "term1, term2, term3, ..."
}}

Generate exactly 3 title variants using different angles:
  - V1: Feature-focused (lead with the most impressive spec/feature)
  - V2: Benefit-focused (lead with the primary customer outcome)
  - V3: Use-case focused (lead with who uses it and when)

Generate exactly 5 bullet points. Write all content in {language}."""


def _recover_partial_json(text: str) -> dict | None:
    """
    Salvage titles, bullets, description, and search_terms from a
    truncated JSON string by extracting whatever arrays/strings are
    present before the cut-off point.
    """
    result: dict = {}

    # Extract titles array
    titles_match = re.search(r'"titles"\s*:\s*\[([^\]]*)', text, re.DOTALL)
    if titles_match:
        strings = re.findall(r'"((?:[^"\\]|\\.)*)"', titles_match.group(1))
        if strings:
            result["titles"] = [s for s in strings if len(s) > 10]

    # Extract bullets array
    bullets_match = re.search(r'"bullets"\s*:\s*\[([^\]]*)', text, re.DOTALL)
    if bullets_match:
        strings = re.findall(r'"((?:[^"\\]|\\.)*)"', bullets_match.group(1))
        if strings:
            result["bullets"] = [s for s in strings if len(s) > 10]

    # Extract description (may be truncated — take what we have)
    desc_match = re.search(r'"description"\s*:\s*"((?:[^"\\]|\\.)*)', text, re.DOTALL)
    if desc_match:
        result["description"] = desc_match.group(1).rstrip("\\").strip()

    # Extract search_terms
    st_match = re.search(r'"search_terms"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.DOTALL)
    if st_match:
        result["search_terms"] = st_match.group(1)

    # Only return if we at least got some titles
    return result if result.get("titles") else None


async def _call_gemini(prompt: str) -> dict:
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured in .env")

    url = _GEMINI_URL.format(key=settings.gemini_api_key)
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,  # listing copy can be 1500+ tokens of content
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=body)

    if resp.status_code != 200:
        err = resp.json().get("error", {}).get("message", f"HTTP {resp.status_code}")
        raise ValueError(f"Gemini error: {err}")

    data = resp.json()
    text = ""
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                text = part["text"].strip()
                break
        if text:
            break

    if not text:
        raise ValueError("Empty response from Gemini")

    # Strip markdown fences if present
    clean = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()

    try:
        result = json.loads(clean)
    except json.JSONDecodeError:
        # Truncated response — attempt to salvage whatever was parsed before cut-off
        result = _recover_partial_json(clean)
        if not result:
            raise ValueError(f"Gemini returned truncated JSON that could not be recovered. Try again.")

    # Validate and normalise
    if not isinstance(result.get("titles"), list):
        raise ValueError("Response missing 'titles' array")
    if not isinstance(result.get("bullets"), list):
        raise ValueError("Response missing 'bullets' array")

    # Pad/trim to exactly 3 titles and 5 bullets
    while len(result["titles"]) < 3:
        result["titles"].append(result["titles"][0])
    result["titles"] = result["titles"][:3]

    while len(result["bullets"]) < 5:
        result["bullets"].append(result["bullets"][-1])
    result["bullets"] = result["bullets"][:5]

    result.setdefault("description", "")
    result.setdefault("search_terms", "")

    return result
