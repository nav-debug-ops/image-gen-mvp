"""
Rubric Scorecard Generator
==========================
Reads rubric.py and produces a self-contained HTML scorecard you can:
  - Open in any browser
  - Print as PDF  (File > Print > Save as PDF)
  - Share as a standalone file

Run from backend/ directory:
    py -m app.eval.generate_scorecard
    py -m app.eval.generate_scorecard --output my_scorecard.html
"""

import argparse
import os
from datetime import datetime

from app.eval.rubric import (
    CONTENT_TYPE_PROFILES,
    get_all_dimensions_for,
    VALID_CONTENT_TYPES,
)

# ── Color palette per content type ────────────────────────────────────────────
_COLORS = {
    "listing_main":       {"accent": "#2563EB", "light": "#EFF6FF", "badge": "#DBEAFE"},
    "listing_secondary":  {"accent": "#7C3AED", "light": "#F5F3FF", "badge": "#EDE9FE"},
    "aplus_content":      {"accent": "#059669", "light": "#ECFDF5", "badge": "#D1FAE5"},
    "brand_store":        {"accent": "#D97706", "light": "#FFFBEB", "badge": "#FEF3C7"},
    "brand_story":        {"accent": "#DB2777", "light": "#FDF2F8", "badge": "#FCE7F3"},
}

_ICONS = {
    "listing_main":       "🖼️",
    "listing_secondary":  "📊",
    "aplus_content":      "✨",
    "brand_store":        "🏪",
    "brand_story":        "📖",
}

_SCORE_COLORS = {1: "#EF4444", 2: "#F97316", 3: "#EAB308", 4: "#22C55E", 5: "#16A34A"}
_SCORE_LABELS = {1: "Poor", 2: "Below Average", 3: "Acceptable", 4: "Good", 5: "Excellent"}


def _score_cell(score: int, anchor: str, color: str) -> str:
    label = _SCORE_LABELS[score]
    return f"""
      <td class="score-cell">
        <div class="score-badge" style="background:{color}20; border:1.5px solid {color}; color:{color}">
          <span class="score-num">{score}</span>
          <span class="score-label">{label}</span>
        </div>
        <p class="anchor-text">{anchor}</p>
      </td>"""


def _dimension_table(dims, weights, accent) -> str:
    rows = ""
    for dim in dims:
        w = weights.get(dim.id, 0)
        w_pct = round(w * 100)
        bar_w = w_pct * 2  # scale to max ~50px for display
        rows += f"""
    <div class="dim-block">
      <div class="dim-header">
        <div class="dim-title-group">
          <span class="dim-name">{dim.name}</span>
          <span class="dim-desc">{dim.description}</span>
        </div>
        <div class="dim-weight">
          <span class="weight-label">Weight</span>
          <span class="weight-pct" style="color:{accent}">{w_pct}%</span>
          <div class="weight-bar-bg">
            <div class="weight-bar-fill" style="width:{bar_w}px; background:{accent}"></div>
          </div>
        </div>
      </div>
      <table class="anchor-table">
        <colgroup>
          <col style="width:19%"><col style="width:19%"><col style="width:19%">
          <col style="width:19%"><col style="width:19%">
        </colgroup>
        <thead>
          <tr>{"".join(f'<th style="color:{_SCORE_COLORS[s]}">Score {s}</th>' for s in range(1,6))}</tr>
        </thead>
        <tbody>
          <tr>{"".join(_score_cell(s, dim.anchors[s], _SCORE_COLORS[s]) for s in range(1,6))}</tr>
        </tbody>
      </table>
      <div class="score-input-row">
        <span class="score-input-label">Evaluator Score:</span>
        {"".join(f'<label class="radio-label"><input type="radio" name="{dim.id}_score" value="{s}"><span class="radio-circle" style="border-color:{_SCORE_COLORS[s]}">{s}</span></label>' for s in range(1,6))}
        <span class="score-input-label" style="margin-left:16px">Notes:</span>
        <input type="text" class="notes-input" placeholder="Optional rationale...">
      </div>
    </div>"""
    return rows


