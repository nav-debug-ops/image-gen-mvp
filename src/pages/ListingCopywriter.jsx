import { useState, useEffect, useRef } from 'react'
import { generateCopy } from '../api/copywriter'
import {
  FileText,
  Search,
  Upload,
  Globe,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Download,
  ChevronDown,
  Loader2,
  GripVertical,
  AlertCircle,
  Save,
  Sparkles,
  X
} from 'lucide-react'

const MARKETPLACES = [
  { code: 'US', flag: '🇺🇸' }, { code: 'UK', flag: '🇬🇧' }, { code: 'DE', flag: '🇩🇪' },
  { code: 'FR', flag: '🇫🇷' }, { code: 'JP', flag: '🇯🇵' }, { code: 'CA', flag: '🇨🇦' },
  { code: 'CN', flag: '🇨🇳' }, { code: 'IT', flag: '🇮🇹' }, { code: 'ES', flag: '🇪🇸' },
  { code: 'MX', flag: '🇲🇽' }, { code: 'AU', flag: '🇦🇺' }, { code: 'IN', flag: '🇮🇳' }
]

const LANGUAGES = [
  'English', 'French', 'Spanish', 'Portuguese', 'German', 'Italian',
  'Dutch', 'Swedish', 'Polish', 'Turkish', 'Arabic', 'Hindi',
  'Chinese', 'Japanese', 'Korean', 'Russian', 'Vietnamese', 'Thai',
  'Indonesian', 'Malay'
]

const TONES = [
  { id: 'professional', name: 'Professional', desc: 'Corporate, authoritative, trustworthy' },
  { id: 'witty', name: 'Witty', desc: 'Clever, playful, memorable' },
  { id: 'friendly', name: 'Friendly', desc: 'Warm, approachable, conversational' },
  { id: 'persuasive', name: 'Persuasive', desc: 'Compelling, action-oriented, urgent' },
  { id: 'informative', name: 'Informative', desc: 'Educational, detailed, factual' },
  { id: 'empathetic', name: 'Empathetic', desc: 'Understanding, supportive, caring' },
  { id: 'casual', name: 'Casual', desc: 'Relaxed, everyday, relatable' },
  { id: 'formal', name: 'Formal', desc: 'Proper, respectful, traditional' },
  { id: 'confident', name: 'Confident', desc: 'Bold, assured, strong' },
  { id: 'direct', name: 'Direct', desc: 'Straightforward, no-nonsense, clear' },
  { id: 'encouraging', name: 'Encouraging', desc: 'Motivating, positive, uplifting' },
  { id: 'neutral', name: 'Neutral', desc: 'Balanced, objective, unbiased' },
  { id: 'luxurious', name: 'Luxurious', desc: 'Premium, exclusive, sophisticated' },
  { id: 'eco-conscious', name: 'Eco-conscious', desc: 'Sustainable, green, responsible' }
]


