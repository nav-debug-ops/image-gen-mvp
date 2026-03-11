"""
Eval Runner — Batch Image Quality Evaluation
============================================

Takes a batch of (image_url, prompt, content_type) items, calls the LLM
judge for each, and writes scores to a timestamped CSV file.

CLI usage:
    python -m app.eval.runner --input eval_input.json --output results/

Programmatic usage:
    from app.eval.runner import run_eval_batch, EvalItem

    items = [
        EvalItem(
            image_url="https://example.com/img.png",
            prompt="A blue stainless steel water bottle on white background",
            content_type="listing_main",
            metadata={"asin": "B09XYZ", "campaign": "spring-2025"},
        ),
        ...
    ]
    results = await run_eval_batch(items, output_dir="eval_results/")

Output CSV columns:
    timestamp, image_url, content_type, prompt,
    <dim_id>_score, <dim_id>_rationale, ...  (one pair per dimension)
    weighted_composite, judge_overall, passed,
    strengths, improvements, error

Concurrency:
    Set MAX_CONCURRENT to control parallel judge calls (default: 3).
    Gemini rate limits are ~60 req/min; 3 concurrent with ~1s gap is safe.
"""

import asyncio
import csv
import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from app.eval.judge import EvaluationResult, judge_image
from app.eval.rubric import get_all_dimensions_for, VALID_CONTENT_TYPES

MAX_CONCURRENT = 3       # Parallel judge calls
RETRY_ATTEMPTS = 2       # Retries on transient errors
RETRY_DELAY    = 3.0     # Seconds between retries


# ── Input Schema ───────────────────────────────────────────────────────────────

@dataclass
class EvalItem:
    image_url: str
    prompt: str
    content_type: str                   # Must be in VALID_CONTENT_TYPES
    metadata: dict = field(default_factory=dict)  # Arbitrary extra data (asin, campaign, etc.)

    def validate(self) -> Optional[str]:
        if not self.image_url:
            return "image_url is required"
        if not self.prompt:
            return "prompt is required"
        if self.content_type not in VALID_CONTENT_TYPES:
            return f"invalid content_type '{self.content_type}'. Valid: {VALID_CONTENT_TYPES}"
        return None


@dataclass
class BatchSummary:
    total: int
    passed: int
    failed_eval: int          # Items that errored (judge failed, not score failed)
    avg_composite: float
    avg_by_content_type: dict[str, float]
    output_csv: str


# ── Runner ─────────────────────────────────────────────────────────────────────

async def run_eval_batch(
    items: list[EvalItem],
    output_dir: str = "eval_results",
    run_label: str = "",
    verbose: bool = True,
) -> tuple[list[EvaluationResult], BatchSummary]:
    """
    Evaluate a batch of images and write results to CSV.

    Args:
        items:       List of EvalItems to evaluate.
        output_dir:  Directory where the CSV will be written.
        run_label:   Optional label appended to the CSV filename.
        verbose:     Print progress to stdout.

    Returns:
        (results, summary) — full result objects + aggregate stats.
    """
    # Validate inputs
    valid_items, skipped = [], []
    for item in items:
        err = item.validate()
        if err:
            if verbose:
                print(f"[SKIP] {item.image_url}: {err}")
            skipped.append((item, err))
        else:
            valid_items.append(item)

    if not valid_items:
        raise ValueError("No valid items to evaluate")

    if verbose:
        print(f"[EVAL] Starting batch: {len(valid_items)} items "
              f"(skipped {len(skipped)}), concurrency={MAX_CONCURRENT}")

    # Run evaluations with concurrency limiter
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    tasks = [_eval_with_semaphore(semaphore, item, i, len(valid_items), verbose)
             for i, item in enumerate(valid_items)]
    results: list[EvaluationResult] = await asyncio.gather(*tasks)

    # Write CSV
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    label_part = f"_{run_label}" if run_label else ""
    csv_path = os.path.join(output_dir, f"eval_{timestamp}{label_part}.csv")
    _write_csv(results, csv_path, valid_items)

    # Compute summary
    summary = _compute_summary(results, csv_path)

    if verbose:
        _print_summary(summary)

    return results, summary


async def _eval_with_semaphore(
    semaphore: asyncio.Semaphore,
    item: EvalItem,
    index: int,
    total: int,
    verbose: bool,
) -> EvaluationResult:
    async with semaphore:
        if verbose:
            print(f"[EVAL] [{index + 1}/{total}] {item.content_type} — {item.image_url[:80]}")

        for attempt in range(1, RETRY_ATTEMPTS + 1):
            result = await judge_image(
                image_url=item.image_url,
                prompt=item.prompt,
                content_type=item.content_type,
            )
            # Retry only on transient errors (not validation/config errors)
            if result.error and attempt < RETRY_ATTEMPTS:
                is_transient = any(kw in (result.error or "").lower()
                                   for kw in ["timeout", "unexpected error", "502", "503", "504"])
                if is_transient:
                    if verbose:
                        print(f"  [RETRY {attempt}/{RETRY_ATTEMPTS}] {result.error}")
                    await asyncio.sleep(RETRY_DELAY)
                    continue
            break

        if verbose:
            if result.error:
                print(f"  [ERROR] {result.error}")
            else:
                status = "PASS" if result.passed else "FAIL"
                print(f"  [{status}] composite={result.weighted_composite:.2f} "
                      f"overall={result.judge_overall:.1f}")
        return result


# ── CSV Writer ─────────────────────────────────────────────────────────────────

