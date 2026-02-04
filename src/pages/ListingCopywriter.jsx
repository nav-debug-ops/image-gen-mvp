import { useState } from 'react'
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
  AlertCircle
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

// Mock generated content
const MOCK_RESULTS = {
  titles: [
    "Premium Wireless Earbuds with Active Noise Cancellation - 40H Battery Life, IPX7 Waterproof, Touch Control - Perfect for Sports & Work",
    "Pro Wireless Earbuds - Crystal Clear Sound, 40 Hour Playtime, Water Resistant IPX7 - Bluetooth 5.3 with Charging Case",
    "Ultra Wireless Earbuds ANC - Premium Sound Quality, 40H Battery, Waterproof IPX7 - Sports & Office Ready with Touch Controls"
  ],
  bullets: [
    "SUPERIOR SOUND QUALITY - Experience rich, immersive audio with 10mm drivers and active noise cancellation that blocks out 95% of ambient noise, perfect for commuting, working out, or focusing on work",
    "40-HOUR BATTERY LIFE - Never run out of power with 8 hours of playtime per charge plus 32 additional hours from the compact charging case. Quick charge gives you 2 hours of listening in just 10 minutes",
    "IPX7 WATERPROOF RATING - Workout without worry. These earbuds can withstand sweat, rain, and even accidental submersion, making them ideal for intense gym sessions or outdoor activities",
    "ERGONOMIC COMFORT FIT - Designed with 3 sizes of silicone ear tips for a secure, comfortable fit that stays in place during any activity. Lightweight at just 5g per earbud for all-day wear",
    "INTUITIVE TOUCH CONTROLS - Easily manage music, calls, and voice assistant with simple tap gestures. Seamless Bluetooth 5.3 connectivity for stable connection up to 33ft range"
  ],
  description: `Introducing our Premium Wireless Earbuds - the perfect companion for your active lifestyle. Whether you're commuting to work, hitting the gym, or simply relaxing at home, these earbuds deliver an exceptional audio experience that adapts to your environment.

Engineered with advanced 10mm drivers and active noise cancellation technology, you'll enjoy crystal-clear sound quality with deep bass and crisp highs. The ANC feature reduces ambient noise by up to 95%, allowing you to fully immerse yourself in your music or focus on important calls.

With an impressive 40-hour total battery life and convenient quick-charge capability, you'll never miss a beat. The sleek charging case fits easily in your pocket and provides multiple full charges on the go.

Built to withstand your toughest workouts, the IPX7 waterproof rating ensures these earbuds can handle sweat, rain, and even accidental drops in water. The ergonomic design with multiple ear tip sizes guarantees a secure, comfortable fit for any ear shape.`,
  searchTerms: "wireless earbuds, bluetooth earbuds, noise cancelling earphones, waterproof earbuds, sports earbuds, workout earphones, true wireless earbuds, anc earbuds, long battery earbuds, touch control earbuds"
}

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
  const [hasResults, setHasResults] = useState(false)

  // Results state
  const [titles, setTitles] = useState([])
  const [bullets, setBullets] = useState([])
  const [description, setDescription] = useState('')
  const [searchTerms, setSearchTerms] = useState('')

  // UI state
  const [activeTitle, setActiveTitle] = useState(0)
  const [copiedField, setCopiedField] = useState(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    await new Promise(r => setTimeout(r, 2000))

    setTitles(MOCK_RESULTS.titles)
    setBullets(MOCK_RESULTS.bullets)
    setDescription(MOCK_RESULTS.description)
    setSearchTerms(MOCK_RESULTS.searchTerms)

    setIsGenerating(false)
    setHasResults(true)
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
                <label>Marketplace</label>
                <div className="marketplace-grid-small">
                  {MARKETPLACES.map((mp) => (
                    <button
                      key={mp.code}
                      className={`mp-btn ${marketplace === mp.code ? 'selected' : ''}`}
                      onClick={() => setMarketplace(mp.code)}
                    >
                      {mp.flag}
                    </button>
                  ))}
                </div>
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
                  <button className="btn btn-secondary btn-sm">
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
                        <button className="icon-btn">
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bullets Section */}
                <div className="result-section">
                  <div className="section-header">
                    <h3>Bullet Points</h3>
                    <button className="btn btn-ghost btn-sm">
                      <RefreshCw size={14} />
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
                              <button className="icon-btn">
                                <RefreshCw size={16} />
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
                    <button className="btn btn-ghost btn-sm">
                      <RefreshCw size={14} />
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
          <div className="bulk-upload">
            <div className="upload-zone">
              <Upload size={48} />
              <h3>Upload CSV File</h3>
              <p>Drag and drop your CSV file or click to browse</p>
              <button className="btn btn-secondary">
                Download Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListingCopywriter
