"""
Amazon ASIN product lookup via scraping.
Fetches title, brand, image, and bullet points from a product page.
Results are cached in-memory per (asin, marketplace) for 30 minutes
to reduce repeated scrapes and lower CAPTCHA risk.
"""
import json
import re
import time
import httpx
from bs4 import BeautifulSoup

# ── In-memory cache ────────────────────────────────────────────────────────────
_cache: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = 1800  # 30 minutes


def _cache_key(asin: str, marketplace: str) -> str:
    return f"{asin.upper()}:{marketplace.upper()}"


def _get_cached(asin: str, marketplace: str) -> dict | None:
    key = _cache_key(asin, marketplace)
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            # Invalidate entries that pre-date the detected_category field
            if "detected_category" not in data:
                del _cache[key]
                return None
            return data
        del _cache[key]
    return None


def _set_cached(asin: str, marketplace: str, data: dict) -> None:
    _cache[_cache_key(asin, marketplace)] = (time.time(), data)


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "max-age=0",
}

# Parsers to try in order
_PARSERS = ["lxml", "html.parser"]

MARKETPLACE_DOMAINS = {
    "US": "amazon.com",
    "UK": "amazon.co.uk",
    "DE": "amazon.de",
    "FR": "amazon.fr",
    "JP": "amazon.co.jp",
    "CA": "amazon.ca",
    "IT": "amazon.it",
    "ES": "amazon.es",
    "MX": "amazon.com.mx",
    "AU": "amazon.com.au",
    "IN": "amazon.in",
    "CN": "amazon.cn",
    "NL": "amazon.nl",
    "SE": "amazon.se",
    "PL": "amazon.pl",
    "BE": "amazon.com.be",
    "SG": "amazon.sg",
    "AE": "amazon.ae",
    "SA": "amazon.sa",
    "BR": "amazon.com.br",
    "TR": "amazon.com.tr",
}


async def lookup_asin(asin: str, marketplace: str = "US") -> dict:
    """
    Fetch product data from Amazon for a given ASIN.
    Returns a dict with title, brand, image_url, bullets, category.
    Results are cached for 30 minutes to reduce scraping frequency.
    Raises ValueError for any known failure so callers get a 404 with a message.
    """
    # Return cached result if available
    cached = _get_cached(asin, marketplace)
    if cached is not None:
        return cached

    domain = MARKETPLACE_DOMAINS.get(marketplace.upper(), "amazon.com")
    url = f"https://www.{domain}/dp/{asin}?th=1&psc=1"

    try:
        async with httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            headers=HEADERS,
        ) as client:
            response = await client.get(url)
    except httpx.TimeoutException:
        raise ValueError("Request to Amazon timed out. Please try again.")
    except httpx.ConnectError:
        raise ValueError("Could not connect to Amazon. Check your internet connection and try again.")
    except httpx.RemoteProtocolError as e:
        raise ValueError(f"Amazon returned an unexpected response. Try again. ({e})")
    except httpx.HTTPError as e:
        raise ValueError(f"Network error contacting Amazon: {e}")

    if response.status_code == 404:
        raise ValueError(f"ASIN {asin} not found on Amazon {marketplace}.")

    if response.status_code == 503:
        raise ValueError("Amazon is temporarily unavailable (503). Wait a moment and try again.")

    if response.status_code != 200:
        raise ValueError(
            f"Amazon returned HTTP {response.status_code}. "
            "The product may be unavailable or the marketplace may be incorrect."
        )

    html = response.text
    if not html or len(html) < 200:
        raise ValueError("Amazon returned an empty page. Please try again.")

    # Try parsers in order; fall back to html.parser if lxml is unavailable
    soup = None
    for parser in _PARSERS:
        try:
            soup = BeautifulSoup(html, parser)
            break
        except Exception:
            continue

    if soup is None:
        raise ValueError("Failed to parse the Amazon product page. Please try again.")

    # Check for CAPTCHA / robot detection
    page_title = soup.title.string if soup.title else ""
    is_captcha = (
        soup.select_one("form[action*='captcha']")
        or soup.select_one("#captchacharacters")
        or "robot check" in page_title.lower()
        or "automated" in page_title.lower()
        or "captcha" in page_title.lower()
    )
    if is_captcha:
        raise ValueError("Amazon is temporarily blocking automated requests. Wait a moment and try again.")

    # --- Title ---
    title = _extract_title(soup)
    if not title:
        raise ValueError(
            "Could not read product title — Amazon may have changed its page layout "
            "or this product is region-restricted. Try a different ASIN or marketplace."
        )

    # --- Brand ---
    brand = _extract_brand(soup)

    # --- Main image ---
    image_url = _extract_image(soup)

    # --- Bullet points ---
    bullets = _extract_bullets(soup)

    # --- Category breadcrumb ---
    category = _extract_category(soup)
    full_breadcrumb = _extract_category_breadcrumb(soup)

    # --- JSON-LD structured data (highest confidence when present) ---
    jsonld_category = _extract_jsonld_category(soup)

    # --- Best Sellers Rank categories (explicitly names the department) ---
    bsr_categories = _extract_bsr_categories(soup)

    # --- Product details table (Department / Product Type fields) ---
    product_type = _extract_product_type(soup)

    detected_category = _detect_canonical_category(
        title=title or "",
        raw_category=full_breadcrumb or category,
        bullets=bullets,
        bsr_categories=bsr_categories,
        product_type=product_type,
        jsonld_category=jsonld_category,
    )

    print(f"[ASIN] jsonld='{jsonld_category}' breadcrumb='{full_breadcrumb}' bsr={bsr_categories} product_type='{product_type}' -> '{detected_category}'")

    result = {
        "asin": asin,
        "title": title,
        "brand": brand,
        "image_url": image_url,
        "bullets": bullets,
        "category": category,
        "detected_category": detected_category,
        "marketplace": marketplace,
        "source_url": url,
    }
    _set_cached(asin, marketplace, result)
    return result


