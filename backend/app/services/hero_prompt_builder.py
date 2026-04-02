"""
Dynamic Amazon hero image prompt builder.
Based on a premium commercial photography creative brief —
structure, lighting, effects, and compliance rules stay fixed;
product name, material, color, components, and emotional tone
are injected dynamically from scraped Amazon product data.
"""
import re

# Per-category dynamic effects, emotional resonance, and floating particles
CATEGORY_DEFAULTS = {
    "Pet Supplies": {
        "floatingEffect": "playful colorful wisps or soft paw-print-shaped light particles floating near the product",
        "particleEffect": "bright cheerful particles near the base evoking play, energy, and care",
        "glowTone": "warm friendly amber glow",
        "emotion": "love, playfulness, and attentive care — every pet deserves the best",
        "accentColor": "#A3B18A",
        "accentColorName": "sage green",
    },
    "Kitchen & Dining": {
        "floatingEffect": "soft wisps of steam or delicate herb particles drifting near the product",
        "particleEffect": "fine golden spice or flour particles near the base, evoking warmth and home cooking",
        "glowTone": "warm golden halo glow",
        "emotion": "warmth, nourishment, and the joy of cooking — inviting and trustworthy",
        "accentColor": "#C4A882",
        "accentColorName": "warm linen",
    },
    "Home & Kitchen": {
        "floatingEffect": "gentle dust-of-light particles or soft fabric wisps near the product",
        "particleEffect": "fine ivory particles near the base suggesting cleanliness and quality",
        "glowTone": "clean white-warm halo glow",
        "emotion": "comfort, organization, and pride of home — reliable and premium",
        "accentColor": "#C4A882",
        "accentColorName": "warm linen",
    },
    "Beauty & Personal Care": {
        "floatingEffect": "delicate rose petals or fine botanical mist floating softly near the product",
        "particleEffect": "soft pearl-shimmer particles near the base evoking luxury and self-care",
        "glowTone": "soft rose-pink halo glow",
        "emotion": "confidence, elegance, and self-care — aspirational and luxurious",
        "accentColor": "#D4A5A5",
        "accentColorName": "dusty rose",
    },
    "Health & Household": {
        "floatingEffect": "clean fresh-air particles or soft green botanical wisps near the product",
        "particleEffect": "fine white cleansing particles near the base suggesting purity and wellness",
        "glowTone": "crisp clean-white halo glow",
        "emotion": "vitality, cleanliness, and wellbeing — trustworthy and effective",
        "accentColor": "#5D8A6A",
        "accentColorName": "forest green",
    },
    "Sports & Outdoors": {
        "floatingEffect": "dynamic motion-streak particles or fine water droplets near the product",
        "particleEffect": "energetic fine particles near the base evoking speed and performance",
        "glowTone": "cool electric-blue edge glow",
        "emotion": "energy, performance, and achievement — powerful and inspiring",
        "accentColor": "#4A90D9",
        "accentColorName": "sky blue",
    },
    "Electronics": {
        "floatingEffect": "subtle geometric light particles or fine circuitry-inspired wisps near the product",
        "particleEffect": "cool blue-white light flecks near the base suggesting precision and technology",
        "glowTone": "cool blue-white edge glow",
        "emotion": "precision, innovation, and reliability — cutting-edge and dependable",
        "accentColor": "#2C3E50",
        "accentColorName": "deep slate",
    },
    "Toys & Games": {
        "floatingEffect": "playful colorful confetti or star-shaped sparkles floating near the product",
        "particleEffect": "bright multi-color particles near the base evoking fun and excitement",
        "glowTone": "warm cheerful amber glow",
        "emotion": "joy, excitement, and wonder — irresistibly fun and celebratory",
        "accentColor": "#F5A623",
        "accentColorName": "warm amber",
    },
    "Clothing": {
        "floatingEffect": "soft fabric wisps or fine thread filaments floating gently near the product",
        "particleEffect": "delicate lint-free textile particles near the base suggesting softness and quality",
        "glowTone": "soft warm-neutral halo glow",
        "emotion": "style, comfort, and confidence — effortlessly elegant",
        "accentColor": "#8E6B5A",
        "accentColorName": "warm taupe",
    },
    "Clothing & Apparel": {
        "floatingEffect": "soft fabric wisps or fine thread filaments floating gently near the product",
        "particleEffect": "delicate lint-free textile particles near the base suggesting softness and quality",
        "glowTone": "soft warm-neutral halo glow",
        "emotion": "style, comfort, and confidence — effortlessly elegant",
        "accentColor": "#8E6B5A",
        "accentColorName": "warm taupe",
    },
    "Baby": {
        "floatingEffect": "ultra-soft pastel mist or tiny star particles floating near the product",
        "particleEffect": "gentle pastel flecks near the base evoking softness and safety",
        "glowTone": "gentle pastel-blue or blush halo glow",
        "emotion": "tenderness, safety, and nurturing love — pure and reassuring",
        "accentColor": "#B8D4E8",
        "accentColorName": "soft sky blue",
    },
    "Baby Products": {
        "floatingEffect": "ultra-soft pastel mist or tiny star particles floating near the product",
        "particleEffect": "gentle pastel flecks near the base evoking softness and safety",
        "glowTone": "gentle pastel-blue or blush halo glow",
        "emotion": "tenderness, safety, and nurturing love — pure and reassuring",
        "accentColor": "#B8D4E8",
        "accentColorName": "soft sky blue",
    },
    "Automotive": {
        "floatingEffect": "sleek metallic light streaks or fine carbon-fiber particle wisps near the product",
        "particleEffect": "cool silver-grey precision particles near the base evoking engineering and performance",
        "glowTone": "cool chrome-silver edge glow",
        "emotion": "precision, performance, and pride of ownership — engineered for excellence",
        "accentColor": "#2C3E50",
        "accentColorName": "deep steel blue",
    },
    "Tools & Home Improvement": {
        "floatingEffect": "fine dust motes or metallic shavings floating purposefully near the product",
        "particleEffect": "bold orange-yellow safety particles near the base evoking power and reliability",
        "glowTone": "bold amber-orange edge glow",
        "emotion": "power, reliability, and craftsmanship — built to get the job done",
        "accentColor": "#E8A020",
        "accentColorName": "safety amber",
    },
    "Office Products": {
        "floatingEffect": "clean paper-white particles or fine ink-mist wisps near the product",
        "particleEffect": "crisp white and light grey particles near the base evoking order and clarity",
        "glowTone": "clean neutral-white halo glow",
        "emotion": "focus, organization, and productivity — clear-minded and efficient",
        "accentColor": "#4A6FA5",
        "accentColorName": "professional blue",
    },
    "Garden & Outdoor": {
        "floatingEffect": "soft botanical wisps or gentle pollen-like particles drifting near the product",
        "particleEffect": "fresh green and earth-tone particles near the base evoking nature and growth",
        "glowTone": "warm natural-green halo glow",
        "emotion": "connection to nature, growth, and outdoor joy — fresh and revitalizing",
        "accentColor": "#5A8A4A",
        "accentColorName": "garden green",
    },
    "Arts, Crafts & Sewing": {
        "floatingEffect": "vibrant confetti flecks or delicate thread wisps floating playfully near the product",
        "particleEffect": "multi-color creative particles near the base evoking inspiration and imagination",
        "glowTone": "warm creative amber-rose halo glow",
        "emotion": "creativity, expression, and the joy of making — inspiring and vibrant",
        "accentColor": "#C0657A",
        "accentColorName": "craft rose",
    },
    "Industrial & Scientific": {
        "floatingEffect": "precise geometric light particles or fine lab-grade mist near the product",
        "particleEffect": "cool blue-white precision particles near the base evoking accuracy and reliability",
        "glowTone": "cool clinical-blue edge glow",
        "emotion": "accuracy, trust, and scientific rigor — dependable and precisely engineered",
        "accentColor": "#1A6B8A",
        "accentColorName": "industrial teal",
    },
    "Musical Instruments": {
        "floatingEffect": "delicate sound-wave visualizations or fine wood-grain dust particles near the product",
        "particleEffect": "warm golden-bronze particles near the base evoking resonance and craftsmanship",
        "glowTone": "warm rich-amber halo glow",
        "emotion": "passion, artistry, and the thrill of music — resonant and inspiring",
        "accentColor": "#8B6914",
        "accentColorName": "instrument gold",
    },
    "Books & Media": {
        "floatingEffect": "soft paper-page wisps or tiny typographic particles floating near the product",
        "particleEffect": "warm cream and paper-white particles near the base evoking knowledge and discovery",
        "glowTone": "warm reading-lamp amber halo glow",
        "emotion": "curiosity, discovery, and the pleasure of learning — inviting and thoughtful",
        "accentColor": "#8B7355",
        "accentColorName": "aged parchment",
    },
    "Jewelry & Watches": {
        "floatingEffect": "delicate sparkle-light prisms or fine gemstone-shimmer particles near the product",
        "particleEffect": "luxury gold and diamond-light flecks near the base evoking opulence and desire",
        "glowTone": "glamorous warm-gold prismatic glow",
        "emotion": "luxury, desire, and timeless elegance — aspirational and precious",
        "accentColor": "#C9A84C",
        "accentColorName": "champagne gold",
    },
    "Shoes & Handbags": {
        "floatingEffect": "fine leather-grain dust or delicate fabric-texture wisps floating near the product",
        "particleEffect": "warm caramel and ivory particles near the base evoking craftsmanship and style",
        "glowTone": "warm leather-tone halo glow",
        "emotion": "style, sophistication, and the confidence of a great accessory — chic and desirable",
        "accentColor": "#8B5E3C",
        "accentColorName": "cognac leather",
    },
    "Food & Grocery": {
        "floatingEffect": "fresh herb wisps or fine ingredient particles drifting appetizingly near the product",
        "particleEffect": "warm golden and natural-tone particles near the base evoking freshness and flavor",
        "glowTone": "warm appetizing amber-gold halo glow",
        "emotion": "freshness, indulgence, and the pleasure of good food — inviting and flavorful",
        "accentColor": "#E8873A",
        "accentColorName": "harvest orange",
    },
    "DEFAULT": {
        "floatingEffect": "subtle light particles or fine natural wisps floating softly near the product",
        "particleEffect": "delicate neutral particles near the base suggesting quality and craftsmanship",
        "glowTone": "soft warm-white halo glow",
        "emotion": "quality, trust, and value — dependable and premium",
        "accentColor": "#8AA3B1",
        "accentColorName": "muted blue-grey",
    },
}

