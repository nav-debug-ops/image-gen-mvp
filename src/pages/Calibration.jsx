import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  BarChart2,
  AlertCircle,
  RefreshCw,
  StickyNote,
  ArrowRight,
  Info,
} from 'lucide-react'
import { fetchAPI, safeJson } from '../api/client'

// ── Rubric (mirrors backend rubric.py for listing_main) ─────────────────────

const DIMENSIONS = [
  {
    id: 'technical_quality',
    name: 'Technical Quality',
    weight: 0.25,
    desc: 'Sharpness, resolution, artifact-free rendering, no AI glitches',
    anchors: {
      1: 'Severe blur, major artifacts or AI errors',
      2: 'Noticeable defects, soft focus',
      3: 'Acceptable — minor imperfections',
      4: 'High quality, sharp, clean',
      5: 'Flawless — indistinguishable from professional photography',
    },
  },
  {
    id: 'product_isolation',
    name: 'Product Isolation',
    weight: 0.25,
    desc: 'Pure white background, product centered, fills 85%+ of frame, no props or text overlays',
    anchors: {
      1: 'Background clearly not white — props, lifestyle context, or text present',
      2: 'Off-white or grey bg, minor props or distracting shadows',
      3: 'Near-white bg, product centered but fill <85%',
      4: 'Clean white bg, product well-centered, minor shadow acceptable',
      5: 'Perfect Amazon compliance — pure white, 85%+ fill, zero props or text',
    },
  },
  {
    id: 'commercial_viability',
    name: 'Commercial Viability',
    weight: 0.20,
    desc: 'Likelihood this image drives purchase intent and conversions',
    anchors: {
      1: 'Would not convert — product unclear or unappealing',
      2: 'Low conversion potential — product present but not compelling',
      3: 'Moderate — functional but lacks persuasive impact',
      4: 'High conversion — product clear, attractive, motivates purchase',
      5: 'Exceptional — best-in-class presentation, drives buyer action',
    },
  },
  {
    id: 'prompt_relevance',
    name: 'Prompt Relevance',
    weight: 0.15,
    desc: 'How faithfully the image reflects the brief / prompt',
    anchors: {
      1: 'Image barely resembles the prompt',
      2: 'Loosely matches — major elements missing or wrong',
      3: 'Mostly matches — minor elements missing or ambiguous',
      4: 'Strong match — nearly all elements present and correct',
      5: 'Exact match — every specified element, mood, and context captured',
    },
  },
  {
    id: 'aesthetic_quality',
    name: 'Aesthetic Quality',
    weight: 0.10,
    desc: 'Composition, lighting, color harmony, overall visual appeal',
    anchors: {
      1: 'Poor composition, flat or clashing colors',
      2: 'Below average — noticeable issues with balance or lighting',
      3: 'Acceptable — competent but unremarkable',
      4: 'Polished and professional — strong composition, pleasing palette',
      5: 'Exceptional — studio-quality, striking composition, perfect harmony',
    },
  },
  {
    id: 'brand_safety',
    name: 'Brand Safety',
    weight: 0.05,
    desc: 'Absence of harmful, offensive, or policy-violating content',
    anchors: {
      1: 'Contains harmful or clearly policy-violating content',
      2: 'Borderline — potentially misleading or mildly inappropriate',
      3: 'Safe but minor ambiguities in certain contexts',
      4: 'Fully safe, appropriate for standard commercial use',
      5: 'Perfectly safe — universally appropriate, sets positive tone',
    },
  },
]

const PASS_THRESHOLD = 3.5