def _extract_title(soup: BeautifulSoup) -> str | None:
    selectors = ["#productTitle", "span#productTitle", "h1#title span"]
    for sel in selectors:
        el = soup.select_one(sel)
        if el and el.get_text(strip=True):
            return el.get_text(strip=True)
    return None


def _extract_brand(soup: BeautifulSoup) -> str | None:
    selectors = [
        "#bylineInfo",
        "a#bylineInfo",
        "span.a-size-base.po-break-word",
        "tr.po-brand td.a-span9 span",
    ]
    for sel in selectors:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)
            # Strip "Brand: " prefix if present
            text = re.sub(r"^(Brand:|Visit the|Store)[\s:]+", "", text, flags=re.IGNORECASE).strip()
            if text:
                return text
    return None


def _extract_image(soup: BeautifulSoup) -> str | None:
    # Primary: landing image with high-res data attribute
    img = soup.select_one("#landingImage")
    if img:
        for attr in ("data-old-hires", "data-a-hires", "src"):
            url = img.get(attr, "")
            if url and url.startswith("http"):
                return url

    # Fallback: any large product image
    img = soup.select_one("#imgTagWrapperId img, #imageBlock img")
    if img:
        src = img.get("src", "")
        if src and src.startswith("http"):
            return src

    return None


def _extract_bullets(soup: BeautifulSoup) -> list[str]:
    bullets = []
    items = soup.select("#feature-bullets ul li span.a-list-item")
    for item in items:
        text = item.get_text(strip=True)
        if text and len(text) > 5 and "see more" not in text.lower():
            bullets.append(text)
    return bullets[:6]  # Cap at 6 bullets


_BREADCRUMB_SELECTORS = [
    "#wayfinding-breadcrumbs_feature_div ul li span.a-list-item a",
    "#wayfinding-breadcrumbs_feature_div li span a",
    ".a-breadcrumb li.a-breadcrumb-divider ~ li a",
    ".a-breadcrumb a",
    "#nav-subnav a.nav-a",
]


def _extract_breadcrumb_nodes(soup: BeautifulSoup) -> list[str]:
    """Try multiple selectors to extract breadcrumb text nodes."""
    for selector in _BREADCRUMB_SELECTORS:
        els = soup.select(selector)
        if els:
            nodes = [el.get_text(strip=True) for el in els if el.get_text(strip=True)]
            if nodes:
                return nodes
    return []


def _extract_category(soup: BeautifulSoup) -> str | None:
    """Return the last breadcrumb node (most specific category label)."""
    nodes = _extract_breadcrumb_nodes(soup)
    return nodes[-1] if nodes else None


def _extract_category_breadcrumb(soup: BeautifulSoup) -> str | None:
    """Return the full breadcrumb path joined by spaces for detection.
    e.g. 'Sports & Outdoors Running Road Running Shoes'"""
    nodes = _extract_breadcrumb_nodes(soup)
    return " ".join(nodes) if nodes else None


