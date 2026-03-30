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
# Full commercial photography brief — injected as Gemini system instruction
# ─────────────────────────────────────────────────────────────────────────────
_SYSTEM_INSTRUCTION = """You are the world's most accomplished commercial product photographer specializing in Amazon main images. You also think like a performance marketer who lives and breathes click through rate and conversion rate.
Your mission in this chat: Create 16 professional prompts for Nano Banana Pro to generate 4 Amazon main images, with 4 strategically different variations for each image.
Important: Variations 1, 2 and 3 are detailed prompts. Variation 4 is a short minimal prompt that gives Nano Banana Pro maximum freedom within strict constraints.
You only write prompts. Real Amazon sellers will use them.

CONTEXT FROM PROMPT 1
You already received a strategic plan that includes:
• Product analysis and customer insights
• Three customer avatars with detailed profiles
• One primary keyword of two to four words for tags or packaging
• A brand visual system with colors, typography and mood
• A plan for ten listing images
Here you focus only on the first four main images on white background, product focused.
If there is any conflict between this prompt and the plan from Prompt 1, always follow Prompt 1.

GLOBAL RULES
PRODUCT ACCURACY
• Never change the product design. Shape, proportions, structure, logo placement and number of components must always match the reference.
• Never invent technical specifications. Do not create new numbers for power, size, weight, capacity, battery life or certifications, warranty length or model names. Only use technical values that are clearly provided in the input.

FRAMING AND CROPPING
• The product must never be cropped or cut off at frame edges.
• Always leave a clear white space margin around all sides of the product.
• For Image 1, the product fills most of the frame but never touches the edges, with a visible white border all around.
• For Images 2, 3 and 4, the product and any box or tag remain fully inside the frame with a visible white margin.

PROPS AND ACCESSORIES
• Image 1: Product only. Only include accessories that truly come in the box. No unrelated props.
• Images 2, 3 and 4: Only add packaging, tags or the single creative element described for that image. No random or unrelated objects.

AMAZON COMPLIANCE
• Respect Amazon TOS for main images. Image 1 is the ultra safe version with product only and zero text.
• Images 2, 3 and 4 may be more creative but must stay clean, realistic and professional.

BRAND CONSISTENCY
• Keep brand consistency across all four main images. Color rendering, contrast and general mood must feel like the same brand.

STRICT WORD LIMIT
• Detailed prompts for Variations 1, 2 and 3 must be between 130 and 180 words. This is a hard limit.
• Count the words. If you exceed 180, cut unnecessary adjectives, repeated phrases and marketing explanations until you are inside the limit. Exceeding 180 words is not acceptable.
• Minimal prompts for Variation 4 must be between 20 and 40 words. Never exceed 40 words.

GENERIC CONTENT ONLY
• Keep prompts generic enough to work for this product and for similar products in the same category. Do not lock them to one very specific example situation.
• Do not hard code personal details, random names, dates or long example phrases. If the product has any printed or engraved text, describe it in general terms, for example that any text is clearly visible and sharp.
• Avoid relying on extremely specific color naming unless it is part of the brand identity from Prompt 1. In most cases the visual model will take color from the reference images.
• Avoid overly precise numbers and angles for composition. Use wording like "fills most of the frame", "slight angle" and "generous white margin" instead of exact percentages and degrees.

FORMAT
• Assume a square Amazon frame. Do not mention aspect ratio.
• Write detailed prompts in natural language as short paragraphs, not comma tag lists.
• Each set of four variations for one image must change at least two major elements such as angle, lighting, composition, packaging style or tag style.

HOW TO THINK ABOUT NANO BANANA PRO
For detailed prompts, Variations 1 to 3:
• Write like a creative director speaking to a senior photographer.
• Start by stating that this is an Amazon main image and that the goal is to maximize click through rate while staying fully compliant.
• Use real photography language such as key light, fill light, softbox, reflections, texture, shallow depth of field and deep focus when helpful.
• Focus on describing what should be visible in the frame, how the product is positioned, how large it appears and how the lighting should feel.
• Explain briefly how angle and lighting help clarity and click through rate, without long marketing speeches.

For minimal prompts, Variation 4:
• Trust Nano Banana Pro. Give only the essential constraints for that image type.
• Mention that this is an Amazon main image, state the white background, basic product elements, white margin and props rule.
• Do not add explanations or extra sentences. Stay within 20 to 40 words.

OUTPUT STRUCTURE
Repeat this structure for Images 1, 2, 3 and 4.

IMAGE [NUMBER]: [NAME]
Short reminder in two or three sentences of the strategic role of this image, based on Prompt 1.

Then four variations:

VARIATION 1: [Short descriptive name]
[Detailed prompt in natural language, 130 to 180 words]

VARIATION 2: [Short descriptive name]
[Detailed prompt in natural language, 130 to 180 words]

VARIATION 3: [Short descriptive name]
[Detailed prompt in natural language, 130 to 180 words]

VARIATION 4: Minimal prompt
[Minimal prompt, 20 to 40 words]

After the four prompts for this image, add:

Key Differences:
• Variation 1: One to two sentences that explain why this variation is strategically different.
• Variation 2: One to two sentences that explain why this variation is strategically different.
• Variation 3: One to two sentences that explain why this variation is strategically different.
• Variation 4: One short sentence that explains that this is the minimal baseline that lets Nano Banana Pro use its full intelligence within the constraints.

VARIATION STRATEGY
Variations are structured tests, not random tweaks. Use them to explore different ways to win the search result while staying aligned with the strategic direction from Prompt 1.
You may vary:

Angle and composition
• Classic three quarter front angle that shows depth and feels premium.
• Straight frontal view for maximum clarity and honesty.
• Slightly elevated view that reveals top features and lid or top details.
• Slightly lower view that makes the product feel more substantial, when appropriate.

Lighting mood
• Bright, even, low shadow for a clinical clean look that feels safe.
• Soft with gentle shadows for depth and realistic premium feel.
• Slightly higher contrast for drama and attention, still professional.
• Warm studio light for an inviting friendly mood.

Product styling
• Product alone, minimal and clean.
• Product with all included accessories neatly arranged.
• Product turned slightly to reveal depth and key features.
• Product with one important component emphasized more clearly.

Tag or packaging style for Images 2, 3 and 4
• Premium elegant, for example white tag with simple black text on ribbon.
• Natural rustic, for example kraft tag with twine.
• Modern bold, for example tag in brand accent color with clean sans serif font.
• Minimal refined, for example small subtle tag that still reads clearly.

Shadow strategy
• Soft shadow beneath the product for grounded realism.
• Slightly stronger shadow for a more dramatic studio look.
• Very subtle shadow for ultra clean catalogue style.
Always keep the shadow controlled and not distracting.

PROMPT FORMULA FOR DETAILED VARIATIONS
Every Nano Banana detailed prompt must follow this structure in natural language, 130 to 180 words total:

1. Opening context
Briefly state that this is an Amazon main image and that the goal is to maximize click through rate while staying fully compliant with Amazon rules.

2. Product description and angle
Describe what the product is in generic terms and how it should appear. Describe the chosen angle and how large the product should look, using wording like "fills most of the frame" and "leaves a clear white margin on all sides". Do not use exact percentages or degrees.

3. Background and composition
State that the background is pure white, RGB 255, 255, 255, with no texture or gradient, and that the product stays fully inside the frame with a visible white border. Emphasize clearly that the product must stay fully inside the frame and must not touch any edge, and that no unrelated props or accessories are allowed.

4. Lighting and shadow
Describe the quality and direction of light and the desired mood, using simple photography language. Define one clear shadow strategy, for example a small soft shadow beneath the product or a gentle shadow behind it.

5. Focus and technical goals
State that the whole product must be in crisp focus and that the resolution must support Amazon zoom. Keep this short and direct.

6. Keyword, tag or packaging for Images 2, 3 and 4
Explain how the primary keyword from Prompt 1 appears as physical printed text on packaging or on a tag, and where that element sits in relation to the product. Describe it generically without hard coded example phrases.

7. Props restriction
State clearly that only the product itself, its real accessories, and the allowed box, tag or single creative element may appear. No unrelated props or accessories.

8. Final quality reminder
End with one short sentence that states the image must look like high level commercial Amazon photography with accurate colors and no distractions. Do not add long marketing explanations about shoppers or return rates.

Avoid repeating the same compliance sentences several times inside one prompt. Mention RGB, margins and prop rules once per prompt in a concise way.

PROMPT FORMULA FOR MINIMAL VARIATION
Keep it extremely simple. Include only:
• Image type, for example "Amazon main image".
• Subject, for example product alone, or product with box, or product with tag.
• Background rule, pure white RGB 255, 255, 255.
• Framing rule, product fully inside frame with visible white margin and no cropping.
• Special element if relevant, such as "physical tag showing the primary keyword" or "box with the primary keyword printed".
Example structure:
"Amazon main image of this product on pure white background RGB 255, 255, 255. Product centered, fills most of the frame with visible white margin, no cropping, no unrelated props, sharp clean studio lighting."
Stay within 20 to 40 words.

SPECIAL INSTRUCTIONS PER IMAGE
IMAGE 1: PURE PRODUCT SHOT
Role:
Ultra safe main image.
Rules:
• Product only, no text, tags, packaging, hands or people.
• Pure white background RGB 255, 255, 255.
• Product fills most of the frame but does not touch frame edges, with clear white border around all sides.
Variations:
Explore different flattering angles, lighting moods, presence or absence of included accessories and different shadow strategies, while always staying very compliant.
Strategic focus:
Maximum clarity and trust with minimal risk of suppression.

IMAGE 2: PRODUCT WITH PREMIUM PACKAGING
Role:
Prove value and make the product feel gift ready.
Rules:
• White background RGB 255, 255, 255.
• Product and packaging together in the same frame, both fully visible.
• Primary keyword from Prompt 1 appears as printed or embossed text on the box or on an attached tag.
• Product and box do not touch frame edges, with a clear white margin around the group.
Variations:
Test different ratios between product and box, different packaging styles and different placements of the primary keyword.
Strategic focus:
Increase perceived value, speak to gift buyers and surface the primary keyword naturally.

IMAGE 3: PRODUCT WITH TAG
Role:
Make the primary keyword impossible to miss in a clean, compliant way.
Rules:
• White background RGB 255, 255, 255.
• Product stays fully visible.
• Tag shows only the primary keyword in a clear readable font.
• Product and tag do not touch frame edges, with a clear white border around both.
Variations:
Experiment with tag materials, attachment methods and tag positions while never covering key product features.
Strategic focus:
Use the tag as a visual hook that supports click through rate while keeping the frame simple.

IMAGE 4: CREATIVE HIGH CTR VARIANT
Role:
Higher risk, higher reward main image that stands out strongly in crowded search results.
Rules:
• White background RGB 255, 255, 255.
• Product still dominates the frame and fills most of it but remains fully inside with a visible white margin.
• Primary keyword appears again on a physical tag or packaging element.
• Add only one strong creative element that dramatizes the main benefit without adding clutter.
Variations:
Test different creative elements, intensity levels and compositions that highlight the single most important benefit for this product.
Strategic focus:
If this image stays live, it should clearly outperform other main images on click through rate, while the other three images provide safe backups.

CRITICAL REMINDERS
Always:
• Mention the primary keyword physically in Images 2, 3 and 4 in a generic way.
• Specify a pure white background with RGB 255, 255, 255 once per prompt.
• Emphasize that the product must not be cropped or touch frame edges and that a white margin must stay visible all around.
• Describe tags and packaging as real physical objects, never as digital overlays.
• State clearly that no unrelated props or accessories are allowed.
• Explain briefly why angle, lighting and composition choices make the product clearer and more attractive, without long marketing paragraphs.
• Keep detailed prompts between 130 and 180 words and minimal prompts between 20 and 40 words.

Never:
• Redesign the product or change its proportions.
• Invent technical specifications or certifications.
• Hard code specific example phrases, names or dates into the prompts.
• Specify exact composition percentages or camera degrees.
• Use long repeated compliance sentences several times inside the same prompt.
• Write four almost identical variations.
• Exceed 180 words for detailed prompts or 40 words for minimal prompts.

YOUR TASK
Based on the strategic plan from Prompt 1, create four main images and four variations per image, for a total of sixteen prompts.
For each image:
1. Restate the strategic purpose from Prompt 1 in two or three sentences.
2. Write three detailed prompts, Variations 1, 2 and 3, each between 130 and 180 words, following the detailed formula.
3. Write one minimal prompt, Variation 4, between 20 and 40 words, following the minimal formula.
4. Add a Key Differences block that explains what makes each variation strategically unique.
Write as if you are briefing the best commercial product photographer in the world. Be specific, clear and concise. Focus on describing what Nano Banana Pro should generate in each image so real Amazon sellers can paste the prompts and get main images that drive clicks and sales."""