_COLORS = [
    "black", "white", "gray", "grey", "blue", "navy", "red", "green", "aqua",
    "teal", "ivory", "beige", "pink", "purple", "gold", "silver", "brown",
    "orange", "yellow", "cream", "charcoal", "rose", "sage", "olive",
]

_MATERIALS = [
    "stainless steel", "bamboo", "ceramic", "silicone", "leather", "linen",
    "glass", "wood", "aluminum", "polyester", "nylon", "rubber", "foam",
    "copper", "brass", "velvet", "microfiber", "cotton", "wool", "plastic",
    "merino", "cashmere", "fleece", "canvas", "mesh",
]


def _extract_color(title: str) -> str:
    title_lower = title.lower()
    return next((c for c in _COLORS if c in title_lower), "natural")


def _extract_material(title: str, bullets: list[str]) -> str:
    combined = (title + " " + " ".join(bullets)).lower()
    return next((m for m in _MATERIALS if m in combined), "premium")


def _clean_bullet(bullet: str | None, max_len: int = 60) -> str | None:
    if not bullet:
        return None
    cleaned = re.sub(r"[^a-zA-Z0-9\s\-–&,®™°%]", "", bullet).strip()
    return cleaned[:max_len] if cleaned else None


def _get_category_defaults(category: str | None) -> dict:
    if not category:
        return CATEGORY_DEFAULTS["DEFAULT"]
    if category in CATEGORY_DEFAULTS:
        return CATEGORY_DEFAULTS[category]
    for key in CATEGORY_DEFAULTS:
        if key != "DEFAULT" and key.lower() in category.lower():
            return CATEGORY_DEFAULTS[key]
    return CATEGORY_DEFAULTS["DEFAULT"]


