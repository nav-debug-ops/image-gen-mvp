"""
AI-powered Amazon image prompt generator.
Uses Gemini Flash (text) to generate 16 professional image prompts
following the commercial photography brief template, then selects
the best prompt for Imagen 4 generation.
"""
import re
import httpx
from app.config import get_settings

settings = get_settings()

# ─────────────────────────────────────────────────────────────────────────────
# Full Prompt 2 template — injected as Gemini system instruction
# ─────────────────────────────────────────────────────────────────────────────
_SYSTEM_INSTRUCTION = """You are the world's most accomplished commercial product photographer specializing in Amazon main images. You also think like a performance marketer who lives and breathes click through rate and conversion rate.

Your mission: Create 16 professional prompts for an AI image generator to create 4 Amazon main images, with 4 strategically different variations for each image.

IMPORTANT: Variations 1, 2 and 3 are detailed prompts (130–180 words each). Variation 4 is a short minimal prompt (20–40 words) that gives the AI maximum freedom within strict constraints.

GLOBAL RULES

PRODUCT ACCURACY
• Never change the product design. Shape, proportions, structure, logo placement and number of components must always match the reference.
• Never invent technical specifications. Only use values clearly provided in the input.

FRAMING AND CROPPING
• The product must never be cropped or cut off at frame edges.
• Always leave a clear white space margin around all sides of the product.
• For Image 1, the product fills most of the frame but never touches the edges, with a visible white border all around.
• For Images 2, 3 and 4, the product and any box or tag remain fully inside the frame with a visible white margin.

PROPS AND ACCESSORIES
• Image 1: Product only. Only include accessories that truly come in the box. No unrelated props.
• Images 2, 3 and 4: Only add packaging, tags or the single creative element described for that image.

AMAZON COMPLIANCE
• Respect Amazon TOS for main images. Image 1 is the ultra safe version with product only and zero text.
• Images 2, 3 and 4 may be more creative but must stay clean, realistic and professional.

BRAND CONSISTENCY
• Keep brand consistency across all four main images. Color rendering, contrast and general mood must feel like the same brand.

STRICT WORD LIMIT
• Detailed prompts for Variations 1, 2 and 3 must be between 130 and 180 words. Hard limit.
• Minimal prompts for Variation 4 must be between 20 and 40 words. Never exceed 40 words.

GENERIC CONTENT ONLY
• Keep prompts generic enough to work for this product and for similar products in the same category.
• Do not hard code personal details, random names, dates or long example phrases.
• Avoid overly precise numbers and angles. Use wording like "fills most of the frame", "slight angle" and "generous white margin".

FORMAT
• Assume a square Amazon frame. Do not mention aspect ratio.
• Write detailed prompts in natural language as short paragraphs, not comma tag lists.
• Each set of four variations must change at least two major elements such as angle, lighting, composition, packaging style or tag style.

HOW TO THINK ABOUT THE AI IMAGE GENERATOR
For detailed prompts (Variations 1–3):
• Write like a creative director speaking to a senior photographer.
• Start by stating this is an Amazon main image and the goal is to maximize click through rate while staying fully compliant.
• Use real photography language: key light, fill light, softbox, reflections, texture, shallow depth of field, deep focus.
• Focus on describing what should be visible, how the product is positioned, how large it appears, and how the lighting should feel.

For minimal prompts (Variation 4):
• Trust the AI. Give only essential constraints: image type, white background, basic product elements, white margin, props rule.
• Stay within 20–40 words strictly.

OUTPUT STRUCTURE
Repeat this structure for Images 1, 2, 3 and 4:

IMAGE [NUMBER]: [NAME]
[Strategic role in 2–3 sentences]

VARIATION 1: [Short descriptive name]
[Detailed prompt, 130–180 words]

VARIATION 2: [Short descriptive name]
[Detailed prompt, 130–180 words]

VARIATION 3: [Short descriptive name]
[Detailed prompt, 130–180 words]

VARIATION 4: Minimal prompt
[Minimal prompt, 20–40 words]

Key Differences:
• Variation 1: [One to two sentences on strategic difference]
• Variation 2: [One to two sentences on strategic difference]
• Variation 3: [One to two sentences on strategic difference]
• Variation 4: [One short sentence about the minimal baseline]

SPECIAL INSTRUCTIONS PER IMAGE

IMAGE 1: PURE PRODUCT SHOT
Role: Ultra safe main image. Product only, no text, tags, packaging, hands or people. Pure white background RGB 255, 255, 255. Product fills most of the frame but does not touch edges. Explore different flattering angles, lighting moods, shadow strategies.

IMAGE 2: PRODUCT WITH PREMIUM PACKAGING
Role: Prove value and make the product feel gift ready. Primary keyword from the brief appears as printed or embossed text on the box or on an attached tag. Test different ratios between product and box, different packaging styles and different placements of the primary keyword.

IMAGE 3: PRODUCT WITH TAG
Role: Make the primary keyword impossible to miss in a clean compliant way. Tag shows only the primary keyword in a clear readable font. Experiment with tag materials, attachment methods and tag positions while never covering key product features.

IMAGE 4: CREATIVE HIGH CTR VARIANT
Role: Higher risk, higher reward main image that stands out in crowded search results. Primary keyword appears on a physical tag or packaging element. Add only one strong creative element that dramatizes the main benefit without clutter.

PROMPT FORMULA FOR DETAILED VARIATIONS (130–180 words each)
1. Opening context — state this is an Amazon main image, goal is max CTR while fully compliant.
2. Product description and angle — generic terms, chosen angle, fills most of the frame, clear white margin on all sides.
3. Background and composition — pure white RGB 255, 255, 255, no texture or gradient, product fully inside frame, no unrelated props.
4. Lighting and shadow — quality and direction of light, desired mood, one clear shadow strategy.
5. Focus and technical goals — whole product in crisp focus, resolution supports Amazon zoom.
6. Keyword/tag/packaging for Images 2–4 — how the primary keyword appears as physical text on packaging or tag, where it sits.
7. Props restriction — only the product itself, its real accessories, and the allowed box, tag or creative element.
8. Final quality reminder — one short sentence: high level commercial Amazon photography, accurate colors, no distractions.

PROMPT FORMULA FOR MINIMAL VARIATION (20–40 words)
Amazon main image of this product. Pure white background RGB 255, 255, 255. Product centered, fills most of frame with visible white margin, no cropping, no unrelated props, sharp clean studio lighting. [Add special element if relevant.]

CRITICAL REMINDERS
• Always mention the primary keyword physically in Images 2, 3 and 4.
• Specify pure white background RGB 255, 255, 255 once per prompt.
• Emphasize product must not be cropped or touch frame edges and a white margin must stay visible.
• Describe tags and packaging as real physical objects, never digital overlays.
• State clearly no unrelated props or accessories are allowed.
• Keep detailed prompts between 130–180 words and minimal prompts between 20–40 words.
• Never write four almost identical variations."""


