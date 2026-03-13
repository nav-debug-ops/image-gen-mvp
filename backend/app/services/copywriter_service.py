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


class AsinLookupRequired(Exception):
    """Raised when ASIN lookup fails and no manual product data was provided."""
    pass

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
    manual_title: str = "",
    manual_bullets: list[str] | None = None,
) -> dict:
    """
    Generate complete Amazon listing copy for a given ASIN.

    If manual_title or manual_bullets are provided they are used directly
    (skipping ASIN lookup). If neither is provided and ASIN lookup fails,
    raises AsinLookupRequired so the caller can ask the user for manual data.

    Returns:
        {
            titles:       [str, str, str]   — 3 title variants
            bullets:      [str x5]          — 5 bullet points
            description:  str               — product description
            search_terms: str               — comma-separated backend search terms
            product_title: str              — original product title from Amazon
        }
    """
    # ── 1. Resolve product data ──
    if manual_title or manual_bullets:
        # Caller supplied manual data — use it directly, skip ASIN lookup
        product: dict = {
            "title": manual_title or "",
            "bullets": manual_bullets or [],
        }
    else:
        product = {}
        try:
            product = await lookup_asin(asin, marketplace)
        except Exception as e:
            raise AsinLookupRequired(
                f"Could not fetch product data for ASIN {asin}: {e}"
            )

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
    truncated JSON string. Handles both complete and mid-string cut-offs.
    """
    result: dict = {}

    def extract_strings(blob: str) -> list[str]:
        """Extract all complete quoted strings AND any trailing partial string."""
        complete = re.findall(r'"((?:[^"\\]|\\.)+)"', blob)
        # Also grab a trailing partial string (no closing quote before end-of-blob)
        partial_match = re.search(r'"((?:[^"\\]|\\.){20,})$', blob)
        if partial_match and partial_match.group(1) not in complete:
            complete.append(partial_match.group(1))
        return [s.strip() for s in complete if len(s.strip()) > 10]

    # Titles
    m = re.search(r'"titles"\s*:\s*\[(.*)$', text, re.DOTALL)
    if m:
        blob = m.group(1)
        end = blob.find(']')
        strings = extract_strings(blob[:end] if end != -1 else blob)
        if strings:
            result["titles"] = strings

    # Bullets
    m = re.search(r'"bullets"\s*:\s*\[(.*)$', text, re.DOTALL)
    if m:
        blob = m.group(1)
        end = blob.find(']')
        strings = extract_strings(blob[:end] if end != -1 else blob)
        if strings:
            result["bullets"] = strings

    # Description (take anything after the opening quote, even if truncated)
    m = re.search(r'"description"\s*:\s*"((?:[^"\\]|\\.)*)', text, re.DOTALL)
    if m:
        result["description"] = m.group(1).rstrip("\\").strip()

    # Search terms
    m = re.search(r'"search_terms"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.DOTALL)
    if m:
        result["search_terms"] = m.group(1)

    return result if result.get("titles") else None


async def _call_gemini(prompt: str) -> dict:
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured in .env")

    url = _GEMINI_URL.format(key=settings.gemini_api_key)
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
            "thinkingConfig": {"thinkingBudget": 0},  # disable reasoning tokens — all budget goes to output
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
    if not isinstance(result.get("titles"), list) or not result["titles"]:
        raise ValueError("Response missing 'titles' array")

    # Ensure bullets is a list even if truncation cut it off entirely
    if not isinstance(result.get("bullets"), list):
        result["bullets"] = []

    # Pad/trim to exactly 3 titles and 5 bullets
    while len(result["titles"]) < 3:
        result["titles"].append(result["titles"][0])
    result["titles"] = result["titles"][:3]

    placeholder = "(regenerate to fill)"
    while len(result["bullets"]) < 5:
        result["bullets"].append(placeholder)
    result["bullets"] = result["bullets"][:5]

    result.setdefault("description", "")
    result.setdefault("search_terms", "")

    return result