def _write_csv(
    results: list[EvaluationResult],
    csv_path: str,
    items: list[EvalItem],
) -> None:
    """Write evaluation results to a CSV file."""

    # Collect all dimension IDs that appear across all results
    all_dim_ids: list[str] = []
    seen: set[str] = set()
    for result in results:
        for ds in result.dimension_scores:
            if ds.dimension_id not in seen:
                all_dim_ids.append(ds.dimension_id)
                seen.add(ds.dimension_id)

    # Also ensure coverage from rubric definitions
    for result in results:
        for dim in get_all_dimensions_for(result.content_type):
            if dim.id not in seen:
                all_dim_ids.append(dim.id)
                seen.add(dim.id)

    # Build metadata keys from items
    meta_keys: list[str] = []
    meta_seen: set[str] = set()
    for item in items:
        for k in item.metadata.keys():
            if k not in meta_seen:
                meta_keys.append(k)
                meta_seen.add(k)

    # CSV columns
    base_cols = [
        "timestamp", "image_url", "content_type", "prompt",
    ]
    dim_cols = []
    for dim_id in all_dim_ids:
        dim_cols.append(f"{dim_id}_score")
        dim_cols.append(f"{dim_id}_rationale")

    summary_cols = [
        "weighted_composite", "judge_overall", "passed",
        "strengths", "improvements", "error",
    ]

    fieldnames = base_cols + [f"meta_{k}" for k in meta_keys] + dim_cols + summary_cols

    now = datetime.now().isoformat()
    item_map = {item.image_url: item for item in items}

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()

        for result in results:
            item = item_map.get(result.image_url)
            row: dict = {
                "timestamp": now,
                "image_url": result.image_url,
                "content_type": result.content_type,
                "prompt": result.prompt,
                "weighted_composite": result.weighted_composite,
                "judge_overall": result.judge_overall,
                "passed": result.passed,
                "strengths": " | ".join(result.strengths),
                "improvements": " | ".join(result.improvements),
                "error": result.error or "",
            }

            # Metadata columns
            if item:
                for k in meta_keys:
                    row[f"meta_{k}"] = item.metadata.get(k, "")

            # Dimension score + rationale columns
            score_lookup = {ds.dimension_id: ds for ds in result.dimension_scores}
            for dim_id in all_dim_ids:
                ds = score_lookup.get(dim_id)
                row[f"{dim_id}_score"] = ds.score if ds else ""
                row[f"{dim_id}_rationale"] = ds.rationale if ds else ""

            writer.writerow(row)

    print(f"[EVAL] Results written: {csv_path}")


# ── Summary ────────────────────────────────────────────────────────────────────

def _compute_summary(results: list[EvaluationResult], csv_path: str) -> BatchSummary:
    scored = [r for r in results if not r.error]
    errored = [r for r in results if r.error]
    passed = [r for r in scored if r.passed]

    avg = round(sum(r.weighted_composite for r in scored) / len(scored), 2) if scored else 0.0

    by_type: dict[str, list[float]] = {}
    for r in scored:
        by_type.setdefault(r.content_type, []).append(r.weighted_composite)
    avg_by_type = {ct: round(sum(v) / len(v), 2) for ct, v in by_type.items()}

    return BatchSummary(
        total=len(results),
        passed=len(passed),
        failed_eval=len(errored),
        avg_composite=avg,
        avg_by_content_type=avg_by_type,
        output_csv=csv_path,
    )


def _print_summary(summary: BatchSummary) -> None:
    scored = summary.total - summary.failed_eval
    print("\n" + "=" * 60)
    print("EVAL BATCH SUMMARY")
    print("=" * 60)
    print(f"  Total images evaluated : {summary.total}")
    print(f"  Successfully scored    : {scored}")
    print(f"  Judge errors           : {summary.failed_eval}")
    print(f"  Passed (>=3.5)         : {summary.passed}/{scored}")
    print(f"  Avg composite score    : {summary.avg_composite:.2f}/5.00")
    if summary.avg_by_content_type:
        print("  Avg by content type:")
        for ct, avg in summary.avg_by_content_type.items():
            print(f"    {ct:<25} {avg:.2f}")
    print(f"  CSV output             : {summary.output_csv}")
    print("=" * 60 + "\n")


# ── CLI Entry Point ────────────────────────────────────────────────────────────

def _load_input_json(path: str) -> list[EvalItem]:
    """
    Load eval items from a JSON file.

    Expected format (array of objects):
    [
        {
            "image_url": "https://...",
            "prompt": "A blue water bottle on white background...",
            "content_type": "listing_main",
            "metadata": {"asin": "B09XYZ", "campaign": "spring-2025"}  // optional
        },
        ...
    ]
    """
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Input JSON must be an array of eval item objects")
    return [
        EvalItem(
            image_url=item["image_url"],
            prompt=item["prompt"],
            content_type=item["content_type"],
            metadata=item.get("metadata", {}),
        )
        for item in data
    ]


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run image quality eval batch")
    parser.add_argument("--input",  required=True, help="Path to input JSON file")
    parser.add_argument("--output", default="eval_results", help="Output directory for CSV")
    parser.add_argument("--label",  default="", help="Optional run label for CSV filename")
    parser.add_argument("--quiet",  action="store_true", help="Suppress progress output")
    args = parser.parse_args()

    items = _load_input_json(args.input)
    asyncio.run(run_eval_batch(
        items,
        output_dir=args.output,
        run_label=args.label,
        verbose=not args.quiet,
    ))