def _extract_bsr_categories(soup: BeautifulSoup) -> list[str]:
    """
    Extract category names from the Best Sellers Rank section.
    BSR lines look like: '#1,234 in Sports & Outdoors (See Top 100...)'
    These explicitly name the Amazon department — most reliable category signal.
    """
    results = []

    # Selector targets both the detail bullets and the product details table
    bsr_selectors = [
        "#detailBulletsWrapper_feature_div",
        "#productDetails_detailBullets_sections1",
        "#productDetails_db_sections",
        "#SalesRank",
        "#productDetails_techSpec_section_2",
    ]

    bsr_text = ""
    for sel in bsr_selectors:
        el = soup.select_one(sel)
        if el:
            bsr_text = el.get_text(" ", strip=True)
            if "best seller" in bsr_text.lower() or "sales rank" in bsr_text.lower():
                break

    if not bsr_text:
        return results

    # Pattern: '#N,NNN in Category Name (See...' or 'N in Category Name'
    pattern = re.compile(r"#?[\d,]+\s+in\s+([A-Za-z &,\-]+?)(?:\s*\(|$|\s+#)", re.IGNORECASE)
    for m in pattern.finditer(bsr_text):
        cat = m.group(1).strip().rstrip(",")
        if cat and len(cat) > 3:
            results.append(cat)

    return results


def _extract_product_type(soup: BeautifulSoup) -> str | None:
    """
    Extract the Department or Product Type field from the product details table.
    Appears as a table row: 'Department | Women's T-Shirts' or 'Product Type | ...'
    """
    detail_selectors = [
        "#productDetails_techSpec_section_1 tr",
        "#productDetails_techSpec_section_2 tr",
        "#productDetails_detailBullets_sections1 li",
        "#detailBullets_feature_div li",
        ".pdTab tr",
    ]

    target_labels = {"department", "product type", "item type", "item form", "category"}

    for sel in detail_selectors:
        rows = soup.select(sel)
        for row in rows:
            cells = row.find_all(["td", "th", "span"])
            if len(cells) >= 2:
                label = cells[0].get_text(strip=True).lower().rstrip(":")
                if any(t in label for t in target_labels):
                    value = cells[1].get_text(strip=True)
                    if value:
                        return value

    return None


def _extract_jsonld_category(soup: BeautifulSoup) -> str | None:
    """
    Extract category from JSON-LD structured data (<script type="application/ld+json">).
    Amazon embeds Product schema with a 'category' or breadcrumb 'itemListElement'.
    This is the highest-confidence signal when present.
    """
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            raw = script.string or ""
            if not raw.strip():
                continue
            data = json.loads(raw)
            if isinstance(data, list):
                for item in data:
                    result = _parse_jsonld_item(item)
                    if result:
                        return result
            elif isinstance(data, dict):
                result = _parse_jsonld_item(data)
                if result:
                    return result
        except Exception:
            continue
    return None


def _parse_jsonld_item(data: dict) -> str | None:
    schema_type = data.get("@type", "")
    # Direct category field on Product
    if schema_type == "Product" and data.get("category"):
        return str(data["category"])
    # BreadcrumbList — take the top-level (first) item
    if schema_type == "BreadcrumbList":
        items = data.get("itemListElement", [])
        if items:
            first = items[0] if isinstance(items[0], dict) else {}
            name = (first.get("item") or {}).get("name") or first.get("name")
            if name:
                return str(name)
    return None


# ── Canonical category detection ──────────────────────────────────────────────
# Maps Amazon breadcrumb text, title keywords, and bullet keywords to our
# 20 canonical product categories. Ordered most-specific → least-specific so
# earlier matches win for overlapping terms (e.g. "Baby" before "Clothing").