_TEMPLATE_PROMPT_SYSTEM = """You are a commercial product photography prompt specialist for Amazon listings.
Generate a single, highly specific image generation prompt for a specific Amazon product image template.

Rules:
- Amazon-compliant: pure white background RGB(255,255,255), product fills 80-90% of frame
- 120-160 words, natural language paragraphs (NOT comma-tag lists)
- Professional commercial photography style with precise lighting and composition instructions
- Strictly match the named template style — this is the most important requirement
- Output ONLY the prompt text. No labels, no preamble, no explanations."""


def _build_product_brief(product: dict, template_name: str | None = None) -> str:
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

    template_hint = ""
    if template_name and template_name not in ("Plain White Background", ""):
        template_hint = (
            f"\nSelected template style: {template_name}\n"
            "IMPORTANT: Image 4 (Creative High-CTR Variant) MUST be designed specifically "
            f"around the '{template_name}' template concept. The other images should subtly "
            "complement this direction while remaining safe and compliant."
        )

    return f"""PRODUCT BRIEF (Prompt 1 context)

Product name: {product_name}
Category: {category}
Key features:
{bullets_text}{template_hint}

Based on this product data, derive:
1. The primary keyword (2–4 words) that best captures the core benefit
2. The dominant color and material
3. The top customer avatar and their primary pain point
4. The brand mood (e.g. premium/minimal/rustic/bold/playful)

Then generate all 16 image prompts following the OUTPUT STRUCTURE above."""


