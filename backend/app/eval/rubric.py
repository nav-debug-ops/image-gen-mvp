"""
Ecommerce Image Quality Evaluation Rubric
==========================================

Defines scoring dimensions, per-content-type weights, and anchor descriptions
for a 1–5 scale. Used by the LLM judge (judge.py) and the eval runner (runner.py).

Content types supported:
  - listing_main          Amazon main listing image
  - listing_secondary     Secondary/infographic listing images
  - aplus_content         A+ Content module images
  - brand_store           Brand Store hero/banner images
  - brand_story           Brand Story narrative images
"""

from dataclasses import dataclass, field


# ── Dimension Definitions ──────────────────────────────────────────────────────

@dataclass(frozen=True)
class Dimension:
    id: str
    name: str
    description: str
    anchors: dict[int, str]  # score → anchor text


# Core dimensions — scored for every content type
CORE_DIMENSIONS: list[Dimension] = [
    Dimension(
        id="prompt_relevance",
        name="Prompt Relevance",
        description=(
            "How faithfully does the image reflect the brief/prompt? "
            "Covers subject accuracy, specified elements, and intent."
        ),
        anchors={
            1: "Image bears little resemblance to the prompt. Key subjects or context are missing or wrong.",
            2: "Loosely matches the prompt. Major specified elements absent or incorrectly rendered.",
            3: "Mostly matches the prompt. Minor elements missing or ambiguous; overall intent conveyed.",
            4: "Strong match. Nearly all prompt elements present and accurately rendered.",
            5: "Exact match. Every specified element, mood, and context captured with precision.",
        },
    ),
    Dimension(
        id="aesthetic_quality",
        name="Aesthetic Quality",
        description=(
            "Composition, lighting, color harmony, and overall visual appeal. "
            "Assessed against professional commercial photography standards."
        ),
        anchors={
            1: "Poor composition, flat/harsh lighting, clashing colors, or amateur look.",
            2: "Below average visual quality. Noticeable issues with balance, lighting, or color.",
            3: "Acceptable aesthetics. Competent but unremarkable composition and lighting.",
            4: "Polished and professional. Strong composition, pleasing lighting, cohesive palette.",
            5: "Exceptional. Studio-quality aesthetics, striking composition, perfect color harmony.",
        },
    ),
    Dimension(
        id="commercial_viability",
        name="Commercial Viability",
        description=(
            "Likelihood this image drives purchase intent and conversion. "
            "Product is presented attractively, persuasively, and clearly for buyers."
        ),
        anchors={
            1: "Would not convert. Product unclear, unappealing, or confusing to buyers.",
            2: "Low conversion potential. Product present but not compelling or clearly presented.",
            3: "Moderate. Functional for commerce but lacks the persuasive impact of strong listings.",
            4: "High conversion potential. Product is clear, attractive, and motivates purchase intent.",
            5: "Exceptional conversion potential. Best-in-class presentation; clearly drives buyer action.",
        },
    ),
    Dimension(
        id="brand_safety",
        name="Brand Safety",
        description=(
            "Absence of harmful, offensive, misleading, or policy-violating content. "
            "Safe for all audiences and compliant with platform guidelines."
        ),
        anchors={
            1: "Contains harmful, offensive, or clearly policy-violating content. Cannot be used.",
            2: "Borderline content — potentially misleading claims or mildly inappropriate elements.",
            3: "Safe but contains minor ambiguities that could be questioned in certain contexts.",
            4: "Fully safe and appropriate. No issues for standard commercial use.",
            5: "Perfectly safe. Universally appropriate; sets a positive brand tone.",
        },
    ),
    Dimension(
        id="technical_quality",
        name="Technical Quality",
        description=(
            "Sharpness, resolution, artifact-free rendering, and absence of generation errors "
            "(blur, distortion, limb errors, text garbling, inconsistent edges)."
        ),
        anchors={
            1: "Severe technical issues: heavy blur, major artifacts, visible AI generation errors.",
            2: "Noticeable technical defects. Soft focus, some artifacts, or minor generation errors.",
            3: "Acceptable quality. Minor imperfections but generally clean and sharp.",
            4: "High technical quality. Sharp, clean, no visible artifacts.",
            5: "Flawless. Indistinguishable from professional photography at full resolution.",
        },
    ),
]