function ListingCopywriter() {
  // Mode state
  const [mode, setMode] = useState('single') // 'single' | 'bulk'

  // Input state
  const [asinValue, setAsinValue] = useState('')
  const [marketplace, setMarketplace] = useState('US')
  const [language, setLanguage] = useState('English')
  const [tone, setTone] = useState('professional')
  const [additionalKeywords, setAdditionalKeywords] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [regeneratingField, setRegeneratingField] = useState(null) // 'bullets' | 'description' | `bullet-${i}` | `title-${i}`
  const [hasResults, setHasResults] = useState(false)
  const [error, setError] = useState(null)

  // Manual input fallback (shown when ASIN lookup fails)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualBullets, setManualBullets] = useState('')

  // Results state
  const [titles, setTitles] = useState([])
  const [bullets, setBullets] = useState([])
  const [description, setDescription] = useState('')
  const [searchTerms, setSearchTerms] = useState('')

  // UI state
  const [activeTitle, setActiveTitle] = useState(0)
  const [copiedField, setCopiedField] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)

  // Bulk mode state
  const [bulkRows, setBulkRows] = useState([])          // parsed CSV rows
  const [bulkResults, setBulkResults] = useState([])    // completed results
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(null) // { current, total }
  const [bulkError, setBulkError] = useState(null)
  const bulkCancelRef = useRef(false)

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('listing_draft')
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.asinValue)          setAsinValue(d.asinValue)
      if (d.marketplace)        setMarketplace(d.marketplace)
      if (d.language)           setLanguage(d.language)
      if (d.tone)               setTone(d.tone)
      if (d.additionalKeywords) setAdditionalKeywords(d.additionalKeywords)
      if (d.titles?.length)     { setTitles(d.titles); setHasResults(true) }
      if (d.bullets?.length)    setBullets(d.bullets)
      if (d.description)        setDescription(d.description)
      if (d.searchTerms)        setSearchTerms(d.searchTerms)
    } catch { /* corrupt draft — ignore */ }
  }, [])

  const downloadCSVTemplate = () => {
    const header = 'asin,marketplace,language,tone,keywords'
    const example = 'B08N5WRWNW,US,English,professional,"premium wireless earbuds"'
    const csv = [header, example].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'listing-bulk-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    return lines.slice(1).map(line => {
      // handle quoted fields
      const fields = []
      let cur = '', inQ = false
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ }
        else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
        else cur += ch
      }
      fields.push(cur.trim())
      return Object.fromEntries(headers.map((h, i) => [h, fields[i] || '']))
    }).filter(r => r.asin && r.asin.length === 10)
  }

  const handleBulkFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result)
      setBulkRows(rows)
      setBulkResults([])
      setBulkError(rows.length === 0 ? 'No valid rows found. Check ASIN column (must be 10 chars).' : null)
    }
    reader.readAsText(file)
  }

  const handleBulkRun = async () => {
    if (!bulkRows.length || bulkRunning) return
    setBulkRunning(true)
    setBulkResults([])
    setBulkError(null)
    bulkCancelRef.current = false
    const results = []
    for (let i = 0; i < bulkRows.length; i++) {
      if (bulkCancelRef.current) break
      const row = bulkRows[i]
      setBulkProgress({ current: i + 1, total: bulkRows.length, asin: row.asin })
      try {
        const data = await generateCopy({
          asin: row.asin,
          marketplace: row.marketplace || 'US',
          language: row.language || 'English',
          tone: row.tone || 'professional',
          keywords: row.keywords || '',
          manualTitle: '',
          manualBullets: [],
        })
        results.push({ ...row, status: 'done', titles: data.titles, bullets: data.bullets, description: data.description, search_terms: data.search_terms })
      } catch (err) {
        results.push({ ...row, status: 'error', error: err.message })
      }
      setBulkResults([...results])
    }
    setBulkRunning(false)
    setBulkProgress(null)
  }

  const exportBulkResults = () => {
    const blob = new Blob([JSON.stringify(bulkResults, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-listing-results-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSave = () => {
    const draft = { asinValue, marketplace, language, tone, additionalKeywords, titles, bullets, description, searchTerms }
    localStorage.setItem('listing_draft', JSON.stringify(draft))
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const _buildManualBullets = () =>
    manualBullets.split('\n').map(b => b.trim()).filter(Boolean)

  const _callAPI = async (withManual = false) => generateCopy({
    asin: asinValue,
    marketplace,
    language,
    tone,
    keywords: additionalKeywords,
    manualTitle: withManual ? manualTitle : '',
    manualBullets: withManual ? _buildManualBullets() : [],
  })

  const _applyResult = (data) => {
    setTitles(data.titles)
    setBullets(data.bullets)
    setDescription(data.description)
    setSearchTerms(data.search_terms)
    setActiveTitle(0)
    setHasResults(true)
    setShowManualInput(false)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setShowManualInput(false)
    try {
      const data = await _callAPI()
      _applyResult(data)
    } catch (err) {
      if (err.code === 'asin_lookup_failed') {
        setShowManualInput(true)
        setError(null)
      } else {
        setError(err.message || 'Generation failed. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateWithManual = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const data = await _callAPI(true)
      _applyResult(data)
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateBullets = async () => {
    setRegeneratingField('bullets')
    try {
      const data = await _callAPI()
      setBullets(data.bullets)
    } catch (err) {
      setError(err.message)
    } finally {
      setRegeneratingField(null)
    }
  }

  const handleRegenerateBullet = async (index) => {
    setRegeneratingField(`bullet-${index}`)
    try {
      const data = await _callAPI()
      setBullets(prev => prev.map((b, i) => i === index ? data.bullets[index] ?? data.bullets[0] : b))
    } catch (err) {
      setError(err.message)
    } finally {
      setRegeneratingField(null)
    }
  }

  const handleRegenerateDescription = async () => {
    setRegeneratingField('description')
    try {
      const data = await _callAPI()
      setDescription(data.description)
    } catch (err) {
      setError(err.message)
    } finally {
      setRegeneratingField(null)
    }
  }

  const handleRegenerateTitle = async (index) => {
    setRegeneratingField(`title-${index}`)
    try {
      const data = await _callAPI()
      setTitles(prev => prev.map((t, i) => i === index ? data.titles[index] ?? data.titles[0] : t))
    } catch (err) {
      setError(err.message)
    } finally {
      setRegeneratingField(null)
    }
  }

  const copyToClipboard = async (text, field) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const copyAll = async () => {
    const allContent = `TITLE:\n${titles[activeTitle]}\n\nBULLET POINTS:\n${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\nDESCRIPTION:\n${description}\n\nSEARCH TERMS:\n${searchTerms}`
    await navigator.clipboard.writeText(allContent)
    setCopiedField('all')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleExport = () => {
    const content = {
      titles,
      bullets,
      description,
      search_terms: searchTerms,
      generated_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listing-copy-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="listing-copywriter">
      <header className="page-header">
        <div>
          <h1>Listing Copywriter</h1>
          <p>Generate optimized titles, bullets, and descriptions with AI</p>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}
        >
          <FileText size={18} />
          Single ASIN
        </button>
        <button
          className={`mode-tab ${mode === 'bulk' ? 'active' : ''}`}
          onClick={() => setMode('bulk')}
        >
          <Upload size={18} />
          Bulk Mode
        </button>
      </div>

      {mode === 'single' ? (
        <div className="copywriter-layout">
          {/* Input Panel */}
          <div className="input-panel">
            <div className="input-card">
              <h3><Search size={18} /> Product Input</h3>

              <div className="form-group">
                <label>ASIN</label>
                <input
                  type="text"
                  placeholder="Enter ASIN (e.g., B08N5WRWNW)"
                  value={asinValue}
                  onChange={(e) => setAsinValue(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label><Globe size={16} /> Target Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label><MessageSquare size={16} /> Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {TONES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} - {t.desc}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Additional Keywords (comma-separated)</label>
                <textarea
                  placeholder="premium, best seller, gift idea..."
                  value={additionalKeywords}
                  onChange={(e) => setAdditionalKeywords(e.target.value)}
                  rows={3}
                />
                <span className="char-count">
                  {additionalKeywords.split(',').filter(k => k.trim()).length} keywords
                </span>
              </div>

              <div className="form-group">
                <label>Marketplace</label>
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                >
                  {MARKETPLACES.map((mp) => (
                    <option key={mp.code} value={mp.code}>{mp.flag} Amazon {mp.code}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="error-message" style={{ marginBottom: '12px' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {showManualInput && (
                <div className="manual-input-panel">
                  <div className="manual-input-header">
                    <AlertCircle size={16} />
                    <span>ASIN lookup failed — paste product data manually to keep output grounded</span>
                  </div>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label>Product Title</label>
                    <input
                      type="text"
                      placeholder="Paste the Amazon product title here"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Existing Bullet Points (one per line)</label>
                    <textarea
                      placeholder={"• Feature one\n• Feature two\n• Feature three"}
                      value={manualBullets}
                      onChange={(e) => setManualBullets(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <button
                    className="btn btn-primary btn-large"
                    onClick={handleGenerateWithManual}
                    disabled={isGenerating || (!manualTitle && !manualBullets)}
                  >
                    {isGenerating ? (
                      <><Loader2 size={20} className="spin" /> Generating...</>
                    ) : (
                      <><FileText size={20} /> Generate with Manual Data</>
                    )}
                  </button>
                </div>
              )}

              {!showManualInput && (
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleGenerate}
                  disabled={isGenerating || !asinValue}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={20} className="spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText size={20} />
                      Generate Listing Copy
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="results-panel">
            {!hasResults ? (
              <div className="results-empty">
                <FileText size={48} />
                <p>Enter an ASIN and click Generate to create optimized listing copy</p>
              </div>
            ) : (
              <div className="results-content">
                {/* Export Actions */}
                <div className="results-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={copyAll}
                  >
                    {copiedField === 'all' ? <Check size={16} /> : <Copy size={16} />}
                    Copy All
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleSave}>
                    {savedFlash ? <Check size={16} /> : <Save size={16} />}
                    {savedFlash ? 'Saved!' : 'Save Draft'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                    <Download size={16} />
                    Export
                  </button>
                </div>

                {/* Titles Section */}
                <div className="result-section">
                  <div className="section-header">
                    <h3>Product Title</h3>
                    <div className="title-tabs">
                      {titles.map((_, i) => (
                        <button
                          key={i}
                          className={`title-tab ${activeTitle === i ? 'active' : ''}`}
                          onClick={() => setActiveTitle(i)}
                        >
                          V{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="title-content">
                    <textarea
                      value={titles[activeTitle]}
                      onChange={(e) => {
                        const newTitles = [...titles]
                        newTitles[activeTitle] = e.target.value
                        setTitles(newTitles)
                      }}
                      rows={3}
                    />
                    <div className="field-footer">
                      <span className={`char-count ${titles[activeTitle]?.length > 200 ? 'warning' : ''}`}>
                        {titles[activeTitle]?.length}/200
                      </span>
                      <div className="field-actions">
                        <button
                          className="icon-btn"
                          onClick={() => copyToClipboard(titles[activeTitle], 'title')}
                        >
                          {copiedField === 'title' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          className="icon-btn"
                          title="Regenerate this title"
                          disabled={!!regeneratingField}
                          onClick={() => handleRegenerateTitle(activeTitle)}
                        >
                          {regeneratingField === `title-${activeTitle}`
                            ? <Loader2 size={16} className="spin" />
                            : <RefreshCw size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bullets Section */}
                <div className="result-section">
                  <div className="section-header">
                    <h3>Bullet Points</h3>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={!!regeneratingField}
                      onClick={handleRegenerateBullets}
                    >
                      {regeneratingField === 'bullets'
                        ? <Loader2 size={14} className="spin" />
                        : <RefreshCw size={14} />}
                      Regenerate All
                    </button>
                  </div>
                  <div className="bullets-list">
                    {bullets.map((bullet, i) => (
                      <div key={i} className="bullet-item">
                        <div className="bullet-drag">
                          <GripVertical size={16} />
                        </div>
                        <div className="bullet-number">{i + 1}</div>
                        <div className="bullet-content">
                          <textarea
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...bullets]
                              newBullets[i] = e.target.value
                              setBullets(newBullets)
                            }}
                            rows={2}
                          />
                          <div className="field-footer">
                            <span className={`char-count ${bullet.length > 500 ? 'warning' : ''}`}>
                              {bullet.length}/500
                            </span>
                            <div className="field-actions">
                              <button
                                className="icon-btn"
                                onClick={() => copyToClipboard(bullet, `bullet-${i}`)}
                              >
                                {copiedField === `bullet-${i}` ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                              <button
                                className="icon-btn"
                                title="Regenerate this bullet"
                                disabled={!!regeneratingField}
                                onClick={() => handleRegenerateBullet(i)}
                              >
                                {regeneratingField === `bullet-${i}`
                                  ? <Loader2 size={16} className="spin" />
                                  : <RefreshCw size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description Section */}
                <div className="result-section">
                  <div className="section-header">
                    <h3>Product Description</h3>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={!!regeneratingField}
                      onClick={handleRegenerateDescription}
                    >
                      {regeneratingField === 'description'
                        ? <Loader2 size={14} className="spin" />
                        : <RefreshCw size={14} />}
                      Regenerate
                    </button>
                  </div>
                  <div className="description-content">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                    />
                    <div className="field-footer">
                      <span className={`char-count ${description.length > 2000 ? 'warning' : ''}`}>
                        {description.length}/2000
                      </span>
                      <div className="field-actions">
                        <button
                          className="icon-btn"
                          onClick={() => copyToClipboard(description, 'description')}
                        >
                          {copiedField === 'description' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Terms Section */}
                <div className="result-section">
                  <div className="section-header">
                    <h3>Search Terms</h3>
                    <button className="btn btn-ghost btn-sm">
                      Optimize
                    </button>
                  </div>
                  <div className="search-terms-content">
                    <textarea
                      value={searchTerms}
                      onChange={(e) => setSearchTerms(e.target.value)}
                      rows={3}
                    />
                    <div className="field-footer">
                      <span className={`char-count ${new Blob([searchTerms]).size > 250 ? 'warning' : ''}`}>
                        <AlertCircle size={14} />
                        {new Blob([searchTerms]).size}/250 bytes
                      </span>
                      <div className="field-actions">
                        <button
                          className="icon-btn"
                          onClick={() => copyToClipboard(searchTerms, 'search')}
                        >
                          {copiedField === 'search' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Bulk Mode */
        <div className="bulk-mode">
          {/* Upload + controls */}
          <div className="bulk-upload-row">
            <label className="bulk-file-label">
              <input type="file" accept=".csv" onChange={handleBulkFileUpload} style={{ display: 'none' }} />
              <Upload size={16} />
              {bulkRows.length > 0 ? `${bulkRows.length} rows loaded` : 'Upload CSV'}
            </label>
            <button className="btn btn-ghost btn-sm" onClick={downloadCSVTemplate}>
              <Download size={15} /> Template
            </button>
            {bulkRows.length > 0 && !bulkRunning && (
              <button className="btn btn-primary btn-sm" onClick={handleBulkRun}>
                <Sparkles size={15} /> Run {bulkRows.length} ASINs
              </button>
            )}
            {bulkRunning && (
              <>
                <span className="bulk-progress-text">
                  <Loader2 size={14} className="spin" />
                  {bulkProgress?.asin} ({bulkProgress?.current}/{bulkProgress?.total})
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => { bulkCancelRef.current = true }}>
                  <X size={14} /> Cancel
                </button>
              </>
            )}
            {bulkResults.length > 0 && !bulkRunning && (
              <button className="btn btn-secondary btn-sm" onClick={exportBulkResults}>
                <Download size={15} /> Export JSON
              </button>
            )}
          </div>

          {bulkError && <div className="error-message" style={{ marginTop: 12 }}><AlertCircle size={15} /> {bulkError}</div>}

          {/* Results table */}
          {bulkResults.length > 0 && (
            <div className="bulk-results-table-wrap">
              <table className="bulk-results-table">
                <thead>
                  <tr>
                    <th>ASIN</th>
                    <th>Status</th>
                    <th>Best Title</th>
                    <th>Bullets</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResults.map((row, i) => (
                    <tr key={i} className={row.status === 'error' ? 'bulk-row-error' : ''}>
                      <td><code>{row.asin}</code></td>
                      <td>
                        <span className={`history-status-badge ${row.status === 'done' ? 'completed' : 'failed'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="bulk-title-cell">{row.titles?.[0] || row.error || '—'}</td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {row.bullets?.length ? `${row.bullets.length} bullets` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pending rows preview */}
          {bulkRows.length > 0 && bulkResults.length === 0 && !bulkRunning && (
            <div className="bulk-preview-table-wrap">
              <p className="bulk-preview-label">{bulkRows.length} rows ready to process:</p>
              <table className="bulk-results-table">
                <thead>
                  <tr><th>ASIN</th><th>Marketplace</th><th>Language</th><th>Tone</th></tr>
                </thead>
                <tbody>
                  {bulkRows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td><code>{row.asin}</code></td>
                      <td>{row.marketplace || 'US'}</td>
                      <td>{row.language || 'English'}</td>
                      <td>{row.tone || 'professional'}</td>
                    </tr>
                  ))}
                  {bulkRows.length > 10 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      …and {bulkRows.length - 10} more
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ListingCopywriter