_CATEGORY_SIGNALS: list[tuple[list[str], str]] = [
    # Baby Products — check before clothing/toys to avoid false matches
    (["baby", "infant", "toddler", "diaper", "nappy", "nursery", "stroller",
      "pram", "baby monitor", "baby food", "baby wipes", "pacifier", "crib",
      "bassinette", "swaddle"], "Baby Products"),

    # Toys & Games
    (["toys", "games", "toy", "puzzle", "board game", "action figure", "doll",
      "building toy", "lego", "playset", "remote control car", "rc car",
      "play", "kids game"], "Toys & Games"),

    # Musical Instruments
    (["musical instrument", "guitar", "piano", "keyboard instrument", "drums",
      "drumkit", "bass guitar", "violin", "flute", "trumpet", "saxophone",
      "ukulele", "amplifier", "music stand", "band", "orchestra",
      "dj equipment", "audio interface", "midi"], "Musical Instruments"),

    # Jewelry & Watches
    (["jewelry", "jewellery", "watches", "ring", "necklace", "bracelet",
      "earring", "pendant", "chain", "cufflink", "brooch", "anklet",
      "fine jewelry", "fashion jewelry", "smartwatch", "wristwatch",
      "clock", "timepiece"], "Jewelry & Watches"),

    # Shoes & Handbags
    (["shoes", "boots", "sneakers", "sandals", "heels", "loafers", "flats",
      "pumps", "trainers", "footwear", "handbag", "purse", "wallet",
      "clutch", "tote bag", "satchel", "luggage", "suitcase", "backpack purse",
      "belt", "shoe"], "Shoes & Handbags"),

    # Beauty & Personal Care
    (["beauty", "personal care", "skin care", "skincare", "hair care", "haircare",
      "makeup", "cosmetic", "fragrance", "perfume", "cologne", "salon",
      "shaving", "nail", "oral care", "eye care", "moisturizer", "serum",
      "shampoo", "conditioner", "lotion", "sunscreen", "deodorant"], "Beauty & Personal Care"),

    # Electronics
    (["electronics", "headphones", "earbuds", "earphones", "computer", "laptop",
      "tablet", "monitor", "keyboard", "mouse", "printer", "camera", "tv",
      "television", "speaker", "audio", "gaming", "cell phone", "smartphone",
      "charger", "power bank", "usb hub", "smart home", "drone", "projector",
      "networking", "router", "bluetooth", "wireless"], "Electronics"),

    # Home & Kitchen
    (["home & kitchen", "kitchen & dining", "cookware", "bakeware", "blender",
      "coffee maker", "air fryer", "instant pot", "microwave", "toaster",
      "vacuum", "bedding", "pillow", "duvet", "mattress", "bath towel",
      "shower curtain", "furniture", "lamp", "curtain", "rug", "storage bin",
      "organizer", "cleaning", "mop", "broom", "candle", "home decor"], "Home & Kitchen"),

    # Food & Grocery
    (["grocery", "gourmet food", "snack", "beverage", "coffee bean", "tea",
      "candy", "chocolate", "nuts", "dried fruit", "condiment", "spice",
      "baking mix", "protein powder", "supplement shake", "organic food",
      "meal kit", "pasta", "sauce", "cereal", "energy drink"], "Food & Grocery"),

    # Health & Household
    (["health", "household", "vitamin", "supplement", "probiotic", "omega",
      "first aid", "bandage", "medical", "thermometer", "blood pressure",
      "hygiene", "cleaning supply", "laundry", "detergent", "paper towel",
      "toilet paper", "wellness", "weight loss", "nutrition"], "Health & Household"),

    # Pet Supplies
    (["pet", "dog", "cat", "puppy", "kitten", "fish tank", "aquarium",
      "bird cage", "hamster", "rabbit", "pet food", "kibble", "pet toy",
      "leash", "collar", "litter box", "pet grooming", "flea"], "Pet Supplies"),

    # Sports & Outdoors
    (["sports", "outdoor", "exercise", "fitness", "yoga", "gym", "weight",
      "dumbbell", "resistance band", "treadmill", "bicycle", "cycling",
      "camping", "hiking", "tent", "sleeping bag", "fishing", "hunting",
      "golf", "tennis", "swimming", "running shoe", "athletic", "soccer",
      "basketball", "football"], "Sports & Outdoors"),

    # Clothing & Apparel
    (["clothing", "apparel", "shirt", "t-shirt", "pants", "jeans", "dress",
      "jacket", "coat", "hoodie", "sweater", "sweatshirt", "sock",
      "underwear", "activewear", "swimwear", "hat", "beanie", "cap",
      "glove", "scarf", "men's clothing", "women's clothing", "girls",
      "boys clothing", "leggings", "shorts", "uniform"], "Clothing & Apparel"),

    # Automotive
    (["automotive", "car", "truck", "motorcycle", "rv", "vehicle",
      "auto part", "tire", "wheel", "car care", "car wash", "wax",
      "motor oil", "brake", "engine", "exhaust", "seat cover",
      "car mount", "dash cam", "jump starter", "floor mat"], "Automotive"),

    # Tools & Home Improvement
    (["tools", "home improvement", "power tool", "hand tool", "hardware",
      "drill", "saw", "screwdriver", "wrench", "hammer", "electrical",
      "plumbing", "paint", "ladder", "level", "measuring tape",
      "fastener", "screw", "nail", "bolt", "nut", "workbench"], "Tools & Home Improvement"),

    # Garden & Outdoor
    (["garden", "lawn", "patio", "plant", "seed", "soil", "fertilizer",
      "watering can", "hose", "sprinkler", "weed", "pest control",
      "outdoor furniture", "grill", "bbq", "fire pit", "greenhouse",
      "planter", "pot", "gardening glove", "rake", "shovel"], "Garden & Outdoor"),

    # Office Products
    (["office", "school supply", "stationery", "pen", "pencil", "notebook",
      "paper", "folder", "binder", "desk organizer", "stapler", "tape",
      "ink cartridge", "toner", "shredder", "calculator", "whiteboard",
      "sticky note", "label maker", "filing cabinet"], "Office Products"),

    # Arts, Crafts & Sewing
    (["arts", "crafts", "sewing", "knitting", "crochet", "drawing", "painting",
      "canvas", "brush", "sculpting", "clay", "scrapbooking", "beading",
      "fabric", "yarn", "thread", "embroidery", "cross stitch",
      "watercolor", "acrylic paint", "colored pencil", "marker set"], "Arts, Crafts & Sewing"),

    # Industrial & Scientific
    (["industrial", "scientific", "laboratory", "lab", "lab equipment",
      "safety equipment", "ppe", "gloves", "safety glasses", "hard hat",
      "janitorial", "material handling", "power transmission",
      "raw material", "research", "testing equipment", "microscope"], "Industrial & Scientific"),

    # Books & Media
    (["books", "kindle edition", "magazine", "dvd", "blu-ray", "vinyl",
      "cd", "software", "video game", "pc game", "movie", "ebook"], "Books & Media"),
]


