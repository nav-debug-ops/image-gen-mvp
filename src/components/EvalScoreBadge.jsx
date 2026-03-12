import { useState, useEffect, useRef } from 'react'
import { scoreImage } from '../api/eval'

function scoreColor(s) {
  if (s >= 3.5) return '#22C55E'
  if (s >= 3.0) return '#F59E0B'
  return '#EF4444'
}

/**
 * Fires an eval call in the background after an image generates.
 * Shows a compact score badge, expandable to a full dimension breakdown.
 *
 * Props:
 *   imageUrl      - URL of the generated image
 *   prompt        - The prompt used to generate the image
 *   contentType   - listing_main | listing_secondary | aplus_content | brand_store | brand_story
 *   defaultExpanded - if true, open the panel immediately on score arrival (use in lightbox)
 */
export default function EvalScoreBadge({
  imageUrl,
  prompt,
  contentType = 'listing_main',
  defaultExpanded = false,
}) {
  const [status, setStatus] = useState('idle')   // idle | loading | scored | error
  const [result, setResult] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    // Reset when a new image arrives (e.g. after regeneration)
    fired.current = false
    setStatus('idle')
    setResult(null)
    setExpanded(false)
  }, [imageUrl])

  useEffect(() => {
    if (!imageUrl || !prompt || fired.current) return
    fired.current = true
    setStatus('loading')
    scoreImage(imageUrl, prompt, contentType)
      .then(data => {
        if (!data) { setStatus('error'); return }
        setResult(data)
        setStatus('scored')
        if (defaultExpanded) setExpanded(true)
      })
      .catch(() => setStatus('error'))
  }, [imageUrl, prompt, contentType, defaultExpanded])

  if (status === 'idle') return null

  if (status === 'loading') {
    return (
      <div className="eval-badge eval-badge-loading">
        <span className="eval-dot-pulse" />
        Scoring image…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="eval-badge eval-badge-error" title="Quality scoring unavailable">
        Score N/A
      </div>
    )
  }

  const { composite, passed, dimensions = [], improvements = [] } = result
  const color = scoreColor(composite)
  const topImprovement = improvements[0]

  return (
    <div className="eval-badge-wrap" onClick={(e) => e.stopPropagation()}>

      {/* ── Compact pill ── */}
      <button
        className="eval-badge eval-badge-scored"
        style={{ borderColor: color, color }}
        onClick={() => setExpanded(v => !v)}
        title="Click to see quality breakdown"
      >
        <span className="eval-badge-dot" style={{ background: color }} />
        <span className="eval-badge-score">{composite.toFixed(1)}/5</span>
        <span className="eval-badge-result" style={{ color }}>
          {passed ? '✓ PASS' : '✗ FAIL'}
        </span>
        <span className="eval-badge-arrow">{expanded ? '▴' : '▾'}</span>
      </button>

      {/* ── Expanded breakdown ── */}
      {expanded && (
        <div className="eval-panel">

          <div className="eval-panel-header" style={{ borderLeftColor: color }}>
            <span className="eval-panel-title">Quality Breakdown</span>
            <span className="eval-panel-composite" style={{ color }}>
              {composite.toFixed(2)} / 5.00
            </span>
            <span
              className="eval-panel-pass"
              style={{ background: color + '22', color, border: `1px solid ${color}55` }}
            >
              {passed ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>

          <div className="eval-dims">
            {dimensions.map(dim => {
              const dc = scoreColor(dim.score)
              return (
                <div key={dim.id} className="eval-dim-row" title={dim.rationale}>
                  <span className="eval-dim-name">{dim.name}</span>
                  <span className="eval-dim-weight">{Math.round(dim.weight * 100)}%</span>
                  <div className="eval-dim-bar-bg">
                    <div
                      className="eval-dim-bar-fill"
                      style={{ width: `${(dim.score / 5) * 100}%`, background: dc }}
                    />
                  </div>
                  <span className="eval-dim-score" style={{ color: dc }}>
                    {dim.score}/5
                  </span>
                </div>
              )
            })}
          </div>

          {topImprovement && (
            <div className="eval-improvement">
              <span className="eval-improvement-icon">→</span>
              <span className="eval-improvement-text">{topImprovement}</span>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