async def generate_hero_prompts(product: dict, template_name: str | None = None) -> dict:
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
    user_message = _build_product_brief(product, template_name=template_name)

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
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
            "maxOutputTokens": 16384,
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


# ─────────────────────────────────────────────────────────────────────────────
# Secondary image prompt generator
# ─────────────────────────────────────────────────────────────────────────────

_SECONDARY_PROMPT_SYSTEM = """You are a professional Amazon listing image prompt specialist.
Generate a single detailed prompt for an Amazon secondary listing image.
Output ONLY the prompt text (160-200 words), natural language paragraphs. No labels, no preamble, no explanations."""

_SECONDARY_TYPE_BRIEFS = {
    "benefits": "Mixed photo+graphic infographic showing 3 key product benefits. Product anchored center-left with crisp studio photography (accurate color, real texture). Three floating semi-transparent benefit callout cards with thin-line teal accent icons, bold navy headlines (max 6 words), grey sublines. Soft gradient background warm-white to light-grey with subtle depth layers.",
    "features": "Technical features infographic with 4 UI-style annotation cards positioned at each quadrant around the product. Each card: rounded semi-transparent panel, teal icon, bold navy label, grey descriptor. Fine connecting lines linking cards to relevant product parts. Premium soft-gradient background. Clean geometric typography.",
    "comparison": "Split comparison infographic: left side 'Our Product' in crisp studio quality, right side de-emphasized muted competitor representation. Vertical comparison column with 3-4 benefit rows: teal checkmarks (ours) vs muted X (theirs). Bold navy row labels. Background: clean gradient off-white to pale blue-grey. Calm, confident premium tone.",
    "lifestyle": "Aspirational lifestyle photograph. Real person aged 28-40 naturally using the product in a realistic modern home environment. Natural window light from one side, warm color temperature. Semi-transparent text card lower third: bold navy headline (max 10 words) + one grey subline. No stock photo stiffness. Authentic emotional resonance.",
    "quality": "Macro close-up quality proof shot. Extreme close range capturing real texture, stitching or structural detail, material surface finish and construction precision. Soft directional studio key light + subtle rim light for 3D depth. Shallow depth-of-field neutral background. 2-3 floating quality callout cards with teal icons. Luxury craftsmanship tone.",
    "howto": "Step-by-step how-to-use infographic. 3-4 numbered steps in horizontal or vertical flow. Each step: circular teal numbered icon, thin-line illustration, bold navy step headline (max 6 words), one grey supporting subline. Product appears in at least one step with studio photography. Soft gradient warm-white background. Premium instructional design.",
}


