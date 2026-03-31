"""
Creative Campaigns — Market Intelligence Service
================================================
Uses product data from ASIN lookup + Gemini 2.5 Flash to generate a
structured market intelligence brief: sentiment analysis, customer
demographics, positive themes, pain points, feature requests, customer
avatars, competitor landscape, and strategic recommendations.

The JSON schema returned exactly matches the CreativeCampaigns UI shape.
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

# Fixed colors for the sentiment pie chart — UI depends on these exact values
_SENTIMENT_COLORS = {
    "Positive": "#22C55E",
    "Pain Points": "#EF4444",
    "Feature Requests": "#3B82F6",
}


async def analyze_campaign(
    asin: str,
    marketplace: str,
    keyword: str = "",
    processing_mode: str = "fast",
) -> dict:
    """
    Generate a market intelligence brief for a given ASIN or keyword.

    Returns a dict matching the CreativeCampaigns UI schema:
        overview, sentiment, demographics, positiveThemes, painPoints,
        featureRequests, customerAvatars, competitors, recommendations,
        product_title, product_brand
    """
    product: dict = {}
    if asin and len(asin) == 10:
        try:
            product = await lookup_asin(asin, marketplace)
        except Exception as e:
            print(f"[CAMPAIGNS] ASIN lookup failed for {asin}: {e} — falling back to keyword/minimal data")

    prompt = _build_prompt(product, marketplace, keyword=keyword, processing_mode=processing_mode)
    result = await _call_gemini(prompt)

    # Inject hardcoded colors into sentiment so Recharts Cell fills work
    for item in result.get("sentiment", []):
        item["color"] = _SENTIMENT_COLORS.get(item.get("name", ""), "#6B7280")

    result["product_title"] = product.get("title", keyword or "")
    result["product_brand"] = product.get("brand", "")
    return result


async def chat_with_campaign(message: str, context_summary: str, marketplace: str = "US") -> str:
    """Answer a user question grounded in existing campaign market intelligence."""
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured")

    prompt = f"""You are an expert Amazon brand strategist with deep knowledge of market intelligence and creative campaigns.

The user has generated market intelligence for an Amazon product. Here is the campaign context:

{context_summary}

---

Answer the following question from the brand manager. Be specific, concise, and actionable. 2-4 sentences max.

Question: {message}"""

    return await _call_gemini_text(prompt)


def _build_prompt(product: dict, marketplace: str, keyword: str = "", processing_mode: str = "fast") -> str:
    # Use keyword as product context when ASIN lookup yielded nothing
    if product:
        title = product.get("title", keyword or "Unknown product")
        brand = product.get("brand", "")
        category = product.get("category", "")
        bullets = product.get("bullets", [])
    else:
        title = keyword or "Unknown product"
        brand = ""
        category = ""
        bullets = []

    bullets_text = (
        "\n".join(f"• {b}" for b in bullets[:6])
        if bullets else f"No bullet points available. Use your knowledge of '{title}' in the {marketplace} marketplace."
    )

    depth_note = (
        "Provide a comprehensive deep-dive analysis with richer insights, more nuanced customer avatars, and detailed competitive dynamics."
        if processing_mode == "deep"
        else "Provide a focused, high-signal analysis."
    )

    return f"""You are an expert Amazon market intelligence analyst and brand strategist.

PRODUCT DATA:
Title: {title}
Brand: {brand}
Category: {category}
Product Features:
{bullets_text}
Marketplace: Amazon {marketplace}

TASK: Generate a comprehensive market intelligence brief for this product. {depth_note}
Base your analysis on:
1. The product's specific features, category, and likely target audience
2. Common buyer patterns and demographics for this type of product on Amazon
3. Typical competitive dynamics in this product category
4. Industry knowledge about buyer psychology and market trends for this niche

