import traceback
from fastapi import APIRouter, HTTPException, Depends, Query

from app.services.auth import get_current_user
from app.services.asin_lookup import lookup_asin, build_prompt_from_product
from app.models.user import User

router = APIRouter()


@router.get("/{asin}")
async def get_asin_product(
    asin: str,
    marketplace: str = Query(default="US"),
    current_user: User = Depends(get_current_user),
):
    """Look up an Amazon product by ASIN and return product data for prompt building."""
    asin = asin.strip().upper()

    if not asin or len(asin) != 10:
        raise HTTPException(status_code=400, detail="Invalid ASIN — must be exactly 10 characters.")

    try:
        product = await lookup_asin(asin, marketplace)
        return {"success": True, "product": product}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e) or "Product not found.")
    except Exception as e:
        detail = str(e) or "An unexpected error occurred during ASIN lookup."
        print(f"[ASIN ERROR] {type(e).__name__}: {detail}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=detail)


@router.get("/{asin}/prompt")
async def get_asin_prompt(
    asin: str,
    template: str = Query(default="Plain White Background"),
    strategy: str = Query(default="top-performing"),
    marketplace: str = Query(default="US"),
    current_user: User = Depends(get_current_user),
):
    """Look up ASIN and return a ready-to-use AI prompt."""
    asin = asin.strip().upper()

    try:
        product = await lookup_asin(asin, marketplace)
        prompt = build_prompt_from_product(product, template, strategy)
        return {"success": True, "product": product, "prompt": prompt}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e) or "Product not found.")
    except Exception as e:
        detail = str(e) or "An unexpected error occurred during ASIN lookup."
        raise HTTPException(status_code=500, detail=detail)
