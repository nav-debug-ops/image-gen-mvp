"""
Amazon ASIN product lookup via scraping.
Fetches title, brand, image, and bullet points from a product page.
"""
import re
import httpx
from bs4 import BeautifulSoup


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
}


async def lookup_asin(asin: str, marketplace: str = "US") -> dict:
    """
    Fetch product data from Amazon for a given ASIN.
    Returns a dict with title, brand, image_url, bullets, category.
    Raises ValueError if product not found or Amazon blocks the request.
    """
    domain = MARKETPLACE_DOMAINS.get(marketplace.upper(), "amazon.com")
    url = f"https://www.{domain}/dp/{asin}?th=1&psc=1"

    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=True,
        headers=HEADERS,
    ) as client:
        response = await client.get(url)

    if response.status_code == 404:
        raise ValueError(f"ASIN {asin} not found on Amazon {marketplace}")

    if response.status_code != 200:
        raise ValueError(f"Amazon returned status {response.status_code}. Try again or use a different marketplace.")

    html = response.text

    soup = BeautifulSoup(html, "lxml")

    # Check if Amazon served a CAPTCHA page
    if soup.select_one("form[action*='captcha']") or soup.select_one("#captchacharacters"):
        raise ValueError("Amazon is temporarily blocking automated requests. Wait a moment and try again.")

    # --- Title ---
    title = _extract_title(soup)
    if not title:
        raise ValueError("Could not read product title. Amazon may have changed its page structure.")

    # --- Brand ---
    brand = _extract_brand(soup)

    # --- Main image ---
    image_url = _extract_image(soup)

    # --- Bullet points ---
    bullets = _extract_bullets(soup)

    # --- Category breadcrumb ---
    category = _extract_category(soup)

    return {
        "asin": asin,
        "title": title,
        "brand": brand,
        "image_url": image_url,
        "bullets": bullets,
        "category": category,
        "marketplace": marketplace,
        "source_url": url,
    }


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


def _extract_category(soup: BeautifulSoup) -> str | None:
    breadcrumb = soup.select("#wayfinding-breadcrumbs_feature_div ul li span.a-list-item a")
    if breadcrumb:
        # Return last meaningful category node
        categories = [el.get_text(strip=True) for el in breadcrumb if el.get_text(strip=True)]
        if categories:
            return categories[-1]
    return None


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