def build_hero_prompt(product: dict, template_name: str = "Hero") -> str:
    """
    Build a scroll-stopping Amazon main image brief from scraped product data.

    product dict shape (from asin_lookup.py):
      title, brand, image_url, bullets (list[str]), category, asin, marketplace
    """
    title    = product.get("title") or "Product"
    category = product.get("category") or "General"
    bullets  = product.get("bullets") or []
    brand    = product.get("brand") or ""

    primary_color = _extract_color(title)
    material      = _extract_material(title, bullets)
    defaults      = _get_category_defaults(category)

    product_name = (
        f"{brand} {title}".strip()
        if brand and brand.lower() not in title.lower()
        else title
    )

    # Up to 3 key components from bullets for accessory description
    components = []
    for b in bullets[:3]:
        c = _clean_bullet(b, max_len=50)
        if c:
            components.append(c)
    components_text = "; ".join(components) if components else f"{category} components"

    return f"""Craft an iconic, Amazon-compliant main product image on a pristine white background (#FFFFFF), featuring ultra-high realism and flawless studio lighting.

PRODUCT: {product_name}
CATEGORY: {category}

--- HERO COMPOSITION ---
Camera angle: gentle 3/4 hero angle with a slight top-down tilt to reveal the product's depth, texture, and artisanal construction — both layers and structural features fully visible and three-dimensional.
Product placement: center the product large in frame, in its most open, welcoming, ready-to-use form revealing the premium {material} texture and {primary_color} color detail.
Frame fill: 85–90% of image area, no distortion.
The product dominates the frame with bold, crisp edges, precisely true-to-life color, and lifelike tactile detail — "so real you want to reach out and touch it" fidelity.

--- ACCESSORIES & VISUAL BALANCE ---
Neatly position any included components ({components_text}) just in front of or alongside the main product, angled to hint at their shape and quality.
Components must not obscure or visually compete with the main product — they reinforce completeness and category authority, not clutter.
Colors of all accessories echo the main product palette ({primary_color}, {defaults["accentColorName"]}) for unity.

--- LIGHTING & SHADOW ---
High-key, soft yet directional studio lighting — top-front 45 degrees — creating micro-detail in {material} surfaces and shape-defining shadowing in product folds and edges.
Edge-lighting adds luminosity and creates a sense of depth.
Anchor the product with a feather-soft, realistic cast shadow directly below for subtle lift and premium presence.
Every stitch, weave, surface detail, and edge: razor sharp.

--- COLOR & CLARITY ---
All {material} and surface colors true to life — rich yet soft saturation, {primary_color} dominant.
{defaults["accentColorName"]} ({defaults["accentColor"]}) as complementary accent.
No harsh contrast; muted natural palette throughout.

--- EMOTIONAL RESONANCE ---
{defaults["emotion"]}
The image should radiate serene confidence — making the customer believe "only the best" is in this product.

--- AMAZON COMPLIANCE ---
Pristine white (#FFFFFF) background — NO lifestyle props, NO text, NO badges, NO watermarks.
Full clarity and correct proportions, no distortion.
All key components visible but non-distracting.
Photorealistic commercial product photography — NOT illustration, NOT cartoon, NOT 3D render, NOT CGI.""".strip()
