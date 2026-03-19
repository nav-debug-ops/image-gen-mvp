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
    "gemini-2.5-flash:generateContent?key={key}"
)

# ─────────────────────────────────────────────────────────────────────────────
# System instruction — the full campaign brief template
# ─────────────────────────────────────────────────────────────────────────────
_SYSTEM_INSTRUCTION = """You are an expert Amazon product campaign strategist and creative director. Your task is to analyze Amazon product data and generate a complete creative campaign brief for 7 Infographic Images — part of the product's Secondary Images set.

WORKFLOW

STEP 1: Strategic Analysis
From the provided product data, derive:
- Core Customer Pain Point (from bullet points, category norms, and typical reviews)
- Hero Benefit (the #1 reason someone buys this)
- Skepticism Points (what doubts customers have before buying)
- Visual Identity Cues (material, color, tone, premium signals)
- Target Persona (age, lifestyle, intent)

STEP 2: Color Palette Extraction
Extract or infer a cohesive brand color palette for use across all 7 infographics:
- Primary Color: dominant brand or product color (hex + name)
- Secondary Color: supporting color for contrast or accents (hex + name)
- Accent Color: used for CTAs, highlights, badges (hex + name)
- Background Color: base canvas color for infographics (hex + name)
- Typography Color: headline and body text (hex + name)
- Source: "scraped from product images" or "inferred from category norms"

If exact colors cannot be scraped, infer from:
- Product's physical color and finish
- Category standards (health = clean whites + greens; tech = dark + electric blue)
- Brand positioning tier (premium = muted neutrals; mass = bold saturates)

STEP 3: Competitor Gap Analysis
Identify 2–3 top competitors in the same category and analyze:
- For each: name, hero_benefit_claimed, visual_style, price_positioning, most_cited_strength, most_cited_weakness
- Whitespace Opportunity: what no competitor is visually or verbally claiming that this product can own
- Differentiation Hook: the one angle this campaign should lean into that competitors are not using

STEP 4: Generate 7 Infographic Briefs

INFOGRAPHICS 1–4 (Awareness & Persuasion Layer)
For each, provide:
1. PURPOSE — the single job this image does in the buyer journey
2. DOMINANT VISUAL MOMENTS (two) — describe the hero shot and the supporting visual
3. COMPOSITION RULES (three) — layout/focal point, color/contrast, spacing/hierarchy
4. HEADLINE — MAXIMUM 4 WORDS. Punchy, benefit-driven, scannable. Count strictly.
5. SUBHEADLINE — MAXIMUM 6 WORDS. Expands on headline with specificity. Count strictly.
6. SUPPORTING ELEMENT — one tactical visual or copy support (icon set, badge, callout, stat)

INFOGRAPHICS 5–7 (Trust & Conversion Layer)
For each, provide:
1. INTENT — what specific buyer doubt or hesitation does this image resolve
2. RESOLVED DOUBT — the exact objection being overcome (phrased as a question the buyer has)
3. MAIN SUBJECTS (two) — primary visual element and secondary visual element
4. AESTHETICS (four pillars):
   - Visual Style: flat lay / lifestyle / close-up macro / infographic overlay / etc.
   - Mood: the emotional tone
   - Brand Alignment: how this image fits the brand identity and positioning
   - Premium Tone via Material Cues: textures, finishes, surfaces, lighting, props that signal quality
5. GUIDELINES — 3 to 5 execution rules for the designer
6. EMPHASIS — the single most important thing the viewer's eye must land on first

CRITICAL RULES:
- Headlines MUST be ≤ 4 words. Count every word. Never exceed.
- Subheadlines MUST be ≤ 6 words. Count every word. Never exceed.
- Never skip a field — if data is unavailable, infer intelligently from product category norms
- Flag inferred fields with "[inferred]" in the value
- All content must be specific to THIS product — not generic boilerplate

OUTPUT: Return ONLY a valid JSON object with this exact structure. No markdown, no explanation, no code blocks.

{
  "asin": "string",
  "product_title": "string",
  "brand": "string",
  "campaign_type": "Secondary Images",
  "total_infographics": 7,
  "color_palette": {
    "primary": {"hex": "#000000", "name": "string"},
    "secondary": {"hex": "#000000", "name": "string"},
    "accent": {"hex": "#000000", "name": "string"},
    "background": {"hex": "#000000", "name": "string"},
    "typography": {"hex": "#000000", "name": "string"},
    "source": "scraped | inferred"
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
    title    = product.get("title") or "Unknown product"
    brand    = product.get("brand") or ""
    category = product.get("category") or "General"
    bullets  = product.get("bullets") or []
    asin     = product.get("asin") or ""

    bullets_text = (
        "\n".join(f"• {b}" for b in bullets[:6])
        if bullets else "• No bullet points available"
    )

    return f"""PRODUCT DATA (scraped from Amazon {marketplace}):

ASIN: {asin}
Title: {title}
Brand: {brand}
Category: {category}

Bullet Points:
{bullets_text}

Generate the complete 7-infographic campaign brief for this product following all rules. Return only the JSON object."""


async def generate_infographic_brief(asin: str, marketplace: str) -> dict:
    """
    Generate a complete 7-infographic campaign brief for an Amazon ASIN.

    Returns a dict matching the JSON schema above.
    """
    product: dict = {}
    try:
        product = await lookup_asin(asin, marketplace)
    except Exception as e:
        print(f"[INFOGRAPHIC_BRIEF] ASIN lookup failed for {asin}: {e} — continuing with minimal data")
        product = {"asin": asin, "title": "", "brand": "", "category": "", "bullets": []}

    result = await _call_gemini(product, marketplace)

    # Ensure top-level fields are always populated from scraped data
    result["asin"] = asin
    result.setdefault("campaign_type", "Secondary Images")
    result.setdefault("total_infographics", 7)
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

    # Strip markdown fences if present despite responseMimeType
    clean = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Infographic brief returned invalid JSON: {e}\n\nRaw (first 500 chars): {clean[:500]}"
        )
