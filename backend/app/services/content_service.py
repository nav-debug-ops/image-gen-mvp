"""
Content Generation Service
==========================
Generates Amazon-compliant copy for A+ Content, Brand Story, and
Storefront Designer modules using Gemini 2.5 Flash.

Workflow:
  1. lookup_asin()  → scraped product data
  2. Build page/module-specific system instruction + user message
  3. Gemini → structured JSON with headline, body, highlights, specs, qa_pairs
  4. Return parsed dict

Returned fields (subset varies by module_type):
  headline    : str   – main headline text
  body        : str   – body / description text
  highlights  : list  – ["bullet 1", ...]   (A+ highlights modules)
  specs       : list  – [{"label": "...", "value": "..."}]  (A+ specs)
  qa_pairs    : list  – [{"question": "...", "answer": "..."}] (Brand Story Q&A)
"""

import json
import httpx

from app.config import get_settings
from app.services.asin_lookup import lookup_asin

settings = get_settings()

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent?key={key}"
)

# ─────────────────────────────────────────────────────────────────────────────
# System instructions per page type
# ─────────────────────────────────────────────────────────────────────────────

_APLUS_SYSTEM = """You are an expert Amazon A+ Content copywriter with deep knowledge of Amazon's content guidelines, character limits, and conversion-optimised copy.

Your task is to generate copy for a specific A+ Content module based on real product data scraped from Amazon.

AMAZON A+ CONTENT RULES
- Headline: max 160 characters — punchy, benefit-first, no "best" or superlatives without proof
- Body: max 600 characters — conversational, pain-point led, scannable
- Highlights: exactly 5 bullet points, each max 350 characters — start with a verb or key noun
- Specs: exactly 4 rows — label (short, ≤30 chars) + value (specific, ≤60 chars)
- No pricing, availability, or time-limited claims
- No competitor brand names
- Third-person or second-person ("You") voice — not first-person brand voice

MODULE-SPECIFIC GUIDANCE

single-image-highlights: Lead with the product's #1 benefit. Each bullet should address a different use-case, feature, or pain point. Power words: "Precision", "Zero-", "Built for", "Instant".

single-image-specs: Use real technical data from bullets. Labels: Material, Dimensions, Weight, Compatibility, Capacity, Warranty, etc. Values must be specific numbers or clear descriptors.

image-light-overlay / image-dark-overlay: Short punchy headline (≤80 chars works best over images). Body is optional supporting context.

four-image-text / four-image-text-quad: Headline sets the theme. Body supports each image's specific story. Keep body under 200 chars for readability.

comparison-chart / premium-comparison-chart: Headline frames the comparison ("Why [Product] Beats the Rest"). Body briefly explains the table context.

standard-image-header: No text needed — return empty strings.

company-logo: No text needed — return empty strings.

OUTPUT FORMAT — always return valid JSON, no markdown fences:
{
  "headline": "string (≤160 chars)",
  "body": "string (≤600 chars)",
  "highlights": ["string ≤350 chars", "string", "string", "string", "string"],
  "specs": [
    {"label": "string ≤30 chars", "value": "string ≤60 chars"},
    {"label": "string", "value": "string"},
    {"label": "string", "value": "string"},
    {"label": "string", "value": "string"}
  ],
  "qa_pairs": []
}

Always include all keys even if empty. Never truncate mid-word."""

_BRAND_STORY_SYSTEM = """You are an expert Amazon Brand Story copywriter who creates compelling brand narratives that drive loyalty, trust, and repeat purchases on Amazon.

Your task is to generate copy for a specific Brand Story module based on real product and brand data from Amazon.

AMAZON BRAND STORY RULES
- Brand Story appears as a scrollable carousel on Amazon PDPs — tone must feel human, not corporate
- Max 2200 characters total across all text modules
- Headline: max 200 characters — emotionally resonant, mission-driven
- Body: max 600 characters — tell a story, not a feature list. "We" voice is acceptable here
- Q&A pairs: exactly 3 pairs. Question max 200 chars, Answer max 2000 chars. Authentic, founder-voice answers

MODULE-SPECIFIC GUIDANCE

carousel-background: No text — return empty strings. This is an image-only module.

brand-focus: The hero narrative module. Lead with WHY the brand exists, not what the product does. Reference real product category from the data.

brand-logo-desc: Short punchy brand descriptor under the logo. 1–2 sentences that define the brand's promise. Use the brand name.

brand-qa: Three natural customer questions a real buyer would ask before trusting the brand. Answers should feel personal, specific, and confident — not generic.

OUTPUT FORMAT — always return valid JSON, no markdown fences:
{
  "headline": "string (≤200 chars)",
  "body": "string (≤600 chars)",
  "highlights": [],
  "specs": [],
  "qa_pairs": [
    {"question": "string ≤200 chars", "answer": "string ≤2000 chars"},
    {"question": "string", "answer": "string"},
    {"question": "string", "answer": "string"}
  ]
}

Always include all keys even if empty."""