OUTPUT: Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  "overview": {{
    "reviewsAnalyzed": <realistic integer estimate for this category>,
    "competitorsStudied": <integer 4-8>,
    "customerAvatars": 2,
    "dataPoints": <integer estimate — roughly reviewsAnalyzed * 5>
  }},
  "sentiment": [
    {{"name": "Positive", "value": <integer>}},
    {{"name": "Pain Points", "value": <integer>}},
    {{"name": "Feature Requests", "value": <integer>}}
  ],
  "demographics": [
    {{"age": "18-25", "male": <integer>, "female": <integer>}},
    {{"age": "26-35", "male": <integer>, "female": <integer>}},
    {{"age": "36-45", "male": <integer>, "female": <integer>}},
    {{"age": "46-55", "male": <integer>, "female": <integer>}},
    {{"age": "56-65", "male": <integer>, "female": <integer>}},
    {{"age": "65+", "male": <integer>, "female": <integer>}}
  ],
  "positiveThemes": [
    {{"theme": "<what buyers praise>", "count": <integer>}},
    {{"theme": "<what buyers praise>", "count": <integer>}},
    {{"theme": "<what buyers praise>", "count": <integer>}},
    {{"theme": "<what buyers praise>", "count": <integer>}},
    {{"theme": "<what buyers praise>", "count": <integer>}}
  ],
  "painPoints": [
    {{"point": "<complaint or frustration>", "count": <integer>, "impact": <integer 1-20>}},
    {{"point": "<complaint or frustration>", "count": <integer>, "impact": <integer 1-20>}},
    {{"point": "<complaint or frustration>", "count": <integer>, "impact": <integer 1-20>}},
    {{"point": "<complaint or frustration>", "count": <integer>, "impact": <integer 1-20>}}
  ],
  "featureRequests": [
    {{"request": "<improvement buyers want>", "count": <integer>}},
    {{"request": "<improvement buyers want>", "count": <integer>}},
    {{"request": "<improvement buyers want>", "count": <integer>}},
    {{"request": "<improvement buyers want>", "count": <integer>}}
  ],
  "customerAvatars": [
    {{
      "name": "<descriptive persona name>",
      "segment": "Primary",
      "percentage": <integer 25-45>,
      "demographics": {{
        "age": "<age range e.g. 28-42>",
        "gender": "<Mixed | Majority Male | Majority Female | specific split>",
        "location": "<Urban | Suburban | Rural | Mixed>",
        "income": "<range e.g. $60K-120K>"
      }},
      "psychographics": {{
        "lifestyle": "<one-word descriptor>",
        "values": "<one-word descriptor>",
        "interests": "<2-3 interests, comma-separated>"
      }},
      "behaviors": ["<behavior>", "<behavior>", "<behavior>"],
      "motivations": ["<motivation>", "<motivation>", "<motivation>"]
    }},
    {{
      "name": "<descriptive persona name>",
      "segment": "Secondary",
      "percentage": <integer 15-30>,
      "demographics": {{
        "age": "<age range>",
        "gender": "<string>",
        "location": "<string>",
        "income": "<range>"
      }},
      "psychographics": {{
        "lifestyle": "<string>",
        "values": "<string>",
        "interests": "<string>"
      }},
      "behaviors": ["<behavior>", "<behavior>", "<behavior>"],
      "motivations": ["<motivation>", "<motivation>", "<motivation>"]
    }}
  ],
  "competitors": [
    {{"brand": "<competitor brand name>", "rating": <float 3.5-5.0>, "reviews": <integer>, "share": <integer 15-35>}},
    {{"brand": "<competitor brand name>", "rating": <float>, "reviews": <integer>, "share": <integer>}},
    {{"brand": "<competitor brand name>", "rating": <float>, "reviews": <integer>, "share": <integer>}},
    {{"brand": "{brand or 'Your Product'}", "rating": <float>, "reviews": <integer>, "share": <integer>}}
  ],
  "recommendations": {{
    "pricing": ["<actionable recommendation>", "<actionable recommendation>"],
    "product": ["<actionable recommendation>", "<actionable recommendation>"],
    "marketing": ["<actionable recommendation>", "<actionable recommendation>"],
    "operations": ["<actionable recommendation>", "<actionable recommendation>"]
  }}
}}

Rules:
- Sentiment values (Positive + Pain Points + Feature Requests) MUST sum to exactly 100
- All content must be specific to THIS product — not generic boilerplate
- Competitor brand names should be plausible real or fictional brands in this category
- Demographics male+female values per age group represent estimated % of total buyers in that cohort
- Counts in themes/pain points/feature requests should be proportional to reviewsAnalyzed"""


async def _call_gemini(prompt: str) -> dict:
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured in .env")

    url = _GEMINI_URL.format(key=settings.gemini_api_key)
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
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

    clean = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Campaign analysis returned invalid JSON: {e}")


async def _call_gemini_text(prompt: str) -> str:
    """Call Gemini and return raw text (for chat responses)."""
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured in .env")

    url = _GEMINI_URL.format(key=settings.gemini_api_key)
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=body)

    if resp.status_code != 200:
        err = resp.json().get("error", {}).get("message", f"HTTP {resp.status_code}")
        raise ValueError(f"Gemini error: {err}")

    data = resp.json()
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                return part["text"].strip()
    raise ValueError("Empty response from Gemini")