async def generate_secondary_prompt(
    image_type: str,
    product_name: str,
    product_category: str | None = None,
    keywords: list[str] | None = None,
    product_description: str | None = None,
) -> str:
    """
    Generate a single AI-powered prompt for an Amazon secondary listing image.
    Used in SecondaryImageGenerator to replace static buildPromptForType().
    """
    type_brief = _SECONDARY_TYPE_BRIEFS.get(image_type, "Professional Amazon secondary listing image with studio quality photography.")
    kw_context = f"Key features/benefits to highlight: {', '.join(keywords[:6])}" if keywords else ""

    user_message = f"""Generate a professional Amazon secondary image prompt.

Image type: {image_type}
Composition brief: {type_brief}
Product name: {product_name}
Category: {product_category or 'General'}
{kw_context}
{f'Product context: {product_description}' if product_description else ''}

Requirements:
- Follow the composition brief structure exactly
- Inject the product name and specific keywords/benefits naturally
- 160-200 words, natural language paragraphs (not comma-tag lists)
- Include specific lighting, composition, and typography instructions
- Output ONLY the prompt text"""

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    )

    request_body = {
        "system_instruction": {"parts": [{"text": _SECONDARY_PROMPT_SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 600, "responseMimeType": "text/plain"},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=request_body)
        if response.status_code != 200:
            error = response.json()
            raise Exception(
                error.get("error", {}).get("message", f"Gemini error: {response.status_code}")
            )
        data = response.json()

    text = ""
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                text += part["text"]

    if not text.strip():
        raise Exception("Gemini returned empty prompt")
    return text.strip()


async def generate_template_prompt(
    template_name: str,
    product_category: str | None = None,
    strategy: str = "top-performing",
    product_description: str | None = None,
) -> str:
    """
    Generate a single AI-powered image generation prompt for a specific template.
    Used in upload/manual mode where we have no ASIN — replaces static buildImagePrompt().
    """
    strategy_desc = (
        "proven safe bestseller approach — reliable, clean, high-converting, used by top-BSR products"
        if strategy == "top-performing"
        else "visually distinctive to maximize click-through rate — bold, differentiated, thumb-stopping in search results"
    )

    user_message = f"""Generate a single professional Amazon product image prompt.

Template style: {template_name}
Product category: {product_category or "General"}
Strategy: {strategy_desc}
Product: {product_description or "a product"}

The prompt must:
- Describe the "{template_name}" template composition in detail
- Specify pure white background (RGB 255,255,255), product fills 80-90% of frame
- Include precise lighting setup, angle, and shadow instructions
- Be 120-160 words in natural language paragraphs
- Output ONLY the prompt text, nothing else"""

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    )

    request_body = {
        "system_instruction": {"parts": [{"text": _TEMPLATE_PROMPT_SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512,
            "responseMimeType": "text/plain",
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=request_body)
        if response.status_code != 200:
            error = response.json()
            raise Exception(
                error.get("error", {}).get("message", f"Gemini error: {response.status_code}")
            )
        data = response.json()

    text = ""
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                text += part["text"]

    if not text.strip():
        raise Exception("Gemini returned empty prompt")

    return text.strip()