# Direct fragments to check in the breadcrumb for each canonical category.
# These are substrings of the Amazon top-level department name.
_CANONICAL_NAME_FRAGMENTS: list[tuple[str, str]] = [
    ("sports & outdoors", "Sports & Outdoors"),
    ("sports and outdoors", "Sports & Outdoors"),
    ("beauty & personal care", "Beauty & Personal Care"),
    ("beauty and personal care", "Beauty & Personal Care"),
    ("health & household", "Health & Household"),
    ("health and household", "Health & Household"),
    ("home & kitchen", "Home & Kitchen"),
    ("home and kitchen", "Home & Kitchen"),
    ("kitchen & dining", "Home & Kitchen"),
    ("toys & games", "Toys & Games"),
    ("toys and games", "Toys & Games"),
    ("clothing, shoes & jewelry", "Clothing & Apparel"),
    ("clothing & apparel", "Clothing & Apparel"),
    ("clothing and apparel", "Clothing & Apparel"),
    ("baby products", "Baby Products"),
    ("baby & toddler", "Baby Products"),
    ("electronics", "Electronics"),
    ("automotive", "Automotive"),
    ("tools & home improvement", "Tools & Home Improvement"),
    ("tools and home improvement", "Tools & Home Improvement"),
    ("garden & outdoor", "Garden & Outdoor"),
    ("patio, lawn & garden", "Garden & Outdoor"),
    ("office products", "Office Products"),
    ("arts, crafts & sewing", "Arts, Crafts & Sewing"),
    ("industrial & scientific", "Industrial & Scientific"),
    ("musical instruments", "Musical Instruments"),
    ("books", "Books & Media"),
    ("movies & tv", "Books & Media"),
    ("music", "Books & Media"),
    ("video games", "Books & Media"),
    ("grocery & gourmet food", "Food & Grocery"),
    ("grocery", "Food & Grocery"),
    ("jewelry", "Jewelry & Watches"),
    ("watches", "Jewelry & Watches"),
    ("shoes", "Shoes & Handbags"),
    ("handbags & wallets", "Shoes & Handbags"),
    ("luggage & travel gear", "Shoes & Handbags"),
    ("pet supplies", "Pet Supplies"),
]