function computeComposite(scores) {
  let total = 0, totalWeight = 0
  for (const dim of DIMENSIONS) {
    if (scores[dim.id] != null) {
      total += scores[dim.id] * dim.weight
      totalWeight += dim.weight
    }
  }
  return totalWeight > 0 ? Math.round((total / totalWeight) * 100) / 100 : 0
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreButton({ value, selected, onClick }) {
  const colors = { 1: '#EF4444', 2: '#F97316', 3: '#F59E0B', 4: '#84CC16', 5: '#22C55E' }
  const labels = { 1: 'Poor', 2: 'Below avg', 3: 'Acceptable', 4: 'Good', 5: 'Excellent' }
  const isSelected = selected === value
  return (
    <button
      className={`cal-score-btn ${isSelected ? 'cal-score-btn-active' : ''}`}
      style={isSelected ? { background: colors[value], borderColor: colors[value], color: '#fff' } : {}}
      onClick={() => onClick(value)}
      title={labels[value]}
    >
      {value}
    </button>
  )
}

function DimRow({ dim, humanScore, aiScore, onScore, showAi, anchorOpen, onToggleAnchor }) {
  const delta = humanScore != null && aiScore != null ? humanScore - aiScore : null
  const deltaColor = delta == null ? '' : delta > 0 ? '#F59E0B' : delta < 0 ? '#3B82F6' : '#22C55E'

  return (
    <div className="cal-dim-row">
      <div className="cal-dim-header">
        <div className="cal-dim-meta">
          <span className="cal-dim-name">{dim.name}</span>
          <span className="cal-dim-weight">{Math.round(dim.weight * 100)}%</span>
          <button
            className="cal-anchor-toggle"
            onClick={() => onToggleAnchor(dim.id)}
            title="Show scoring guide"
          >
            <Info size={13} />
          </button>
        </div>
        <span className="cal-dim-desc">{dim.desc}</span>
        {anchorOpen && (
          <div className="cal-anchor-box">
            {[1, 2, 3, 4, 5].map(v => (
              <div key={v} className="cal-anchor-row">
                <span className="cal-anchor-score">{v}</span>
                <span className="cal-anchor-text">{dim.anchors[v]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cal-dim-scores">
        <div className="cal-score-group">
          <span className="cal-score-label">Your score</span>
          <div className="cal-score-btns">
            {[1, 2, 3, 4, 5].map(v => (
              <ScoreButton key={v} value={v} selected={humanScore} onClick={onScore} />
            ))}
          </div>
        </div>

        {showAi && aiScore != null && (
          <div className="cal-ai-score-wrap">
            <span className="cal-score-label">AI score</span>
            <span className="cal-ai-score-val" style={{ color: '#6366F1' }}>{aiScore}/5</span>
            {delta != null && (
              <span className="cal-delta" style={{ color: deltaColor }}>
                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CompositeBar({ label, value, color }) {
  const pct = value != null ? Math.round((value / 5) * 100) : 0
  const passed = value >= PASS_THRESHOLD
  return (
    <div className="cal-composite-wrap">
      <div className="cal-composite-header">
        <span className="cal-composite-label">{label}</span>
        <span className="cal-composite-value" style={{ color }}>
          {value != null ? value.toFixed(2) : '—'} / 5.00
        </span>
        {value != null && (
          <span className={`cal-pass-badge ${passed ? 'pass' : 'fail'}`}>
            {passed ? '✓ PASS' : '✗ FAIL'}
          </span>
        )}
      </div>
      <div className="cal-composite-bar-bg">
        <div className="cal-composite-bar-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="cal-composite-bar-threshold" style={{ left: `${(PASS_THRESHOLD / 5) * 100}%` }} title="Pass threshold 3.5" />
      </div>
    </div>
  )
}

function AgreementLabel({ mae }) {
  if (mae == null) return null
  const { label, color } =
    mae < 0.3 ? { label: 'Excellent calibration', color: '#22C55E' } :
    mae < 0.6 ? { label: 'Good calibration', color: '#84CC16' } :
    mae < 1.0 ? { label: 'Moderate calibration', color: '#F59E0B' } :
                { label: 'Poor calibration — review rubric', color: '#EF4444' }
  return <span style={{ color, fontWeight: 600 }}>{label}</span>
}

// ── Main Component ───────────────────────────────────────────────────────────

function Calibration() {
  const [tab, setTab] = useState('score')

  // Image queue
  const [images, setImages] = useState([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)

  // Scoring state
  const [humanScores, setHumanScores] = useState({})
  const [notes, setNotes] = useState('')
  const [anchorOpen, setAnchorOpen] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [comparison, setComparison] = useState(null) // result after submit
  const [submitError, setSubmitError] = useState('')

  // Report state
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  // ── Load image queue ─────────────────────────────────────────────────────────
  const loadImages = useCallback(async () => {
    setQueueLoading(true)
    try {
      const res = await fetchAPI('/api/images/?archived=false&limit=20&offset=0&sort_by=newest')
      const data = await safeJson(res)
      if (data?.images) {
        // Prioritize images that already have AI scores
        const withScore = data.images.filter(i => i.eval_score != null)
        const withoutScore = data.images.filter(i => i.eval_score == null)
        setImages([...withScore, ...withoutScore])
      }
    } catch { /* silent */ }
    finally { setQueueLoading(false) }
  }, [])

  useEffect(() => { loadImages() }, [loadImages])

  // ── Load report ──────────────────────────────────────────────────────────────
  const loadReport = useCallback(async () => {
    setReportLoading(true)
    try {
      const res = await fetchAPI('/api/eval/calibration/report')
      const data = await safeJson(res)
      if (data) setReport(data)
    } catch { /* silent */ }
    finally { setReportLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'report') loadReport()
  }, [tab, loadReport])

  // ── Scoring ──────────────────────────────────────────────────────────────────
  const currentImage = images[currentIdx]

  const allScored = DIMENSIONS.every(d => humanScores[d.id] != null)
  const humanComposite = allScored ? computeComposite(humanScores) : null

  const handleScore = (dimId, value) => {
    setHumanScores(prev => ({ ...prev, [dimId]: value }))
  }

  const toggleAnchor = (dimId) => {
    setAnchorOpen(prev => ({ ...prev, [dimId]: !prev[dimId] }))
  }

  const handleSubmit = async () => {
    if (!allScored || !currentImage) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetchAPI('/api/eval/calibration', {
        method: 'POST',
        body: JSON.stringify({
          image_id: currentImage.id,
          image_url: currentImage.image_url,
          prompt: currentImage.prompt,
          content_type: 'listing_main',
          human_scores: humanScores,
          notes: notes.trim() || null,
        }),
      })
      const data = await safeJson(res)
      if (res.ok && data) {
        setComparison(data)
      } else {
        setSubmitError('Submission failed. Try again.')
      }
    } catch {
      setSubmitError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    setComparison(null)
    setHumanScores({})
    setNotes('')
    setAnchorOpen({})
    setSubmitError('')
    setCurrentIdx(prev => Math.min(prev + 1, images.length - 1))
  }

  const handlePrev = () => {
    setComparison(null)
    setHumanScores({})
    setNotes('')
    setAnchorOpen({})
    setSubmitError('')
    setCurrentIdx(prev => Math.max(prev - 1, 0))
  }

  // ── Derived comparison data ──────────────────────────────────────────────────
  const aiScoresMap = comparison
    ? Object.fromEntries((comparison.dim_comparison || []).map(d => [d.dim_id, d.ai]))
    : (currentImage?.eval_score
        ? Object.fromEntries((currentImage.eval_score.dimensions || []).map(d => [d.id, d.score]))
        : {})

  return (
    <div className="calibration-page">
      <header className="page-header">
        <div>
          <h1><FlaskConical size={22} style={{ display: 'inline', marginRight: 8 }} />Human vs. AI Calibration</h1>
          <p>Score images using the same rubric as the Gemini judge, then compare side-by-side</p>
        </div>
        <div className="cal-header-actions">
          <button
            className={`cal-tab-btn ${tab === 'score' ? 'active' : ''}`}
            onClick={() => setTab('score')}
          >
            Score Images
          </button>
          <button
            className={`cal-tab-btn ${tab === 'report' ? 'active' : ''}`}
            onClick={() => setTab('report')}
          >
            <BarChart2 size={15} /> Calibration Report
          </button>
        </div>
      </header>

      {/* ── SCORING TAB ────────────────────────────────────────────────────────── */}
      {tab === 'score' && (
        <div className="cal-score-tab">
          {queueLoading ? (
            <div className="cal-loading"><Loader2 size={28} className="spin" /><span>Loading images…</span></div>
          ) : images.length === 0 ? (
            <div className="cal-empty">
              <AlertCircle size={40} />
              <p>No images found. Generate some images first from the Main Image Generator.</p>
            </div>
          ) : (
            <div className="cal-main-layout">

              {/* ── LEFT: Image + prompt ──────────────────────────────────────── */}
              <div className="cal-image-panel">
                <div className="cal-image-nav">
                  <button className="btn btn-ghost btn-sm" onClick={handlePrev} disabled={currentIdx === 0}>
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span className="cal-image-counter">
                    Image {currentIdx + 1} of {images.length}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={handleNext} disabled={currentIdx === images.length - 1}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>

                <div className="cal-image-wrap">
                  <img src={currentImage?.image_url} alt="Image to score" />
                  {currentImage?.eval_score != null && (
                    <div className="cal-already-ai-badge">AI scored</div>
                  )}
                </div>

                <div className="cal-image-meta">
                  <span className="cal-provider-tag">{currentImage?.provider} · {currentImage?.model?.split('/').pop()}</span>
                  <span className="cal-date-tag">{currentImage ? new Date(currentImage.created_at).toLocaleDateString() : ''}</span>
                </div>

                <div className="cal-prompt-box">
                  <span className="cal-prompt-label">Prompt</span>
                  <p>{currentImage?.prompt}</p>
                </div>

                {/* Composite scores */}
                {humanComposite != null && (
                  <div className="cal-composites">
                    <CompositeBar
                      label="Your Score"
                      value={humanComposite}
                      color="#3B82F6"
                    />
                    {comparison?.ai_composite != null && (
                      <CompositeBar
                        label="AI Score"
                        value={comparison.ai_composite}
                        color="#6366F1"
                      />
                    )}
                    {comparison?.composite_delta != null && (
                      <div className="cal-delta-summary">
                        <span>Delta (You − AI): </span>
                        <strong style={{ color: comparison.composite_delta === 0 ? '#22C55E' : comparison.composite_delta > 0 ? '#F59E0B' : '#3B82F6' }}>
                          {comparison.composite_delta > 0 ? '+' : ''}{comparison.composite_delta.toFixed(2)}
                        </strong>
                        {comparison.pass_agreement != null && (
                          <span className={`cal-agree-badge ${comparison.pass_agreement ? 'agree' : 'disagree'}`}>
                            {comparison.pass_agreement ? '✓ Agree on Pass/Fail' : '✗ Disagree on Pass/Fail'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Scoring form ───────────────────────────────────────── */}
              <div className="cal-form-panel">
                <div className="cal-form-header">
                  <h2>Your Scorecard</h2>
                  <p>Rate each dimension 1–5. Click the <Info size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> for scoring anchors.</p>
                </div>

                <div className="cal-dims-list">
                  {DIMENSIONS.map(dim => (
                    <DimRow
                      key={dim.id}
                      dim={dim}
                      humanScore={humanScores[dim.id]}
                      aiScore={aiScoresMap[dim.id]}
                      onScore={(v) => handleScore(dim.id, v)}
                      showAi={comparison != null}
                      anchorOpen={anchorOpen[dim.id]}
                      onToggleAnchor={toggleAnchor}
                    />
                  ))}
                </div>

                <div className="cal-notes-wrap">
                  <StickyNote size={14} />
                  <textarea
                    className="cal-notes-input"
                    placeholder="Optional notes about this image…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {submitError && (
                  <div className="cal-submit-error">
                    <AlertCircle size={15} /> {submitError}
                  </div>
                )}

                {!comparison ? (
                  <button
                    className="btn btn-primary cal-submit-btn"
                    onClick={handleSubmit}
                    disabled={!allScored || submitting}
                  >
                    {submitting
                      ? <><Loader2 size={16} className="spin" /> Scoring with AI…</>
                      : allScored
                        ? <><CheckCircle size={16} /> Submit & Compare with AI</>
                        : `Score all ${DIMENSIONS.length} dimensions to submit`}
                  </button>
                ) : (
                  <div className="cal-submitted-actions">
                    <div className="cal-submitted-banner">
                      <CheckCircle size={16} /> Scores submitted! AI scores revealed above.
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleNext}
                      disabled={currentIdx === images.length - 1}
                    >
                      Next Image <ArrowRight size={16} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => setTab('report')}>
                      <BarChart2 size={15} /> View Report
                    </button>
                  </div>
                )}

                <p className="cal-progress-note">
                  {`${currentIdx + 1} of ${images.length} images — score at least 10 for a meaningful report`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REPORT TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'report' && (
        <div className="cal-report-tab">
          <div className="cal-report-toolbar">
            <button className="btn btn-ghost btn-sm" onClick={loadReport} disabled={reportLoading}>
              <RefreshCw size={14} className={reportLoading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {reportLoading ? (
            <div className="cal-loading"><Loader2 size={28} className="spin" /><span>Computing report…</span></div>
          ) : !report || report.n === 0 ? (
            <div className="cal-empty">
              <FlaskConical size={40} />
              <p>No calibration data yet.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Go to the Score tab and rate some images to see results here.</p>
            </div>
          ) : (
            <>
              {/* ── Stats cards ── */}
              <div className="cal-report-stats">
                <div className="cal-stat-card">
                  <span className="cal-stat-num">{report.n}</span>
                  <span className="cal-stat-lbl">Images scored</span>
                </div>
                <div className="cal-stat-card">
                  <span className="cal-stat-num">{report.mean_human?.toFixed(2)}</span>
                  <span className="cal-stat-lbl">Avg human score</span>
                </div>
                <div className="cal-stat-card">
                  <span className="cal-stat-num">{report.mean_ai?.toFixed(2)}</span>
                  <span className="cal-stat-lbl">Avg AI score</span>
                </div>
                <div className="cal-stat-card cal-stat-highlight">
                  <span className="cal-stat-num">{report.mae?.toFixed(3)}</span>
                  <span className="cal-stat-lbl">MAE (lower = better)</span>
                </div>
                <div className="cal-stat-card">
                  <span className="cal-stat-num" style={{ color: report.bias > 0 ? '#F59E0B' : report.bias < 0 ? '#3B82F6' : '#22C55E' }}>
                    {report.bias > 0 ? '+' : ''}{report.bias?.toFixed(3)}
                  </span>
                  <span className="cal-stat-lbl">Bias (you − AI)</span>
                </div>
                <div className="cal-stat-card">
                  <span className="cal-stat-num">{report.pass_agreement_pct}%</span>
                  <span className="cal-stat-lbl">Pass/Fail agreement</span>
                </div>
              </div>

              <div className="cal-calibration-verdict">
                <FlaskConical size={16} />
                Calibration quality: <AgreementLabel mae={report.mae} />
                {report.bias > 0.3 && <span className="cal-bias-note"> · You tend to score <strong>higher</strong> than the AI ({report.bias > 0 ? '+' : ''}{report.bias?.toFixed(2)} avg bias)</span>}
                {report.bias < -0.3 && <span className="cal-bias-note"> · You tend to score <strong>lower</strong> than the AI ({report.bias?.toFixed(2)} avg bias)</span>}
              </div>

              {/* ── Per-dimension delta table ── */}
              {report.by_dimension?.length > 0 && (
                <div className="cal-report-section">
                  <h3>Per-Dimension Agreement</h3>
                  <p className="cal-section-sub">Sorted by largest disagreement. Positive delta = you score higher than AI.</p>
                  <div className="cal-dim-table-wrap">
                    <table className="cal-dim-table">
                      <thead>
                        <tr>
                          <th>Dimension</th>
                          <th>Avg Human</th>
                          <th>Avg AI</th>
                          <th>Delta</th>
                          <th>n</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.by_dimension.map(row => {
                          const dc = Math.abs(row.mean_delta) < 0.3 ? '#22C55E'
                                   : Math.abs(row.mean_delta) < 0.7 ? '#F59E0B' : '#EF4444'
                          const dim = DIMENSIONS.find(d => d.id === row.dim_id)
                          return (
                            <tr key={row.dim_id}>
                              <td>
                                {dim?.name || row.dim_id}
                                <span className="cal-dim-wt"> ({Math.round((dim?.weight || 0) * 100)}%)</span>
                              </td>
                              <td>{row.mean_human.toFixed(2)}</td>
                              <td>{row.mean_ai.toFixed(2)}</td>
                              <td style={{ color: dc, fontWeight: 600 }}>
                                {row.mean_delta > 0 ? '+' : ''}{row.mean_delta.toFixed(2)}
                              </td>
                              <td style={{ color: 'var(--text-muted)' }}>{row.n}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Scored images table ── */}
              <div className="cal-report-section">
                <h3>All Scored Images</h3>
                <div className="cal-entries-table-wrap">
                  <table className="cal-entries-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Prompt</th>
                        <th>Human</th>
                        <th>AI</th>
                        <th>Delta</th>
                        <th>H Pass</th>
                        <th>AI Pass</th>
                        <th>Agreement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.entries.map(entry => {
                        const agree = entry.human_passed === entry.ai_passed
                        const deltaColor = entry.delta == null ? '' :
                          Math.abs(entry.delta) < 0.3 ? '#22C55E' :
                          Math.abs(entry.delta) < 0.7 ? '#F59E0B' : '#EF4444'
                        return (
                          <tr key={entry.id}>
                            <td>
                              <img
                                src={entry.image_url}
                                alt=""
                                className="cal-entry-thumb"
                              />
                            </td>
                            <td className="cal-entry-prompt" title={entry.prompt}>
                              {entry.prompt?.slice(0, 60)}{entry.prompt?.length > 60 ? '…' : ''}
                            </td>
                            <td style={{ fontWeight: 600, color: '#3B82F6' }}>
                              {entry.human_composite?.toFixed(2)}
                            </td>
                            <td style={{ fontWeight: 600, color: '#6366F1' }}>
                              {entry.ai_composite?.toFixed(2) ?? '—'}
                            </td>
                            <td style={{ fontWeight: 600, color: deltaColor }}>
                              {entry.delta != null ? (entry.delta > 0 ? '+' : '') + entry.delta.toFixed(2) : '—'}
                            </td>
                            <td>
                              {entry.human_passed
                                ? <CheckCircle size={15} style={{ color: '#22C55E' }} />
                                : <XCircle size={15} style={{ color: '#EF4444' }} />}
                            </td>
                            <td>
                              {entry.ai_passed != null
                                ? entry.ai_passed
                                  ? <CheckCircle size={15} style={{ color: '#22C55E' }} />
                                  : <XCircle size={15} style={{ color: '#EF4444' }} />
                                : '—'}
                            </td>
                            <td>
                              {entry.ai_passed != null
                                ? agree
                                  ? <span style={{ color: '#22C55E', fontSize: '0.78rem' }}>✓ Agree</span>
                                  : <span style={{ color: '#EF4444', fontSize: '0.78rem' }}>✗ Disagree</span>
                                : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Calibration