def _content_type_section(ct_id: str) -> str:
    profile = CONTENT_TYPE_PROFILES[ct_id]
    dims = get_all_dimensions_for(ct_id)
    colors = _COLORS[ct_id]
    icon = _ICONS[ct_id]
    accent = colors["accent"]

    dim_tables = _dimension_table(dims, profile.weights, accent)

    weight_summary = "".join(
        f'<div class="ws-row"><span class="ws-name">{d.name}</span>'
        f'<span class="ws-pct" style="color:{accent}">{round(profile.weights.get(d.id,0)*100)}%</span></div>'
        for d in dims
    )

    return f"""
  <section class="ct-section" id="{ct_id}" style="--accent:{accent}; --light:{colors['light']}; --badge:{colors['badge']}">
    <div class="ct-header" style="background:{accent}">
      <div class="ct-title-block">
        <span class="ct-icon">{icon}</span>
        <div>
          <h2 class="ct-name">{profile.name}</h2>
          <p class="ct-purpose">{profile.purpose}</p>
        </div>
      </div>
      <div class="ct-meta">
        <div class="meta-pill">Pass threshold: <strong>≥ {profile.pass_threshold}</strong></div>
        <div class="meta-pill">Dimensions: <strong>{len(dims)}</strong></div>
      </div>
    </div>

    <div class="ct-body">
      <div class="weight-summary-box" style="background:{colors['badge']}; border-left:4px solid {accent}">
        <p class="ws-title" style="color:{accent}">Scoring Weight Summary</p>
        {weight_summary}
      </div>

      <div class="eval-meta-row">
        <label>Image URL / ID: <input type="text" class="meta-input" placeholder="https://... or image filename"></label>
        <label>Evaluator: <input type="text" class="meta-input" placeholder="Name"></label>
        <label>Date: <input type="date" class="meta-input"></label>
      </div>

      <div class="dims-container">
        {dim_tables}
      </div>

      <div class="composite-row">
        <span class="composite-label">Weighted Composite Score</span>
        <span class="composite-hint">(calculated from dimension scores × weights above)</span>
        <input type="number" min="1" max="5" step="0.01" class="composite-input" placeholder="—">
        <span class="pass-fail-label">Result:</span>
        <label class="pf-label"><input type="radio" name="{ct_id}_result" value="pass"> <span class="pf-pass">PASS</span></label>
        <label class="pf-label"><input type="radio" name="{ct_id}_result" value="fail"> <span class="pf-fail">FAIL</span></label>
      </div>

      <div class="feedback-row">
        <div class="feedback-box">
          <p class="feedback-title" style="color:{accent}">+ Strengths</p>
          <textarea class="feedback-textarea" rows="3" placeholder="What works well..."></textarea>
        </div>
        <div class="feedback-box">
          <p class="feedback-title" style="color:#EF4444">&#8594; Improvements</p>
          <textarea class="feedback-textarea" rows="3" placeholder="Specific actionable changes..."></textarea>
        </div>
      </div>
    </div>
  </section>"""


