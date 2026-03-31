import { useState, useEffect } from 'react'
import { analyzeCampaign, generateInfographicBrief } from '../api/campaigns'
import {
  Search,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Target,
  Zap,
  Download,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Image,
  Loader2,
  Check,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Layers,
  Copy,
  Eye,
  ShieldCheck,
  Palette,
  Save,
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'


const MARKETPLACES = [
  { code: 'US', flag: '🇺🇸' }, { code: 'UK', flag: '🇬🇧' }, { code: 'DE', flag: '🇩🇪' },
  { code: 'FR', flag: '🇫🇷' }, { code: 'JP', flag: '🇯🇵' }, { code: 'CA', flag: '🇨🇦' }
]

function CreativeCampaigns() {
  // Input state
  const [inputMode, setInputMode] = useState('asin')
  const [asinValue, setAsinValue] = useState('')
  const [keyword, setKeyword] = useState('')
  const [marketplace, setMarketplace] = useState('US')
  const [processingMode, setProcessingMode] = useState('fast')

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(null)

  // Results state
  const [hasResults, setHasResults] = useState(false)
  const [marketIntel, setMarketIntel] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('intel')
  const [expandedSections, setExpandedSections] = useState(['overview', 'sentiment'])

  // Infographic brief state
  const [infoBrief, setInfoBrief] = useState(null)
  const [isBriefLoading, setIsBriefLoading] = useState(false)
  const [briefLoadError, setBriefLoadError] = useState(null)
  const [copiedHex, setCopiedHex] = useState(null)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')

  // Save flash state
  const [savedFlash, setSavedFlash] = useState(false)

  // Restore last campaign from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('campaign_draft')
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.asinValue) setAsinValue(d.asinValue)
      if (d.marketplace) setMarketplace(d.marketplace)
      if (d.marketIntel) { setMarketIntel(d.marketIntel); setHasResults(true) }
      if (d.infoBrief) setInfoBrief(d.infoBrief)
    } catch { /* corrupt draft — ignore */ }
  }, [])

  const handleSave = () => {
    localStorage.setItem('campaign_draft', JSON.stringify({
      asinValue, marketplace, marketIntel, infoBrief,
    }))
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const handleExport = () => {
    const payload = {
      asin: asinValue,
      marketplace,
      exported_at: new Date().toISOString(),
      market_intel: marketIntel || null,
      infographic_brief: infoBrief || null,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaign-${asinValue || 'export'}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleGenerateBrief = async () => {
    if (!asinValue) return
    setIsBriefLoading(true)
    setBriefLoadError(null)
    if (!hasResults) {
      setHasResults(true)
      setActiveTab('brief')
    } else {
      setActiveTab('brief')
    }
    try {
      const result = await generateInfographicBrief({ asin: asinValue, marketplace })
      setInfoBrief(result)
    } catch (err) {
      setBriefLoadError(err.message || 'Brief generation failed. Please try again.')
    } finally {
      setIsBriefLoading(false)
    }
  }

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1500)
  }

  const handleGenerate = async () => {
    setIsProcessing(true)
    setError(null)

    const steps = [
      'Fetching product data...',
      'Analyzing customer reviews...',
      'Studying competitor landscape...',
      'Building customer avatars...',
      'Generating strategic insights...'
    ]

    // Advance progress independently while API call runs
    let stepIdx = 0
    setProgress({ step: 1, total: steps.length, message: steps[0] })
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 2) {
        stepIdx++
        setProgress({ step: stepIdx + 1, total: steps.length, message: steps[stepIdx] })
      }
    }, 1500)

    try {
      const data = await analyzeCampaign({ asin: asinValue, marketplace })
      clearInterval(interval)
      setMarketIntel(data)
      setHasResults(true)
      setProgress(null)
    } catch (err) {
      clearInterval(interval)
      setError(err.message || 'Analysis failed. Please try again.')
      setProgress(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return

    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }])

    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Based on the market intelligence, I can see that "${chatInput}" relates to your competitive positioning. The data shows strong opportunities in the health-conscious parent segment.`
      }])
    }, 1000)

    setChatInput('')
  }

  return (
    <div className="creative-campaigns">
      <header className="page-header">
        <div>
          <h1>Creative Campaigns</h1>
          <p>AI-powered market intelligence and creative brief generation</p>
        </div>
      </header>

      {!hasResults ? (
        /* Input Section */
        <div className="campaign-input">
          <div className="input-card">
            {/* Input Mode Tabs */}
            <div className="input-tabs">
              <button
                className={`input-tab ${inputMode === 'asin' ? 'active' : ''}`}
                onClick={() => setInputMode('asin')}
              >
                <Search size={18} />
                Generate by ASIN
              </button>
              <button
                className={`input-tab ${inputMode === 'keyword' ? 'active' : ''}`}
                onClick={() => setInputMode('keyword')}
              >
                <FileText size={18} />
                Generate by Keyword
              </button>
            </div>

            <div className="input-form">
              {inputMode === 'asin' ? (
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
              ) : (
                <div className="form-group">
                  <label>Primary Keyword</label>
                  <input
                    type="text"
                    placeholder="Enter primary keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Marketplace</label>
                <div className="marketplace-select">
                  {MARKETPLACES.map((mp) => (
                    <button
                      key={mp.code}
                      className={`mp-btn ${marketplace === mp.code ? 'selected' : ''}`}
                      onClick={() => setMarketplace(mp.code)}
                    >
                      {mp.flag} {mp.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Processing Mode</label>
                <div className="mode-toggle">
                  <button
                    className={`mode-btn ${processingMode === 'fast' ? 'active' : ''}`}
                    onClick={() => setProcessingMode('fast')}
                  >
                    <Zap size={18} />
                    Fast Mode
                    <span>Auto-generate brief (~2-3 min)</span>
                  </button>
                  <button
                    className={`mode-btn ${processingMode === 'deep' ? 'active' : ''}`}
                    onClick={() => setProcessingMode('deep')}
                  >
                    <Target size={18} />
                    Deep Mode
                    <span>Detailed analysis (~5-7 min)</span>
                  </button>
                </div>
              </div>

              <div className="cc-action-row">
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleGenerate}
                  disabled={isProcessing || isBriefLoading || (inputMode === 'asin' ? !asinValue : !keyword)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="spin" />
                      {progress?.message}
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} />
                      Market Intelligence
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary btn-large"
                  onClick={handleGenerateBrief}
                  disabled={isBriefLoading || isProcessing || !asinValue}
                >
                  {isBriefLoading ? (
                    <>
                      <Loader2 size={20} className="spin" />
                      Building Brief...
                    </>
                  ) : (
                    <>
                      <Layers size={20} />
                      Infographic Brief
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="error-message" style={{ marginTop: '12px' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {isProcessing && progress && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(progress.step / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="campaign-results">
          {/* Results Tabs */}
          <div className="results-tabs">
            <button
              className={`results-tab ${activeTab === 'intel' ? 'active' : ''}`}
              onClick={() => setActiveTab('intel')}
            >
              <BarChart3 size={18} />
              Market Intel
            </button>
            <button
              className={`results-tab ${activeTab === 'brief' ? 'active' : ''}`}
              onClick={() => setActiveTab('brief')}
            >
              <Layers size={18} />
              Infographic Brief
              {infoBrief && <span className="tab-badge">7</span>}
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleSave}>
                {savedFlash ? <Check size={16} /> : <Save size={16} />}
                {savedFlash ? 'Saved!' : 'Save Draft'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                <Download size={16} />
                Export JSON
              </button>
            </div>
          </div>

          {activeTab === 'intel' ? (
            <div className="market-intel">
              {/* Overview Stats */}
              <section className="intel-section">
                <div className="stats-row">
                  <div className="stat-box">
                    <FileText size={24} />
                    <div>
                      <span className="stat-number">{marketIntel.overview.reviewsAnalyzed.toLocaleString()}</span>
                      <span className="stat-label">Reviews Analyzed</span>
                    </div>
                  </div>
                  <div className="stat-box">
                    <Users size={24} />
                    <div>
                      <span className="stat-number">{marketIntel.overview.competitorsStudied}</span>
                      <span className="stat-label">Competitors Studied</span>
                    </div>
                  </div>
                  <div className="stat-box">
                    <Target size={24} />
                    <div>
                      <span className="stat-number">{marketIntel.overview.customerAvatars}</span>
                      <span className="stat-label">Customer Avatars</span>
                    </div>
                  </div>
                  <div className="stat-box">
                    <TrendingUp size={24} />
                    <div>
                      <span className="stat-number">{marketIntel.overview.dataPoints.toLocaleString()}</span>
                      <span className="stat-label">Data Points</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sentiment & Demographics */}
              <section className="intel-section">
                <h3>Review Analysis</h3>
                <div className="charts-row">
                  <div className="chart-box">
                    <h4>Sentiment Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={marketIntel.sentiment}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {marketIntel.sentiment.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-box">
                    <h4>Customer Demographics</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={marketIntel.demographics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="male" fill="#3B82F6" name="Male" />
                        <Bar dataKey="female" fill="#EC4899" name="Female" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Themes Grid */}
              <section className="intel-section">
                <div className="themes-grid">
                  <div className="theme-column positive">
                    <h4><ThumbsUp size={18} /> Top Positive Themes</h4>
                    <ul>
                      {marketIntel.positiveThemes.map((item) => (
                        <li key={item.theme}>
                          <Check size={16} />
                          {item.theme}
                          <span className="count">({item.count})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="theme-column pain">
                    <h4><AlertTriangle size={18} /> Pain Points</h4>
                    <ul>
                      {marketIntel.painPoints.map((item) => (
                        <li key={item.point}>
                          <ThumbsDown size={16} />
                          {item.point}
                          <span className="count">({item.count})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="theme-column requests">
                    <h4><Lightbulb size={18} /> Feature Requests</h4>
                    <ul>
                      {marketIntel.featureRequests.map((item) => (
                        <li key={item.request}>
                          <Star size={16} />
                          {item.request}
                          <span className="count">({item.count})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Customer Avatars */}
              <section className="intel-section">
                <h3>Customer Avatars</h3>
                <div className="avatars-grid">
                  {marketIntel.customerAvatars.map((avatar) => (
                    <div key={avatar.name} className="avatar-card">
                      <div className="avatar-header">
                        <div className="avatar-icon">
                          <Users size={24} />
                        </div>
                        <div>
                          <h4>{avatar.name}</h4>
                          <span className={`segment-badge ${avatar.segment.toLowerCase()}`}>
                            {avatar.segment} - {avatar.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="avatar-details">
                        <div className="detail-group">
                          <h5>Demographics</h5>
                          <p>Age: {avatar.demographics.age}</p>
                          <p>Gender: {avatar.demographics.gender}</p>
                          <p>Location: {avatar.demographics.location}</p>
                          <p>Income: {avatar.demographics.income}</p>
                        </div>
                        <div className="detail-group">
                          <h5>Motivations</h5>
                          <ul>
                            {avatar.motivations.map((m) => (
                              <li key={m}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Strategic Recommendations */}
              <section className="intel-section">
                <h3>Strategic Recommendations</h3>
                <div className="recommendations-grid">
                  {Object.entries(marketIntel.recommendations).map(([key, items]) => (
                    <div key={key} className="recommendation-card">
                      <h4>{key.charAt(0).toUpperCase() + key.slice(1)} Strategy</h4>
                      <ul>
                        {items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="creative-brief">
              {/* Loading state */}
              {isBriefLoading && (
                <div className="brief-loading-state">
                  <Loader2 size={36} className="spin" />
                  <p>Generating 7-infographic campaign brief...</p>
                  <span>Analyzing product, extracting color palette, mapping competitor gaps</span>
                </div>
              )}

              {/* Error state */}
              {briefLoadError && !isBriefLoading && (
                <div className="brief-error-state">
                  <AlertCircle size={32} />
                  <p>{briefLoadError}</p>
                  <button className="btn btn-primary btn-sm" onClick={handleGenerateBrief}>
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!infoBrief && !isBriefLoading && !briefLoadError && (
                <div className="brief-empty-state">
                  <Layers size={48} />
                  <p>No infographic brief yet</p>
                  <span>Click "Infographic Brief" from the input screen, or:</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleGenerateBrief}
                    disabled={!asinValue}
                  >
                    <Layers size={15} /> Generate Brief for {asinValue || 'this ASIN'}
                  </button>
                </div>
              )}

              {/* Full brief document */}
              {infoBrief && !isBriefLoading && (
                <div className="brief-doc">

                  {/* Doc header */}
                  <div className="brief-doc-header">
                    <div className="brief-doc-title">
                      <h2>{infoBrief.product_title || 'Product Brief'}</h2>
                      <p className="brief-doc-meta">
                        {infoBrief.brand && <span>{infoBrief.brand}</span>}
                        {infoBrief.asin && <span>ASIN: {infoBrief.asin}</span>}
                        <span>{infoBrief.campaign_type || 'Secondary Images'}</span>
                      </p>
                    </div>
                    <div className="brief-doc-stats">
                      <div className="brief-doc-stat">
                        <span className="brief-doc-stat-num">{infoBrief.total_infographics || 7}</span>
                        <span className="brief-doc-stat-label">Infographics</span>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleGenerateBrief}
                        disabled={isBriefLoading}
                      >
                        <Loader2 size={13} className={isBriefLoading ? 'spin' : ''} style={{ opacity: isBriefLoading ? 1 : 0, position: 'absolute' }} />
                        Regenerate
                      </button>
                    </div>
                  </div>

                  {/* Color Palette */}
                  {infoBrief.color_palette && (
                    <section className="brief-section">
                      <div className="brief-section-title">
                        <Palette size={18} />
                        <h3>Brand Color Palette</h3>
                        <span className="brief-section-source">{infoBrief.color_palette.source}</span>
                      </div>
                      <div className="brief-palette-grid">
                        {['primary','secondary','accent','background','typography'].map(role => {
                          const c = infoBrief.color_palette[role]
                          if (!c) return null
                          return (
                            <div key={role} className="brief-palette-tile" onClick={() => copyHex(c.hex)}>
                              <div className="brief-palette-color" style={{ background: c.hex }} />
                              <div className="brief-palette-info">
                                <span className="brief-palette-role">{role}</span>
                                <span className="brief-palette-name">{c.name}</span>
                                <span className="brief-palette-hex">
                                  {copiedHex === c.hex ? <Check size={11} /> : <Copy size={11} />}
                                  {c.hex}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* Competitor Gap */}
                  {infoBrief.competitor_gap && (
                    <section className="brief-section">
                      <div className="brief-section-title">
                        <Target size={18} />
                        <h3>Competitor Gap Analysis</h3>
                      </div>
                      <div className="brief-gap-cards">
                        <div className="brief-gap-card brief-gap-whitespace">
                          <div className="brief-gap-icon"><Eye size={18} /></div>
                          <div>
                            <h4>Whitespace Opportunity</h4>
                            <p>{infoBrief.competitor_gap.whitespace_opportunity}</p>
                          </div>
                        </div>
                        <div className="brief-gap-card brief-gap-hook">
                          <div className="brief-gap-icon"><Zap size={18} /></div>
                          <div>
                            <h4>Differentiation Hook</h4>
                            <p>{infoBrief.competitor_gap.differentiation_hook}</p>
                          </div>
                        </div>
                      </div>
                      {infoBrief.competitor_gap.competitors?.length > 0 && (
                        <div className="brief-competitors-table-wrap">
                          <table className="brief-competitors-table">
                            <thead>
                              <tr>
                                <th>Competitor</th>
                                <th>Hero Benefit</th>
                                <th>Visual Style</th>
                                <th>Price</th>
                                <th>Strength</th>
                                <th>Weakness</th>
                              </tr>
                            </thead>
                            <tbody>
                              {infoBrief.competitor_gap.competitors.map((c, i) => (
                                <tr key={i}>
                                  <td className="comp-name">{c.name}</td>
                                  <td>{c.hero_benefit}</td>
                                  <td>{c.visual_style}</td>
                                  <td>{c.price_positioning}</td>
                                  <td className="comp-strength">{c.strength}</td>
                                  <td className="comp-weakness">{c.weakness}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Awareness & Persuasion Layer */}
                  {infoBrief.infographics?.filter(i => i.layer === 'Awareness & Persuasion').length > 0 && (
                    <section className="brief-section">
                      <div className="brief-section-title">
                        <TrendingUp size={18} />
                        <h3>Layer 1: Awareness & Persuasion</h3>
                        <span className="brief-layer-pill awareness">Infographics 1–4</span>
                      </div>
                      <div className="brief-infographics-grid awareness-grid">
                        {infoBrief.infographics.filter(i => i.layer === 'Awareness & Persuasion').map(brief => (
                          <div key={brief.number} className="brief-infographic-card awareness-card">
                            <div className="bic-header">
                              <div className="bic-num">{brief.number}</div>
                              <div className="bic-headlines">
                                <span className="bic-headline">{brief.headline}</span>
                                <span className="bic-subheadline">{brief.subheadline}</span>
                              </div>
                            </div>
                            <div className="bic-body">
                              <div className="bic-field">
                                <label>Purpose</label>
                                <p>{brief.purpose}</p>
                              </div>
                              <div className="bic-visuals">
                                <div className="bic-field">
                                  <label>Hero Shot</label>
                                  <p>{brief.dominant_visual_moments?.moment_1}</p>
                                </div>
                                <div className="bic-field">
                                  <label>Supporting Visual</label>
                                  <p>{brief.dominant_visual_moments?.moment_2}</p>
                                </div>
                              </div>
                              {brief.composition_rules?.length > 0 && (
                                <div className="bic-field">
                                  <label>Composition Rules</label>
                                  <ul className="bic-rules">
                                    {brief.composition_rules.map((r, i) => <li key={i}>{r}</li>)}
                                  </ul>
                                </div>
                              )}
                              {brief.supporting_element && (
                                <div className="bic-field bic-support">
                                  <label>Supporting Element</label>
                                  <p>{brief.supporting_element}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Trust & Conversion Layer */}
                  {infoBrief.infographics?.filter(i => i.layer === 'Trust & Conversion').length > 0 && (
                    <section className="brief-section">
                      <div className="brief-section-title">
                        <ShieldCheck size={18} />
                        <h3>Layer 2: Trust & Conversion</h3>
                        <span className="brief-layer-pill trust">Infographics 5–7</span>
                      </div>
                      <div className="brief-infographics-grid trust-grid">
                        {infoBrief.infographics.filter(i => i.layer === 'Trust & Conversion').map(brief => (
                          <div key={brief.number} className="brief-infographic-card trust-card">
                            <div className="bic-header">
                              <div className="bic-num trust-num">{brief.number}</div>
                              <div className="bic-headlines">
                                <span className="bic-headline">{brief.intent}</span>
                                <span className="bic-subheadline bic-doubt">"{brief.resolved_doubt}"</span>
                              </div>
                            </div>
                            <div className="bic-body">
                              <div className="bic-visuals">
                                <div className="bic-field">
                                  <label>Primary Subject</label>
                                  <p>{brief.main_subjects?.subject_1}</p>
                                </div>
                                <div className="bic-field">
                                  <label>Secondary Subject</label>
                                  <p>{brief.main_subjects?.subject_2}</p>
                                </div>
                              </div>
                              {brief.aesthetics && (
                                <div className="bic-aesthetics">
                                  <span><strong>Style:</strong> {brief.aesthetics.visual_style}</span>
                                  <span><strong>Mood:</strong> {brief.aesthetics.mood}</span>
                                  <span className="bic-premium">{brief.aesthetics.premium_tone_via_material_cues}</span>
                                </div>
                              )}
                              {brief.guidelines?.length > 0 && (
                                <div className="bic-field">
                                  <label>Designer Guidelines</label>
                                  <ul className="bic-rules">
                                    {brief.guidelines.map((g, i) => <li key={i}>{g}</li>)}
                                  </ul>
                                </div>
                              )}
                              {brief.emphasis && (
                                <div className="bic-field bic-emphasis-field">
                                  <label>Key Emphasis</label>
                                  <p className="bic-emphasis">{brief.emphasis}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                </div>
              )}
            </div>
          )}

          {/* AI Chat Panel */}
          <button
            className="chat-toggle"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageSquare size={20} />
          </button>

          {chatOpen && (
            <div className="chat-panel">
              <div className="chat-header">
                <h4>AI Assistant</h4>
                <button onClick={() => setChatOpen(false)}>&times;</button>
              </div>
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="chat-suggestions">
                <button onClick={() => setChatInput('Top 3 competitor weaknesses?')}>
                  Top 3 competitor weaknesses?
                </button>
                <button onClick={() => setChatInput('Best headlines for main image?')}>
                  Best headlines for main image?
                </button>
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about market insights..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <button onClick={sendChatMessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CreativeCampaigns
