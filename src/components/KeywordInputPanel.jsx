import { useState, useEffect, useRef } from 'react'
import { Loader2, Sparkles, Merge } from 'lucide-react'
import { suggestKeywords } from '../api/keywords'

const TYPE_LABELS = {
  benefits:   'Enter the key benefits you want highlighted',
  features:   'Enter the key features to display',
  comparison: "Enter your product's advantages vs. competitors",
  lifestyle:  'Describe the lifestyle scenario, target user, or setting',
  quality:    'Enter quality certifications, trust signals, or guarantees',
  howto:      'Enter the step-by-step usage instructions to display',
}

export default function KeywordInputPanel({ typeId, asinProduct, onMerge }) {
  const [chips, setChips] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [manual, setManual] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Track which (asin, typeId) we last fetched so we don't re-fetch on re-render
  const fetchedFor = useRef(null)

  useEffect(() => {
    if (!typeId || !asinProduct) return
    const key = `${asinProduct.asin || ''}:${typeId}`
    if (fetchedFor.current === key) return
    fetchedFor.current = key

    setChips([])
    setSelected(new Set())
    setError(null)
    setLoading(true)

    suggestKeywords(asinProduct.asin || '', typeId, asinProduct)
      .then((kws) => {
        setChips(kws)
        // Pre-select first 4 chips for a quick start
        setSelected(new Set(kws.slice(0, 4)))
      })
      .catch((err) => {
        setError('Could not load suggestions. Type your own below.')
        console.error('[KeywordPanel]', err)
      })
      .finally(() => setLoading(false))
  }, [typeId, asinProduct])

  const toggleChip = (chip) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(chip) ? next.delete(chip) : next.add(chip)
      return next
    })
  }

  const handleMerge = () => {
    const fromChips = [...selected]
    const fromManual = manual
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean)

    // Deduplicate
    const seen = new Set()
    const merged = []
    for (const k of [...fromChips, ...fromManual]) {
      const lower = k.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        merged.push(k)
      }
    }
    onMerge(merged)
  }

  const label = TYPE_LABELS[typeId] || 'Enter keywords for this image type'
  const hasContent = selected.size > 0 || manual.trim().length > 0

  return (
    <div className="kw-panel">
      <div className="kw-panel-label">
        <Sparkles size={14} />
        {label}
      </div>

      <div className="kw-columns">
        {/* AI Suggestions */}
        <div className="kw-suggestions">
          <div className="kw-col-header">
            <span>AI Suggestions</span>
            <span className="kw-col-sub">Tap to select / deselect</span>
          </div>

          {loading ? (
            <div className="kw-skeleton-wrap">
              {[80, 110, 90, 130, 70, 100].map((w, i) => (
                <span key={i} className="kw-skeleton" style={{ width: w }} />
              ))}
            </div>
          ) : error ? (
            <p className="kw-error">{error}</p>
          ) : chips.length === 0 ? (
            <p className="kw-empty">No suggestions yet.</p>
          ) : (
            <div className="kw-chip-list">
              {chips.map((chip) => (
                <button
                  key={chip}
                  className={`kw-chip ${selected.has(chip) ? 'selected' : ''}`}
                  onClick={() => toggleChip(chip)}
                  type="button"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual input */}
        <div className="kw-manual">
          <div className="kw-col-header">
            <span>Your Own Keywords</span>
            <span className="kw-col-sub">Separate by comma or new line</span>
          </div>
          <textarea
            className="kw-textarea"
            placeholder="Add your own keywords, separated by commas or new lines"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            rows={5}
          />
        </div>
      </div>

      <button
        className="kw-merge-btn"
        onClick={handleMerge}
        disabled={!hasContent}
        type="button"
      >
        <Merge size={15} />
        Merge &amp; Use Selected
        {selected.size > 0 && (
          <span className="kw-merge-count">{selected.size} chip{selected.size > 1 ? 's' : ''}</span>
        )}
      </button>
    </div>
  )
}
