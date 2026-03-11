"""
Quick eval system test — run from the backend/ directory:
    py test_eval.py

Tests three things in order:
  1. Rubric sanity (no network needed)
  2. Single judge call on one real local image
  3. Full batch runner on 3 images → writes CSV
"""

import asyncio
import os
import sys

# Make sure app is importable
sys.path.insert(0, os.path.dirname(__file__))


# ── Test 1: Rubric (no network) ────────────────────────────────────────────────

def test_rubric():
    print("\n" + "=" * 55)
    print("TEST 1: Rubric module")
    print("=" * 55)

    from app.eval.rubric import (
        VALID_CONTENT_TYPES, get_profile, get_all_dimensions_for, compute_weighted_score
    )

    for ct in VALID_CONTENT_TYPES:
        profile = get_profile(ct)
        dims = get_all_dimensions_for(ct)
        weight_sum = sum(profile.weights.values())
        fake_scores = {d.id: 4.0 for d in dims}
        composite = compute_weighted_score(fake_scores, ct)

        ok = abs(weight_sum - 1.0) < 0.001 and abs(composite - 4.0) < 0.01
        print(f"  {'OK' if ok else 'FAIL'}  {ct:<25}  "
              f"{len(dims)} dims  weights={weight_sum:.3f}  all-4s={composite}")

    print("\n  Pass threshold for all types: 3.5")
    print("  Rubric test complete.\n")


# ── Test 2: Single judge call ──────────────────────────────────────────────────

async def test_single_judge():
    print("=" * 55)
    print("TEST 2: Single judge call (uses Gemini + local image)")
    print("=" * 55)

    # Pick the first available generated image
    generated_dir = os.path.join(os.path.dirname(__file__), "generated")
    images = [f for f in os.listdir(generated_dir) if f.endswith(".png")]
    if not images:
        print("  SKIP — no images in backend/generated/")
        return

    image_file = images[0]
    image_url = f"/images/{image_file}"
    prompt = "A product on a pure white background for an Amazon main listing image"

    print(f"  Image : {image_url}")
    print(f"  Type  : listing_main")
    print(f"  Prompt: {prompt[:70]}...")
    print("  Calling judge (may take 10–30s)...")

    from app.eval.judge import judge_image

    result = await judge_image(
        image_url=image_url,
        prompt=prompt,
        content_type="listing_main",
    )

    if result.error:
        print(f"\n  ERROR: {result.error}")
        print("  (If GEMINI_API_KEY not set in .env, configure it and retry)")
        return

    print(f"\n  Weighted composite : {result.weighted_composite:.2f}/5.00")
    print(f"  Judge overall      : {result.judge_overall:.1f}/5.0")
    print(f"  Passed (>=3.5)     : {result.passed}")
    print()
    print("  Dimension scores:")
    for ds in result.dimension_scores:
        bar = "#" * int(ds.score) + "-" * (5 - int(ds.score))
        print(f"    {ds.dimension_id:<25} [{bar}]  {ds.score:.0f}/5  {ds.rationale[:70]}")

    if result.strengths:
        print()
        print("  Strengths:")
        for s in result.strengths:
            print(f"    + {s}")

    if result.improvements:
        print()
        print("  Improvements:")
        for imp in result.improvements:
            print(f"    > {imp}")

    print("\n  Single judge test complete.\n")


# ── Test 3: Batch runner → CSV ─────────────────────────────────────────────────

async def test_batch_runner():
    print("=" * 55)
    print("TEST 3: Batch runner (3 images -> CSV)")
    print("=" * 55)

    generated_dir = os.path.join(os.path.dirname(__file__), "generated")
    images = [f for f in os.listdir(generated_dir) if f.endswith(".png")][:3]

    if not images:
        print("  SKIP — no images in backend/generated/")
        return

    from app.eval.runner import run_eval_batch, EvalItem

    content_types = ["listing_main", "listing_secondary", "aplus_content"]
    prompts = [
        "A product on a pure white background, centered, professional Amazon main image",
        "Infographic highlighting product key features with callout labels",
        "Lifestyle brand image for A+ content module with cohesive brand palette",
    ]

    items = [
        EvalItem(
            image_url=f"/images/{img}",
            prompt=prompts[i],
            content_type=content_types[i],
            metadata={"test_index": str(i + 1)},
        )
        for i, img in enumerate(images)
    ]

    print(f"  Evaluating {len(items)} images (this will take ~30–90s)...")
    results, summary = await run_eval_batch(
        items,
        output_dir="eval_results_test",
        run_label="test",
        verbose=True,
    )

    print(f"\n  CSV written to: {summary.output_csv}")
    print(f"  Open it in Excel or VS Code to inspect scores + rationales.")
    print("\n  Batch runner test complete.\n")


# ── Main ───────────────────────────────────────────────────────────────────────

async def main():
    print("\n  IMAGE EVAL SYSTEM — QUICK TEST")
    print("  Running from:", os.getcwd())

    test_rubric()

    # Tests 2 & 3 require Gemini API key + network
    run_live = os.environ.get("SKIP_LIVE", "").lower() not in ("1", "true", "yes")
    if run_live:
        await test_single_judge()
        await test_batch_runner()
    else:
        print("  Tests 2 & 3 skipped (SKIP_LIVE=1)")
        print("  Set SKIP_LIVE=0 and ensure GEMINI_API_KEY is in .env to run live tests.")

    print("  All tests done.")


if __name__ == "__main__":
    asyncio.run(main())