def _detect_canonical_category(
    title: str,
    raw_category: str | None,
    bullets: list[str],
    bsr_categories: list[str] | None = None,
    product_type: str | None = None,
    jsonld_category: str | None = None,
) -> str | None:
    """
    Map Amazon product data to one of the 20 canonical categories.

    Priority:
      1. JSON-LD structured data category (Amazon's own schema)
      2. Best Sellers Rank department name (explicitly stated)
      3. Direct name match on breadcrumb / product type
      4. Keyword signal scoring across title + bullets (fallback)
    """
    # Strategy 1: JSON-LD (Amazon's own structured data — most authoritative)
    if jsonld_category:
        for fragment, category_name in _CANONICAL_NAME_FRAGMENTS:
            if fragment in jsonld_category.lower():
                return category_name

    # Strategy 2: BSR categories (Amazon explicitly names the department)
    bsr_corpus = " ".join((bsr_categories or [])).lower()
    if bsr_corpus:
        for fragment, category_name in _CANONICAL_NAME_FRAGMENTS:
            if fragment in bsr_corpus:
                return category_name

    # Strategy 3: direct name match on breadcrumb + product type
    nav_corpus = " ".join(filter(None, [raw_category, product_type])).lower()
    if nav_corpus:
        for fragment, category_name in _CANONICAL_NAME_FRAGMENTS:
            if fragment in nav_corpus:
                return category_name

    # Strategy 4: keyword signal scoring across all text
    corpus_parts = []
    for part in [raw_category, product_type, title] + (bullets[:3] if bullets else []):
        if part:
            corpus_parts.append(part.lower())
    corpus = " ".join(corpus_parts)

    best_category = None
    best_score = 0
    for signals, category_name in _CATEGORY_SIGNALS:
        score = sum(1 for s in signals if s in corpus)
        if score > best_score:
            best_score = score
            best_category = category_name

    return best_category if best_score >= 1 else None


async def scrape_raw_debug(asin: str, marketplace: str = "US") -> dict:
    """
    Scrape an ASIN and return every raw signal used for category detection.
    Used by the /debug endpoint to diagnose detection failures.
    """
    domain = MARKETPLACE_DOMAINS.get(marketplace.upper(), "amazon.com")
    url = f"https://www.{domain}/dp/{asin}?th=1&psc=1"

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=HEADERS) as client:
        response = await client.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    title = _extract_title(soup)
    brand = _extract_brand(soup)
    bullets = _extract_bullets(soup)
    category = _extract_category(soup)
    full_breadcrumb = _extract_category_breadcrumb(soup)
    jsonld_category = _extract_jsonld_category(soup)
    bsr_categories = _extract_bsr_categories(soup)
    product_type = _extract_product_type(soup)
    detected = _detect_canonical_category(
        title=title or "",
        raw_category=full_breadcrumb or category,
        bullets=bullets,
        bsr_categories=bsr_categories,
        product_type=product_type,
        jsonld_category=jsonld_category,
    )

    return {
        "asin": asin,
        "marketplace": marketplace,
        "title": title,
        "brand": brand,
        "bullets": bullets,
        "category_last_node": category,
        "full_breadcrumb": full_breadcrumb,
        "jsonld_category": jsonld_category,
        "bsr_categories": bsr_categories,
        "product_type": product_type,
        "detected_category": detected,
    }


def build_prompt_from_product(product: dict, template_name: str, strategy: str = "top-performing") -> str:
    """
    Build an AI image generation prompt from scraped Amazon product data.
    """
    title = product.get("title", "")
    brand = product.get("brand", "")
    bullets = product.get("bullets", [])

    # Summarise key product features from bullets (first 2 bullets usually have key info)
    feature_summary = ""
    if bullets:
        key_bullets = bullets[:2]
        feature_summary = "; ".join(key_bullets)[:200]

    product_desc = title
    if brand and brand.lower() not in title.lower():
        product_desc = f"{brand} {title}"

    REALISM_HEADER = (
        "photorealistic commercial product photograph, "
        "shot on Canon 5D DSLR with 100mm macro lens, "
        "professional studio lighting setup, "
        "ultra-sharp focus, "
        "real physical product — NOT illustration NOT cartoon NOT digital art NOT 3D render"
    )

    REALISM_FOOTER = (
        "photorealistic hyperdetailed, product photography, "
        "no text overlays, no watermarks, Amazon main image compliant"
    )

    parts = [
        REALISM_HEADER,
        f"Amazon product listing main image of: {product_desc}",
        f"{template_name} composition",
        "pure white background #FFFFFF",
        "product fills 85-90% of frame",
        "even diffused studio lighting",
        "sharp edges and accurate color",
    ]

    if feature_summary:
        parts.append(f"product features: {feature_summary}")

    parts.append(REALISM_FOOTER)

    return ", ".join(parts)