_STOREFRONT_SYSTEM = """You are an expert Amazon Storefront copywriter who creates clear, conversion-focused copy for Amazon Store widgets and pages.

Your task is to generate copy for a specific Amazon Storefront widget based on real product data from Amazon.

AMAZON STOREFRONT RULES
- Storefronts are brand discovery hubs — copy should welcome, guide, and inspire, not hard-sell
- Headline: max 200 characters — category-level, not product-level (Storefronts show the whole brand)
- Body: max 1000 characters — gives context, highlights range, or guides the shopper
- No pricing or promotional language ("sale", "discount", "% off")
- No competitor mentions
- Use "you" voice or neutral brand voice

WIDGET-SPECIFIC GUIDANCE

hero-header: Brand welcome message. "Discover [Brand] — [Brand Promise]". Body is optional tagline.

brand-logo: No text needed — return empty strings.

full-image / large-image / medium-image / small-image: Headline = the collection or mood this image represents. Body = optional brief context (1–2 sentences).

image-text / image-text-overlay: Headline = benefit or collection name. Body = 2–3 sentence description of this product group.

shoppable-image: Headline names the scene or lifestyle. Body briefly sets the context for tagged products.

text-tile: Headline = section title. Body = 2–4 sentences explaining what shoppers will find in this section.

video-tile / background-video: Headline = video title or section name. Body = optional 1–2 sentence context.

gallery: Headline = the visual story (e.g. "Designed for Every Moment"). Body = optional brief.

product-grid: Headline = the grid's theme (e.g. "Our Best Sellers", "New Arrivals"). Body = optional invitation to explore.

OUTPUT FORMAT — always return valid JSON, no markdown fences:
{
  "headline": "string (≤200 chars)",
  "body": "string (≤1000 chars)",
  "highlights": [],
  "specs": [],
  "qa_pairs": []
}

Always include all keys even if empty."""

_SYSTEM_BY_PAGE = {
    "aplus": _APLUS_SYSTEM,
    "brand_story": _BRAND_STORY_SYSTEM,
    "storefront": _STOREFRONT_SYSTEM,
}

# ─────────────────────────────────────────────────────────────────────────────
# User message builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_user_message(product: dict, page_type: str, module_type: str) -> str:
    title = product.get("title", "Unknown Product")
    brand = product.get("brand", "Unknown Brand")
    category = product.get("category", "General")
    bullets = product.get("bullets", [])
    marketplace = product.get("marketplace", "US")

    bullets_text = "\n".join(f"• {b}" for b in bullets) if bullets else "No bullet points available"

    page_labels = {
        "aplus": "Amazon A+ Content",
        "brand_story": "Amazon Brand Story",
        "storefront": "Amazon Storefront",
    }

    return f"""PRODUCT DATA (scraped from Amazon {marketplace})
Title: {title}
Brand: {brand}
Category: {category}
Bullet Points:
{bullets_text}

TASK
Generate copy for the following {page_labels.get(page_type, page_type)} module: **{module_type}**

Use the actual product name, brand, features, and benefits from the data above.
Do not invent features not present in the bullet points.
Return JSON only — no explanation, no markdown."""


# ─────────────────────────────────────────────────────────────────────────────
# Gemini call
# ─────────────────────────────────────────────────────────────────────────────

async def _call_gemini(product: dict, page_type: str, module_type: str) -> dict:
    system_instruction = _SYSTEM_BY_PAGE.get(page_type, _APLUS_SYSTEM)
    user_message = _build_user_message(product, page_type, module_type)

    url = _GEMINI_URL.format(key=settings.gemini_api_key)
    body = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "generationConfig": {
            "temperature": 0.75,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=body)

    if resp.status_code != 200:
        error_data = resp.json()
        gemini_msg = error_data.get("error", {}).get("message", resp.text[:200])
        raise RuntimeError(f"Gemini error {resp.status_code}: {gemini_msg}")

    data = resp.json()
    raw = data["candidates"][0]["content"]["parts"][0]["text"]

    # Strip any accidental markdown fences
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip().rstrip("```").strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Gemini returned invalid JSON: {e}\nRaw: {raw[:400]}")


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

async def generate_content(
    asin: str,
    page_type: str,
    module_type: str,
    marketplace: str = "US",
) -> dict:
    """
    Generate module copy for A+ Content, Brand Story, or Storefront.

    Returns dict with keys: headline, body, highlights, specs, qa_pairs
    (some will be empty lists/strings depending on module_type).
    """
    if page_type not in _SYSTEM_BY_PAGE:
        raise ValueError(f"Unknown page_type '{page_type}'. Must be: aplus, brand_story, storefront")

    product = await lookup_asin(asin, marketplace)
    result = await _call_gemini(product, page_type, module_type)

    # Guarantee all expected keys are present with correct types
    return {
        "headline": result.get("headline", "") or "",
        "body": result.get("body", "") or "",
        "highlights": result.get("highlights", []) or [],
        "specs": result.get("specs", []) or [],
        "qa_pairs": result.get("qa_pairs", []) or [],
    }