# Type-specific dimensions — scored only for the content type they belong to
TYPE_SPECIFIC_DIMENSIONS: dict[str, list[Dimension]] = {
    "listing_main": [
        Dimension(
            id="product_isolation",
            name="Product Isolation",
            description=(
                "Product appears on a pure white (#FFFFFF) or clean neutral background. "
                "Product is centered, fills 85%+ of frame, no text overlays, no props, "
                "no watermarks. Complies with Amazon main image guidelines."
            ),
            anchors={
                1: "Background is clearly not white/neutral. Heavy props, text, or lifestyle context present.",
                2: "Background close to white but off-white/grey. Minor props or shadows detract.",
                3: "Near-white background with acceptable shadows. Product centered but fill <85%.",
                4: "Clean white background, product well-centered, minor shadow acceptable.",
                5: "Perfect Amazon compliance: pure white bg, product fills 85%+ of frame, zero props or text.",
            },
        ),
    ],
    "listing_secondary": [
        Dimension(
            id="information_clarity",
            name="Information Clarity",
            description=(
                "Text callouts, benefit labels, feature arrows, and infographic elements "
                "are legible, scannable, and clearly communicate one focused message."
            ),
            anchors={
                1: "No clear message. Text unreadable or information layout confusing.",
                2: "Information present but poorly organised or hard to read at thumbnail size.",
                3: "One clear message, readable text, but layout or hierarchy could be stronger.",
                4: "Clear, well-organized information with strong visual hierarchy and legible callouts.",
                5: "Exceptional clarity. Instantly scannable message; text crisp at all sizes; perfect hierarchy.",
            },
        ),
    ],
    "aplus_content": [
        Dimension(
            id="brand_consistency",
            name="Brand Consistency",
            description=(
                "Image aligns with the brand's visual language — palette, typography style, "
                "tone, and overall aesthetic fit within a coherent brand system."
            ),
            anchors={
                1: "Visually disconnected from any brand identity. Generic or off-brand.",
                2: "Weak brand signals. Some on-brand elements but inconsistent application.",
                3: "Recognisable brand direction with minor inconsistencies in palette or tone.",
                4: "Strong brand alignment. Palette, tone, and visual style cohesive.",
                5: "Exemplary brand expression. Could be a brand guideline reference image.",
            },
        ),
    ],
    "brand_store": [
        Dimension(
            id="visual_hierarchy",
            name="Visual Hierarchy",
            description=(
                "Clear focal point, logical flow from hero to supporting content. "
                "Navigation intent is obvious; the eye moves naturally through the store layout."
            ),
            anchors={
                1: "No discernible hierarchy. Eye has no natural path; content feels random.",
                2: "Weak hierarchy. Focal point unclear or competing elements distract.",
                3: "Some hierarchy present. Primary focus identifiable but flow not optimized.",
                4: "Strong hierarchy. Clear hero, supporting content logically ordered.",
                5: "Magazine-quality layout. Effortless visual flow; professional store-front presence.",
            },
        ),
    ],
    "brand_story": [
        Dimension(
            id="emotional_resonance",
            name="Emotional Resonance",
            description=(
                "The image evokes a clear emotional response aligned with the brand's desired "
                "feeling — aspiration, warmth, trust, excitement, authenticity, etc."
            ),
            anchors={
                1: "No emotional impact. Flat, generic, or emotionally neutral/negative.",
                2: "Weak emotional pull. Intended feeling vaguely present but not convincing.",
                3: "Moderate resonance. Emotion conveyed but not memorable or deeply felt.",
                4: "Strong emotional impact. Viewer clearly feels the intended brand emotion.",
                5: "Exceptional. Immediately evokes a powerful, brand-aligned emotional response.",
            },
        ),
        Dimension(
            id="narrative_cohesion",
            name="Narrative Cohesion",
            description=(
                "The image tells a clear story or contributes meaningfully to a visual narrative arc. "
                "Context, characters, and setting work together to convey a unified message."
            ),
            anchors={
                1: "No story. Disparate elements without coherent narrative.",
                2: "Fragmented narrative. Some story elements present but disconnected.",
                3: "A story is readable, but the narrative is predictable or under-developed.",
                4: "Clear, engaging narrative. Setting, subject, and mood work in harmony.",
                5: "Compelling story. Every element intentionally serves the narrative; memorable.",
            },
        ),
    ],
}


