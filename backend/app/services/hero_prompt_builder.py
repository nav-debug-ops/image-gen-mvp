"""
Dynamic Amazon hero image prompt builder.
Applies a detailed, structured commercial photography brief to any product
scraped from Amazon — composition, lighting, labeling, compliance all fixed;
product name, bullets, colors, materials, and accents injected dynamically.
"""
import re

# Per-category accent colors, natural props, and emotional tone
CATEGORY_DEFAULTS = {
    "Pet Supplies": {
        "accentColor": "#A3B18A",
        "accentColorName": "sage green",
        "naturalAccent": "a single pressed wildflower or small sprig of natural leaves",
        "targetEmotion": "comfort, warmth, and dignified farewell",
        "targetAudience": "pet owners, eco-conscious families",
    },
    "Kitchen & Dining": {
        "accentColor": "#C4A882",
        "accentColorName": "warm linen",
        "naturalAccent": "a small sprig of fresh herbs or a lemon slice",
        "targetEmotion": "freshness, warmth, and daily joy",
        "targetAudience": "home cooks, health-conscious adults 25–55",
    },
    "Home & Kitchen": {
        "accentColor": "#C4A882",
        "accentColorName": "warm linen",
        "naturalAccent": "a small sprig of fresh herbs",
        "targetEmotion": "freshness, warmth, and daily joy",
        "targetAudience": "home cooks, health-conscious adults 25–55",
    },
    "Beauty & Personal Care": {
        "accentColor": "#D4A5A5",
        "accentColorName": "dusty rose",
        "naturalAccent": "a single rose petal or botanical leaf",
        "targetEmotion": "self-care and confidence",
        "targetAudience": "women 18–45, skincare enthusiasts",
    },
    "Health & Household": {
        "accentColor": "#5D8A6A",
        "accentColorName": "forest green",
        "naturalAccent": "a small green botanical sprig",
        "targetEmotion": "wellbeing, cleanliness, and vitality",
        "targetAudience": "health-conscious adults 30–60",
    },
    "Sports & Outdoors": {
        "accentColor": "#4A90D9",
        "accentColorName": "sky blue",
        "naturalAccent": "a subtle pine sprig or smooth river stone",
        "targetEmotion": "energy, performance, and achievement",
        "targetAudience": "active adults 18–45, fitness enthusiasts",
    },
    "Electronics": {
        "accentColor": "#2C3E50",
        "accentColorName": "deep slate",
        "naturalAccent": "a subtle geometric accent piece",
        "targetEmotion": "precision, innovation, and reliability",
        "targetAudience": "tech enthusiasts, professionals 25–50",
    },
    "Toys & Games": {
        "accentColor": "#F5A623",
        "accentColorName": "warm amber",
        "naturalAccent": "a small colorful ribbon or playful accent",
        "targetEmotion": "fun, joy, and excitement",
        "targetAudience": "parents of children 3–12, gift buyers",
    },
    "Clothing": {
        "accentColor": "#8E6B5A",
        "accentColorName": "warm taupe",
        "naturalAccent": "a folded fabric swatch or ribbon detail",
        "targetEmotion": "style, comfort, and confidence",
        "targetAudience": "fashion-conscious adults 18–45",
    },
    "Baby": {
        "accentColor": "#B8D4E8",
        "accentColorName": "soft sky blue",
        "naturalAccent": "a small pastel ribbon or soft knitted accent",
        "targetEmotion": "softness, safety, and nurturing",
        "targetAudience": "new parents, baby shower gift buyers",
    },
    "Garden & Outdoor": {
        "accentColor": "#7EA97A",
        "accentColorName": "fresh sage",
        "naturalAccent": "a small succulent or smooth pebbles",
        "targetEmotion": "freshness, nature, and growth",
        "targetAudience": "home gardeners, outdoor living enthusiasts",
    },
    "DEFAULT": {
        "accentColor": "#8AA3B1",
        "accentColorName": "muted blue-grey",
        "naturalAccent": "a subtle botanical sprig",
        "targetEmotion": "quality and trust",
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


def _clean_bullet(bullet: str | None, max_len: int = 55) -> str | None:
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


def build_hero_prompt(product: dict, template_name: str = "Flat-lay") -> str:
    """
    Build a detailed commercial photography brief from scraped Amazon product data.

    product dict shape (from asin_lookup.py):
      title, brand, image_url, bullets (list[str]), category, asin, marketplace
    """
    title    = product.get("title") or "Product"
    category = product.get("category") or "General"
    bullets  = product.get("bullets") or []
    brand    = product.get("brand") or ""

    primary_color = _extract_color(title)
    material      = _extract_material(bullets)
    defaults      = _get_category_defaults(category)

    product_name = (
        f"{brand} {title}".strip()
        if brand and brand.lower() not in title.lower()
        else title
    )

    # Box bullets — use up to 4 real bullets, pad with generic if fewer
    box_bullets = []
    for b in bullets[:4]:
        cleaned = _clean_bullet(b)
        if cleaned:
            box_bullets.append(f"• {cleaned}")
    while len(box_bullets) < 3:
        box_bullets.append(f"• Premium {category} Product")

    box_bullets_text = "\n    ".join(box_bullets)

    # Hangtag badge lines
    badge1 = _clean_bullet(bullets[0]) if bullets else "Premium Quality"
    badge2 = _clean_bullet(bullets[1]) if len(bullets) > 1 else "Complete Kit Included"
    badge3 = _clean_bullet(bullets[2]) if len(bullets) > 2 else category

    return f"""Photorealistic commercial Amazon main listing image, 2000x2000px, 300 DPI, square format.

PRODUCT: {product_name}
CATEGORY: {category}

--- OVERALL COMPOSITION ---
- Flat-lay arrangement on a pure white (#FFFFFF) background per Amazon TOS.
- All product contents and packaging fanned out neatly, balanced, demonstrating kit completeness.
- Soft, bright, natural lighting from above-right with gentle realistic shadows.
- Subtle soft shine on {material} surfaces for premium appeal; all textures clearly visible.

--- HERO PRODUCT & CONTENTS PLACEMENT ---
- Main product laid out slightly left of center, perfectly proportioned, tidy and reassuring.
- {primary_color.capitalize()} coloring and {material} texture clearly visible throughout.
- All included components arranged at right angles for geometric harmony.
- Each component labeled below it in a soft {defaults["accentColorName"]} banner, Montserrat Semi-Bold font, HEX {defaults["accentColor"]}.
- Items sized and spaced for easy visual inspection — no clutter.

--- RETAIL BOX PLACEMENT ---
- Box placed slightly back and right, face-front, angled ~15° left to show depth.
- Eco-friendly cues on box (recycled texture, natural color palette).
- Box front shows product name in high-contrast {defaults["accentColorName"]}, Montserrat Semi-Bold:
  "{product_name}"
- Short bullets on box front:
    {box_bullets_text}
- Bottom-right of box: round badge "100% Quality Guaranteed" in {defaults["accentColorName"]} on ivory, Montserrat font.

--- ACCESSORY LABELS ---
- Every visible component receives a small {defaults["accentColorName"]} text label in Montserrat Semi-Bold, HEX {defaults["accentColor"]}, for mobile legibility.
- No floating text other than component labels and packaging print.
- All labels in clear English.

--- PROPS & EMOTIONAL ACCENT ---
- Place {defaults["naturalAccent"]} at the lower front corner, angled naturally, casting a soft shadow.
- Prop is subtle, grounded, and reinforces the {defaults["targetEmotion"]} theme.
- Target aesthetic resonates with: {defaults["targetAudience"]}.

--- LIGHTING & SURFACE ---
- Clean diffuse white studio lighting, premium feel, gentle realistic reflections on {material} and packaging.
- All edges sharp; shadows only under products and props — soft and natural.
- Product displayed atop pale natural-wood tabletop or subtle faux-wood texture; table edges softly visible but fades into white background.
- Muted, natural color palette dominated by {primary_color} and {defaults["accentColorName"]}; no harsh contrast or oversaturated hues.

--- HANGTAG BADGE (physical swing-tag on product, NOT a digital overlay) ---
- Real swing-tag overlapping bottom-right product edge, slightly angled, string-attached, partially behind product.
- Badge color: {defaults["accentColor"]}. Font: Montserrat. Text color: white.
- Line 1: {badge1 or "Premium Quality"}
- Line 2: {badge2 or "Complete Kit Included"}
- Line 3: {badge3 or category}

--- AMAZON COMPLIANCE ---
- No floating text anywhere on background — text only on packaging or as grounded kit-part labels.
- No watermarks, no hands, no lifestyle background beyond the faint tabletop texture.
- All elements are realistic photographic renderings — no digital stickers or icons off-product.
- Product and box fill at least 85% of frame height.
- All label and badge text at least 26px tall for mobile legibility.
- Photorealistic product photography, ultra-sharp focus.
- NOT illustration, NOT cartoon, NOT 3D render, NOT CGI.""".strip()
