"""
Infographic Campaign Brief Service
===================================
Generates a complete 7-infographic creative campaign brief for Amazon
Secondary Images using Gemini Flash (text).

Workflow:
  1. lookup_asin() → scraped product data
  2. Strategic analysis: pain points, hero benefit, persona, visual cues
  3. Color palette extraction (scraped or inferred)
  4. Competitor gap analysis
  5. 7 infographic briefs (4 Awareness + 3 Trust/Conversion)
  6. Structured JSON output ready for design tool integration
"""

import json
import re
import httpx

from app.config import get_settings
from app.services.asin_lookup import lookup_asin

settings = get_settings()

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent?key={key}"
)

# ─────────────────────────────────────────────────────────────────────────────
# System instruction — the full campaign brief template
# ─────────────────────────────────────────────────────────────────────────────
_SYSTEM_INSTRUCTION = """You are an expert Amazon product campaign strategist and creative director.

Your task: given Amazon product data, generate a complete creative campaign brief for 7 Infographic Images — the product's Secondary Images set.

WORKFLOW

STEP 1: Strategic Analysis
From the provided product data, derive:
- Core Customer Pain Point (from bullet points and category norms)
- Hero Benefit (the #1 reason someone buys this)
- Skepticism Points (top 4 doubts customers have before buying)
- Visual Identity Cues (material, color, tone, premium signals)
- Target Persona (age range, lifestyle, intent)

STEP 2: Color Palette
Extract or infer a cohesive 5-color brand palette:
- Primary Color: dominant brand or product color
- Secondary Color: supporting color for contrast or accents
- Accent Color: used for CTAs, highlights, badges
- Background Color: base canvas for infographics
- Typography Color: headline and body text
If exact colors cannot be scraped, infer from product's physical color, category standards, and brand positioning tier.
Mark each as "scraped" or "inferred".

STEP 3: Competitor Gap Analysis
Identify 3 plausible competitors in the same category and derive:
- For each competitor: name, hero_benefit, visual_style, price_positioning, strength, weakness
- Whitespace Opportunity: what no competitor is claiming that this product can own
- Differentiation Hook: the one angle this campaign should lean into

STEP 4: Image Type Classification
Assign exactly one Image Type to each of the 7 infographic slots. Valid types:
1. Benefits Infographic — emotional or functional outcomes
2. Features Infographic — specific specs, components, technical details
3. Comparison Infographic — positions against competitors or without-product state
4. Quality & Trust Infographic — materials, certifications, social proof, durability
5. How-To Infographic — step-by-step usage or setup
6. Lifestyle Image — aspirational real-world context with human presence

STEP 5: Generate all 7 Infographic Briefs

For Infographics 1–4 (Awareness & Persuasion), each must contain:
- image_type + justification (one sentence explaining slot choice)
- purpose: the single job this image does in the buyer journey
- dominant_visual_moments: two distinct visual descriptions
- composition_rules: three specific layout/color/spacing rules
- headline: STRICTLY ≤ 4 words — punchy, benefit-driven, scannable
- subheadline: STRICTLY ≤ 6 words — expands on headline with specificity
- supporting_element: one tactical visual or copy support element

For Infographics 5–7 (Trust & Conversion), each must contain:
- image_type + justification
- intent: what specific buyer doubt does this image resolve
- resolved_doubt: the exact objection being overcome (as a question)
- main_subjects: two distinct visual elements
- aesthetics: visual_style, mood, brand_alignment, premium_tone_via_material_cues
- guidelines: 3–5 specific execution rules for the designer
- emphasis: the single most important thing the viewer's eye must land on first

CRITICAL RULES:
- Headlines MUST be ≤ 4 words — count strictly
- Subheadlines MUST be ≤ 6 words — count strictly
- Never assign an image type arbitrarily — justify from buyer journey or competitor gap logic
- Keep all descriptions specific to THIS product — not generic boilerplate
- Infographics 1–4 use the Awareness & Persuasion schema
- Infographics 5–7 use the Trust & Conversion schema

OUTPUT: Return ONLY a valid JSON object matching the exact schema below. No markdown, no explanation, no code blocks.

{
  "asin": "string",
  "product_title": "string",
  "brand": "string",
  "strategic_analysis": {
    "core_pain_point": "string",
    "hero_benefit": "string",
    "skepticism_points": ["string", "string", "string", "string"],
    "visual_identity_cues": "string",
    "target_persona": "string"
  },
  "color_palette": {
    "primary": {"hex": "#000000", "name": "string", "source": "scraped|inferred"},
    "secondary": {"hex": "#000000", "name": "string", "source": "scraped|inferred"},
    "accent": {"hex": "#000000", "name": "string", "source": "scraped|inferred"},
    "background": {"hex": "#000000", "name": "string", "source": "scraped|inferred"},
    "typography": {"hex": "#000000", "name": "string", "source": "scraped|inferred"}
  },
  "competitor_gap": {
    "whitespace_opportunity": "string",
    "differentiation_hook": "string",
    "competitors": [
      {
        "name": "string",
        "hero_benefit": "string",
        "visual_style": "string",
        "price_positioning": "string",
        "strength": "string",
        "weakness": "string"
      }
    ]
  },
  "infographics": [
    {
      "number": 1,
      "layer": "Awareness & Persuasion",
      "image_type": "string",
      "image_type_justification": "string",
      "purpose": "string",
      "dominant_visual_moments": {"moment_1": "string", "moment_2": "string"},
      "composition_rules": ["string", "string", "string"],
      "headline": "string",
      "subheadline": "string",
      "supporting_element": "string"
    },
    {
      "number": 2,
      "layer": "Awareness & Persuasion",
      "image_type": "string",
      "image_type_justification": "string",
      "purpose": "string",
      "dominant_visual_moments": {"moment_1": "string", "moment_2": "string"},
      "composition_rules": ["string", "string", "string"],
      "headline": "string",
      "subheadline": "string",
      "supporting_element": "string"
    },
    {
      "number": 3,
      "layer": "Awareness & Persuasion",
      "image_type": "string",
      "image_type_justification": "string",
      "purpose": "string",
      "dominant_visual_moments": {"moment_1": "string", "moment_2": "string"},
      "composition_rules": ["string", "string", "string"],
      "headline": "string",
      "subheadline": "string",
      "supporting_element": "string"
    },
    {
      "number": 4,
      "layer": "Awareness & Persuasion",
      "image_type": "string",
      "image_type_justification": "string",
      "purpose": "string",
      "dominant_visual_moments": {"moment_1": "string", "moment_2": "string"},
      "composition_rules": ["string", "string", "string"],
      "headline": "string",
      "subheadline": "string",
      "supporting_element": "string"
    },
    {
      "number": 5,
      "layer": "Trust & Conversion",
      "image_type": "string",
      "image_type_justification": "string",
      "intent": "string",
      "resolved_doubt": "string",
      "main_subjects": {"subject_1": "string", "subject_2": "string"},
      "aesthetics": {
        "visual_style": "string",
        "mood": "string",
        "brand_alignment": "string",
        "premium_tone_via_material_cues": "string"
      },
      "guidelines": ["string", "string", "string"],
      "emphasis": "string"
    },
    {
      "number": 6,
      "layer": "Trust & Conversion",
      "image_type": "string",
      "image_type_justification": "string",
      "intent": "string",
      "resolved_doubt": "string",
      "main_subjects": {"subject_1": "string", "subject_2": "string"},
      "aesthetics": {
        "visual_style": "string",
        "mood": "string",
        "brand_alignment": "string",
        "premium_tone_via_material_cues": "string"
      },
      "guidelines": ["string", "string", "string"],
      "emphasis": "string"
    },
    {
      "number": 7,
      "layer": "Trust & Conversion",
      "image_type": "string",
      "image_type_justification": "string",
      "intent": "string",
      "resolved_doubt": "string",
      "main_subjects": {"subject_1": "string", "subject_2": "string"},
      "aesthetics": {
        "visual_style": "string",
        "mood": "string",
        "brand_alignment": "string",
        "premium_tone_via_material_cues": "string"
      },
      "guidelines": ["string", "string", "string"],
      "emphasis": "string"
    }
  ]
}"""