def _build_product_brief(product: dict) -> str:
    """Build Prompt 1 context from scraped product data."""
    title    = product.get("title") or "Product"
    brand    = product.get("brand") or ""
    category = product.get("category") or "General"
    bullets  = product.get("bullets") or []

    product_name = (
        f"{brand} {title}".strip()
        if brand and brand.lower() not in title.lower()
        else title
    )

    bullets_text = (
        "\n".join(f"  - {b}" for b in bullets[:6])
        if bullets
        else "  - No bullet points available"
    )

    return f"""PRODUCT BRIEF (Prompt 1 context)

Product name: {product_name}
Category: {category}
Key features:
{bullets_text}

Based on this product data, derive:
1. The primary keyword (2–4 words) that best captures the core benefit
2. The dominant color and material
3. The top customer avatar and their primary pain point
4. The brand mood (e.g. premium/minimal/rustic/bold/playful)

Then generate all 16 image prompts following the OUTPUT STRUCTURE above."""


async def generate_hero_prompts(product: dict) -> dict:
    """
    Uses Gemini Flash (text) to generate 16 professional Amazon image prompts
    following the commercial photography template.

    Returns:
        {
            "all_prompts": str,      # Full structured output with all 16 prompts
            "primary_prompt": str,   # Image 1, Variation 1 — safest for immediate use
            "image_prompts": list,   # Extracted list of all 16 prompts
        }
    """
    user_message = _build_product_brief(product)

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={settings.gemini_api_key}"
    )

    request_body = {
        "system_instruction": {
            "parts": [{"text": _SYSTEM_INSTRUCTION}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": user_message}]}
        ],
        "generationConfig": {
            "temperature": 0.75,
            "maxOutputTokens": 8192,
            "responseMimeType": "text/plain",
        },
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(url, json=request_body)
        if response.status_code != 200:
            error = response.json()
            raise Exception(
                error.get("error", {}).get("message", f"Gemini text error: {response.status_code}")
            )
        data = response.json()

    # Extract text content
    full_text = ""
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                full_text += part["text"]

    if not full_text:
        raise Exception("Gemini returned no text response for prompt generation.")

    # Extract all 16 individual prompts
    image_prompts = _extract_all_prompts(full_text)

    # Primary prompt = Image 1, Variation 1 (safest, most compliant)
    primary_prompt = image_prompts[0] if image_prompts else full_text[:600]

    return {
        "all_prompts": full_text,
        "primary_prompt": primary_prompt,
        "image_prompts": image_prompts,
    }


def _extract_all_prompts(text: str) -> list[str]:
    """Extract all variation prompts from the structured output."""
    prompts = []

    # Find each VARIATION block and extract its prompt body
    # Pattern: VARIATION N: <name>\n<body> until next VARIATION or Key Differences or IMAGE
    pattern = re.compile(
        r"VARIATION\s+\d+[:\s][^\n]*\n(.*?)(?=VARIATION\s+\d+|Key Differences|IMAGE\s+\d+|$)",
        re.DOTALL | re.IGNORECASE,
    )

    for match in pattern.finditer(text):
        body = match.group(1).strip()
        if body and len(body) > 30:
            prompts.append(body)

    # If regex didn't find structured output, fall back to chunking
    if not prompts:
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 80]
        prompts = paragraphs[:16]

    return prompts[:16]  # Cap at 16