# ── Content-Type Scoring Profiles ─────────────────────────────────────────────

@dataclass
class ContentTypeProfile:
    id: str
    name: str
    purpose: str
    dimensions: list[str]        # ordered list of dimension IDs
    weights: dict[str, float]    # dimension_id → weight (must sum to 1.0)
    pass_threshold: float = 3.5  # weighted composite score to pass


CONTENT_TYPE_PROFILES: dict[str, ContentTypeProfile] = {

    "listing_main": ContentTypeProfile(
        id="listing_main",
        name="Listing Main Image",
        purpose=(
            "The primary hero image for an Amazon product listing. "
            "Must meet strict Amazon technical guidelines: pure white background, "
            "product-only (no props/text), product fills ≥85% of frame. "
            "This image drives click-through rate directly — technical compliance and "
            "commercial clarity are the highest priorities."
        ),
        dimensions=[
            "technical_quality",
            "product_isolation",
            "commercial_viability",
            "prompt_relevance",
            "aesthetic_quality",
            "brand_safety",
        ],
        weights={
            "technical_quality":    0.25,  # Non-negotiable — blur/artifacts = rejection
            "product_isolation":    0.25,  # Non-negotiable — platform compliance
            "commercial_viability": 0.20,  # CTR impact
            "prompt_relevance":     0.15,  # Must match the product brief
            "aesthetic_quality":    0.10,  # Secondary — clean > stylish for main images
            "brand_safety":         0.05,  # Table stakes
        },
    ),

    "listing_secondary": ContentTypeProfile(
        id="listing_secondary",
        name="Listing Secondary Images",
        purpose=(
            "Supporting infographic, lifestyle, and feature images in an Amazon listing carousel. "
            "These images educate and persuade — buyers who reach them are already interested. "
            "Each image must communicate one clear message quickly. Information clarity and "
            "commercial persuasion are the key drivers."
        ),
        dimensions=[
            "information_clarity",
            "commercial_viability",
            "prompt_relevance",
            "aesthetic_quality",
            "technical_quality",
            "brand_safety",
        ],
        weights={
            "information_clarity":  0.25,  # Must convey a clear message
            "commercial_viability": 0.25,  # Still selling at every slide
            "prompt_relevance":     0.20,  # Must match the image type brief
            "aesthetic_quality":    0.15,  # Professional look builds trust
            "technical_quality":    0.10,  # Adequate quality expected
            "brand_safety":         0.05,
        },
    ),

    "aplus_content": ContentTypeProfile(
        id="aplus_content",
        name="A+ Content Images",
        purpose=(
            "Premium brand content modules displayed below the main listing on Amazon. "
            "A+ content differentiates premium brands through storytelling and brand identity. "
            "Brand visual consistency and strong aesthetics build trust and justify premium pricing. "
            "These images must integrate with module layouts and maintain brand cohesion."
        ),
        dimensions=[
            "brand_consistency",
            "aesthetic_quality",
            "commercial_viability",
            "prompt_relevance",
            "technical_quality",
            "brand_safety",
        ],
        weights={
            "brand_consistency":    0.25,  # Brand identity is the A+ differentiator
            "aesthetic_quality":    0.25,  # Premium feel justifies brand investment
            "commercial_viability": 0.20,  # Still needs to convert
            "prompt_relevance":     0.15,  # Match the module brief
            "technical_quality":    0.10,  # Must be crisp at desktop + mobile
            "brand_safety":         0.05,
        },
    ),

    "brand_store": ContentTypeProfile(
        id="brand_store",
        name="Brand Store Images",
        purpose=(
            "Hero and banner images inside an Amazon Brand Store — the brand's dedicated storefront. "
            "These images set the store's visual tone and guide shoppers through a curated experience. "
            "Strong visual hierarchy drives store navigation, dwell time, and cross-sell. "
            "Brand safety is elevated here as the store is entirely associated with the brand."
        ),
        dimensions=[
            "visual_hierarchy",
            "aesthetic_quality",
            "commercial_viability",
            "brand_safety",
            "prompt_relevance",
            "technical_quality",
        ],
        weights={
            "visual_hierarchy":     0.30,  # Store navigation depends on clear layout
            "aesthetic_quality":    0.25,  # Store hero sets the brand premium bar
            "commercial_viability": 0.20,  # Still driving category browsing
            "brand_safety":         0.15,  # Elevated — entire brand reputation on display
            "prompt_relevance":     0.05,
            "technical_quality":    0.05,
        },
    ),

    "brand_story": ContentTypeProfile(
        id="brand_story",
        name="Brand Story Images",
        purpose=(
            "Narrative images for Amazon Brand Story modules — a scrollable storytelling section "
            "that communicates the brand's origin, mission, and personality. "
            "These images must evoke emotion and weave a coherent narrative arc across the module. "
            "Technical perfection is less critical than authentic feeling and storytelling cohesion."
        ),
        dimensions=[
            "emotional_resonance",
            "narrative_cohesion",
            "aesthetic_quality",
            "commercial_viability",
            "brand_safety",
            "prompt_relevance",
            "technical_quality",
        ],
        weights={
            "emotional_resonance":  0.25,  # The core Brand Story KPI
            "narrative_cohesion":   0.25,  # Story arc coherence
            "aesthetic_quality":    0.20,  # Cinematic/editorial feel expected
            "commercial_viability": 0.15,  # Soft sell — brand affinity → conversion
            "brand_safety":         0.10,  # Elevated — personal brand values visible
            "prompt_relevance":     0.03,
            "technical_quality":    0.02,  # Authenticity > perfection for story images
        },
    ),
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_profile(content_type: str) -> ContentTypeProfile:
    """Return the ContentTypeProfile for a given content type ID."""
    profile = CONTENT_TYPE_PROFILES.get(content_type)
    if profile is None:
        valid = list(CONTENT_TYPE_PROFILES.keys())
        raise ValueError(f"Unknown content_type '{content_type}'. Valid: {valid}")
    return profile


def get_all_dimensions_for(content_type: str) -> list[Dimension]:
    """Return all Dimension objects relevant to a content type (core + type-specific)."""
    profile = get_profile(content_type)
    dim_ids = set(profile.dimensions)

    all_dims: list[Dimension] = []
    for d in CORE_DIMENSIONS:
        if d.id in dim_ids:
            all_dims.append(d)
    for d in TYPE_SPECIFIC_DIMENSIONS.get(content_type, []):
        if d.id in dim_ids:
            all_dims.append(d)

    return all_dims


def compute_weighted_score(scores: dict[str, float], content_type: str) -> float:
    """
    Compute the weighted composite score from a dimension score dict.
    Returns a float between 1.0 and 5.0, rounded to 2 decimal places.
    """
    profile = get_profile(content_type)
    total = 0.0
    total_weight = 0.0
    for dim_id, weight in profile.weights.items():
        if dim_id in scores:
            total += scores[dim_id] * weight
            total_weight += weight
    if total_weight == 0:
        return 0.0
    return round(total / total_weight, 2)


VALID_CONTENT_TYPES = list(CONTENT_TYPE_PROFILES.keys())