def _build_user_message(product: dict, marketplace: str) -> str:
    title = product.get("title") or "Unknown product"
    brand = product.get("brand") or ""
    category = product.get("category") or "General"
    bullets = product.get("bullets") or []
    asin = product.get("asin") or ""

    bullets_text = (
        "\n".join(f"• {b}" for b in bullets[:6])
        if bullets else "• No bullet points available"
    )

    return f"""PRODUCT DATA (scraped from Amazon):

ASIN: {asin}
Title: {title}
Brand: {brand}
Category: {category}
Marketplace: Amazon {marketplace}

Bullet Points:
{bullets_text}

Generate the complete 7-infographic campaign brief for this product following all rules in your instructions. Return only the JSON object."""


async def generate_infographic_brief(asin: str, marketplace: str) -> dict:
    """
    Generate a complete 7-infographic campaign brief for an Amazon ASIN.

    Returns a dict with:
        asin, product_title, brand, strategic_analysis,
        color_palette, competitor_gap, infographics (7 items)
    """
    # Step 1: Scrape product data
    product: dict = {}
    try:
        product = await lookup_asin(asin, marketplace)
    except Exception as e:
        print(f"[INFOGRAPHIC_BRIEF] ASIN lookup failed for {asin}: {e} — continuing with minimal data")
        product = {"asin": asin, "title": "", "brand": "", "category": "", "bullets": []}

    # Step 2: Call Gemini to generate the full brief
    result = await _call_gemini(product, marketplace)

    # Ensure asin/product_title/brand are always present from scraped data
    result["asin"] = asin
    if not result.get("product_title") and product.get("title"):
        result["product_title"] = product["title"]
    if not result.get("brand") and product.get("brand"):
        result["brand"] = product["brand"]

    return result


async def _call_gemini(product: dict, marketplace: str) -> dict:
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured in .env")

    user_message = _build_user_message(product, marketplace)
    url = _GEMINI_URL.format(key=settings.gemini_api_key)

    body = {
        "system_instruction": {"parts": [{"text": _SYSTEM_INSTRUCTION}]},
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
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

    # Strip markdown code fences if present despite responseMimeType
    clean = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Infographic brief returned invalid JSON: {e}\n\nRaw (first 500 chars): {clean[:500]}")
