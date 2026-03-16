"""
Dynamic Amazon hero image prompt builder.
Takes scraped product data and produces a rich, structured Imagen 3 prompt
tailored to the product's category, color, material, and key features.
"""
import re

# Per-category aesthetic defaults
CATEGORY_DEFAULTS = {
    "Pet Supplies": {
        "targetEmotion": "comfort and gentle care",
        "naturalAccent": "a small daisy or wildflower",
        "accentColor": "#A3B18A",
        "targetAudience": "pet owners, eco-conscious families",
    },
    "Kitchen & Dining": {
        "targetEmotion": "freshness, warmth, and daily joy",
        "naturalAccent": "a sprig of fresh herbs",
        "accentColor": "#C4A882",
        "targetAudience": "home cooks, health-conscious adults 25–55",
    },
    "Home & Kitchen": {
        "targetEmotion": "freshness, warmth, and daily joy",
        "naturalAccent": "a sprig of fresh herbs",
        "accentColor": "#C4A882",
        "targetAudience": "home cooks, health-conscious adults 25–55",
    },
    "Beauty & Personal Care": {
        "targetEmotion": "self-care and confidence",
        "naturalAccent": "a single rose petal or botanical leaf",
        "accentColor": "#D4A5A5",
        "targetAudience": "women 18–45, skincare enthusiasts",
    },
    "Health & Household": {
        "targetEmotion": "wellbeing, cleanliness, and vitality",
        "naturalAccent": "a green botanical sprig",
        "accentColor": "#5D8A6A",
        "targetAudience": "health-conscious adults 30–60",
    },
    "Sports & Outdoors": {
        "targetEmotion": "energy, performance, and achievement",
        "naturalAccent": "a subtle motion-blur trail",
        "accentColor": "#4A90D9",
        "targetAudience": "active adults 18–45, fitness enthusiasts",
    },
    "Electronics": {
        "targetEmotion": "precision, innovation, and reliability",
        "naturalAccent": "subtle geometric accent lines",
        "accentColor": "#2C3E50",
        "targetAudience": "tech enthusiasts, professionals 25–50",
    },
    "Toys & Games": {
        "targetEmotion": "fun, joy, and excitement",
        "naturalAccent": "colorful confetti or playful shapes",
        "accentColor": "#F5A623",
        "targetAudience": "parents of children 3–12, gift buyers",
    },
    "Clothing": {
        "targetEmotion": "style, comfort, and confidence",
        "naturalAccent": "a folded fabric texture detail",
        "accentColor": "#8E6B5A",
        "targetAudience": "fashion-conscious adults 18–45",
    },
    "Baby": {
        "targetEmotion": "softness, safety, and nurturing",
        "naturalAccent": "a small plush toy or pastel ribbon",
        "accentColor": "#B8D4E8",
        "targetAudience": "new parents, baby shower gift buyers",
    },
    "Garden & Outdoor": {
        "targetEmotion": "freshness, nature, and growth",
        "naturalAccent": "a small potted succulent or pebbles",
        "accentColor": "#7EA97A",
        "targetAudience": "home gardeners, outdoor living enthusiasts",
    },
    "DEFAULT": {
        "targetEmotion": "quality and trust",
        "naturalAccent": "a subtle botanical accent",
        "accentColor": "#8AA3B1",
        "targetAudience": "value-conscious online shoppers",
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
]


def _extract_color(title: str) -> str:
    title_lower = title.lower()
    return next((c for c in _COLORS if c in title_lower), "natural")


def _extract_material(bullets: list[str]) -> str:
    combined = " ".join(bullets).lower()
    return next((m for m in _MATERIALS if m in combined), "premium")


def _clean_bullet(bullet: str | None) -> str | None:
    if not bullet:
        return None
    cleaned = re.sub(r"[^a-zA-Z0-9\s\-–&,]", "", bullet).strip()
    return cleaned[:60] if cleaned else None


def _get_category_defaults(category: str | None) -> dict:
    if not category:
        return CATEGORY_DEFAULTS["DEFAULT"]
    if category in CATEGORY_DEFAULTS:
        return CATEGORY_DEFAULTS[category]
    # Partial match
    for key in CATEGORY_DEFAULTS:
        if key != "DEFAULT" and key.lower() in category.lower():
            return CATEGORY_DEFAULTS[key]
    return CATEGORY_DEFAULTS["DEFAULT"]


def build_hero_prompt(product: dict, template_name: str = "Plain White Background") -> str:
    """
    Build a rich Imagen 3 prompt from scraped Amazon product data.

    product dict shape (from asin_lookup.py):
      title, brand, image_url, bullets (list), category, asin, marketplace
    """
    title = product.get("title") or "Product"
    category = product.get("category") or "General"
    bullets = product.get("bullets") or []
    brand = product.get("brand") or ""

    primary_color = _extract_color(title)
    material = _extract_material(bullets)
    defaults = _get_category_defaults(category)

    key_feature1 = _clean_bullet(bullets[0]) if len(bullets) > 0 else "Premium Quality"
    key_feature2 = _clean_bullet(bullets[1]) if len(bullets) > 1 else "Complete Kit Included"
    key_feature3 = _clean_bullet(bullets[2]) if len(bullets) > 2 else category

    product_name = (
        f"{brand} {title}".strip()
        if brand and brand.lower() not in title.lower()
        else title
    )

    return f"""Photorealistic commercial Amazon hero product image, 300 DPI, square format.

PRODUCT: {product_name}
CATEGORY: {category}

COMPOSITION:
- {template_name} layout. Front-right three-quarter angle, product fills 80-85% of frame.
- Show product in its most open or ready-to-use state to reveal {material} texture and {primary_color} color.
- Arrange any included accessories naturally around the hero product on a flat surface.
- Background: pure white HEX #FFFFFF or soft ivory HEX #FAFAF5. No lifestyle backgrounds.

NATURAL ACCENT:
- Place {defaults["naturalAccent"]} at the product base, physically grounded, no floating elements.

LIGHTING & MOOD:
- Soft diffused natural side lighting evoking {defaults["targetEmotion"]}.
- Warm studio-quality shadows directly beneath the product.
- Subtle vignette at edges to draw focus to center.

HANGTAG BADGE (physical swing-tag, NOT a digital overlay):
- Real swing-tag overlapping the bottom-right product edge.
- Badge color: {defaults["accentColor"]}. Font: Montserrat. Text color: white.
- Line 1: {key_feature1 or "Premium Quality"}
- Line 2: {key_feature2 or "Complete Kit Included"}
- Line 3: {key_feature3 or category}
- Tag is slightly angled, string-attached, partially behind product edge — looks physically real.

STYLE RULES:
- Accent colors only: {defaults["accentColor"]}, {primary_color}, ivory. Nothing else.
- Target aesthetic resonates with: {defaults["targetAudience"]}.
- Photorealistic product photography, ultra-sharp focus.
- NOT illustration, NOT cartoon, NOT 3D render, NOT CGI.
- No floating text, no digital banners, no false claims.""".strip()