def generate_html() -> str:
    sections = "\n".join(_content_type_section(ct) for ct in VALID_CONTENT_TYPES)
    nav_links = "\n".join(
        f'<a href="#{ct}" class="nav-link" style="border-color:{_COLORS[ct]["accent"]}; color:{_COLORS[ct]["accent"]}">'
        f'{_ICONS[ct]} {CONTENT_TYPE_PROFILES[ct].name}</a>'
        for ct in VALID_CONTENT_TYPES
    )
    generated_date = datetime.now().strftime("%B %d, %Y")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ecommerce Image Quality Rubric Scorecard</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #F8FAFC; color: #1E293B; font-size: 13px; line-height: 1.5; }}

  /* ── Header ── */
  .page-header {{ background: #0F172A; color: white; padding: 28px 40px; }}
  .page-header h1 {{ font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }}
  .page-header p {{ color: #94A3B8; font-size: 12px; margin-top: 4px; }}
  .header-meta {{ display:flex; gap:20px; margin-top:12px; }}
  .header-badge {{ background:#1E293B; border:1px solid #334155; border-radius:6px;
                   padding:4px 12px; font-size:11px; color:#CBD5E1; }}

  /* ── Nav ── */
  .page-nav {{ background:white; border-bottom:1px solid #E2E8F0;
               padding:12px 40px; display:flex; gap:10px; flex-wrap:wrap; position:sticky; top:0; z-index:10; }}
  .nav-link {{ text-decoration:none; padding:5px 14px; border-radius:20px;
               border:1.5px solid; font-size:11.5px; font-weight:600;
               transition: opacity 0.15s; white-space:nowrap; }}
  .nav-link:hover {{ opacity:0.75; }}

  /* ── Content type section ── */
  .ct-section {{ margin: 28px 40px; border-radius: 12px; overflow:hidden;
                  border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(0,0,0,.06); }}
  .ct-header {{ color:white; padding:20px 24px; display:flex;
                justify-content:space-between; align-items:flex-start; gap:16px; }}
  .ct-title-block {{ display:flex; gap:14px; align-items:flex-start; flex:1; }}
  .ct-icon {{ font-size:28px; line-height:1; margin-top:2px; }}
  .ct-name {{ font-size:18px; font-weight:700; }}
  .ct-purpose {{ font-size:11.5px; opacity:0.85; margin-top:4px; max-width:600px; line-height:1.55; }}
  .ct-meta {{ display:flex; flex-direction:column; gap:6px; align-items:flex-end; }}
  .meta-pill {{ background:rgba(255,255,255,.18); border-radius:6px;
                padding:4px 10px; font-size:11px; white-space:nowrap; }}

  .ct-body {{ background:white; padding:20px 24px; display:flex; flex-direction:column; gap:18px; }}

  /* ── Weight summary ── */
  .weight-summary-box {{ padding:12px 16px; border-radius:8px; }}
  .ws-title {{ font-size:11px; font-weight:700; text-transform:uppercase;
               letter-spacing:0.5px; margin-bottom:8px; }}
  .ws-row {{ display:flex; justify-content:space-between; align-items:center;
             padding:3px 0; border-bottom:1px dashed #E2E8F0; font-size:12px; }}
  .ws-row:last-child {{ border-bottom:none; }}
  .ws-name {{ color:#475569; }}
  .ws-pct {{ font-weight:700; }}

  /* ── Eval meta ── */
  .eval-meta-row {{ display:flex; gap:16px; flex-wrap:wrap; }}
  .eval-meta-row label {{ font-size:11.5px; color:#64748B; font-weight:600;
                           display:flex; flex-direction:column; gap:4px; flex:1; min-width:160px; }}
  .meta-input {{ border:1px solid #CBD5E1; border-radius:6px; padding:6px 10px;
                 font-size:12px; color:#1E293B; font-family:inherit; }}
  .meta-input:focus {{ outline:none; border-color:var(--accent); }}

  /* ── Dimension block ── */
  .dim-block {{ border:1px solid #E2E8F0; border-radius:10px; overflow:hidden; }}
  .dim-header {{ background:var(--light); padding:12px 16px;
                  display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }}
  .dim-title-group {{ flex:1; }}
  .dim-name {{ font-weight:700; font-size:13px; color:#0F172A; display:block; }}
  .dim-desc {{ font-size:11.5px; color:#64748B; margin-top:2px; display:block; }}
  .dim-weight {{ display:flex; flex-direction:column; align-items:flex-end; gap:3px; min-width:70px; }}
  .weight-label {{ font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#94A3B8; }}
  .weight-pct {{ font-size:18px; font-weight:800; line-height:1; }}
  .weight-bar-bg {{ background:#E2E8F0; border-radius:3px; height:4px; width:50px; }}
  .weight-bar-fill {{ height:4px; border-radius:3px; }}

  /* ── Anchor table ── */
  .anchor-table {{ width:100%; border-collapse:collapse; table-layout:fixed; }}
  .anchor-table thead th {{ padding:6px 8px; font-size:11px; font-weight:700;
                             border-bottom:1px solid #E2E8F0; text-align:center; }}
  .score-cell {{ padding:8px; vertical-align:top; border-right:1px solid #F1F5F9; }}
  .score-cell:last-child {{ border-right:none; }}
  .score-badge {{ display:flex; flex-direction:column; align-items:center; gap:2px;
                  padding:4px 6px; border-radius:6px; margin-bottom:6px; }}
  .score-num {{ font-size:16px; font-weight:800; line-height:1; }}
  .score-label {{ font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; }}
  .anchor-text {{ font-size:11px; color:#475569; line-height:1.4; }}

  /* ── Score input row ── */
  .score-input-row {{ background:#FAFAFA; border-top:1px solid #E2E8F0;
                       padding:8px 12px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }}
  .score-input-label {{ font-size:11px; font-weight:600; color:#64748B; white-space:nowrap; }}
  .radio-label {{ display:flex; align-items:center; gap:3px; cursor:pointer; }}
  .radio-label input[type=radio] {{ display:none; }}
  .radio-circle {{ width:26px; height:26px; border-radius:50%; border:2px solid;
                   display:flex; align-items:center; justify-content:center;
                   font-size:12px; font-weight:700; cursor:pointer; }}
  .radio-label input[type=radio]:checked + .radio-circle {{ background:currentColor !important;
    filter:brightness(1.1); }}
  .notes-input {{ flex:1; min-width:120px; border:1px solid #E2E8F0; border-radius:6px;
                   padding:5px 9px; font-size:11.5px; font-family:inherit; }}
  .notes-input:focus {{ outline:none; border-color:var(--accent); }}

  /* ── Composite row ── */
  .composite-row {{ background:var(--light); border:1px solid var(--badge);
                     border-radius:8px; padding:12px 16px;
                     display:flex; align-items:center; gap:12px; flex-wrap:wrap; }}
  .composite-label {{ font-size:13px; font-weight:700; color:#0F172A; }}
  .composite-hint {{ font-size:11px; color:#94A3B8; }}
  .composite-input {{ width:80px; border:2px solid var(--accent); border-radius:8px;
                       padding:6px 10px; font-size:18px; font-weight:700; text-align:center;
                       color:var(--accent); font-family:inherit; }}
  .composite-input:focus {{ outline:none; }}
  .pass-fail-label {{ font-size:12px; font-weight:700; color:#64748B; margin-left:8px; }}
  .pf-label {{ display:flex; align-items:center; gap:4px; cursor:pointer; font-size:12px; font-weight:600; }}
  .pf-pass {{ color:#16A34A; }}
  .pf-fail {{ color:#DC2626; }}

  /* ── Feedback ── */
  .feedback-row {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
  .feedback-box {{ display:flex; flex-direction:column; gap:6px; }}
  .feedback-title {{ font-size:11.5px; font-weight:700; }}
  .feedback-textarea {{ border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px;
                         font-size:12px; font-family:inherit; resize:vertical; color:#1E293B; }}
  .feedback-textarea:focus {{ outline:none; border-color:var(--accent); }}

  /* ── Footer ── */
  .page-footer {{ margin:28px 40px; padding:16px 20px; background:white;
                   border:1px solid #E2E8F0; border-radius:8px;
                   font-size:11px; color:#94A3B8; text-align:center; }}

  /* ── Print styles ── */
  @media print {{
    body {{ background:white; font-size:11px; }}
    .page-nav {{ display:none; }}
    .ct-section {{ margin:0 0 24px 0; page-break-inside:avoid; }}
    .page-header {{ padding:16px 24px; }}
    .ct-body {{ padding:14px; }}
    .notes-input, .meta-input, .feedback-textarea, .composite-input {{ border-color:#E2E8F0 !important; }}
  }}

  @page {{ margin: 15mm; }}
</style>
</head>
<body>

<header class="page-header">
  <h1>Ecommerce Image Quality Rubric Scorecard</h1>
  <p>AI-generated image evaluation framework for Amazon listing content</p>
  <div class="header-meta">
    <span class="header-badge">Generated: {generated_date}</span>
    <span class="header-badge">Pass threshold: composite score &ge; 3.5 / 5.0</span>
    <span class="header-badge">5 content types &bull; {sum(len(get_all_dimensions_for(ct)) for ct in VALID_CONTENT_TYPES)} total dimension scorings</span>
  </div>
</header>

<nav class="page-nav">
  {nav_links}
</nav>

{sections}

<footer class="page-footer">
  Rubric source: <code>backend/app/eval/rubric.py</code> &bull;
  Scoring scale: 1 = Poor &nbsp;|&nbsp; 2 = Below Average &nbsp;|&nbsp;
  3 = Acceptable &nbsp;|&nbsp; 4 = Good &nbsp;|&nbsp; 5 = Excellent &bull;
  Image Gen MVP &mdash; {generated_date}
</footer>

</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate rubric scorecard HTML")
    parser.add_argument("--output", default="eval_scorecard.html",
                        help="Output file path (default: eval_scorecard.html)")
    args = parser.parse_args()

    html = generate_html()
    out_path = args.output
    os.makedirs(os.path.dirname(out_path) if os.path.dirname(out_path) else ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Scorecard generated: {out_path}")
    print(f"Open in browser, then File > Print > Save as PDF to export.")


if __name__ == "__main__":
    main()
