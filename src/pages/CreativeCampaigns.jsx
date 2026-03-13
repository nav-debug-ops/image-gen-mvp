import { useState } from 'react'
import { analyzeCampaign } from '../api/campaigns'
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
  AlertCircle
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

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
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

              <button
                className="btn btn-primary btn-large"
                onClick={handleGenerate}
                disabled={isProcessing || (inputMode === 'asin' ? !asinValue : !keyword)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    {progress?.message}
                  </>
                ) : (
                  <>
                    <TrendingUp size={20} />
                    Generate Market Intelligence
                  </>
                )}
              </button>

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
              View Market Intel
            </button>
            <button
              className={`results-tab ${activeTab === 'brief' ? 'active' : ''}`}
              onClick={() => setActiveTab('brief')}
            >
              <Image size={18} />
              View Brief
            </button>
            <button className="btn btn-secondary btn-sm export-btn">
              <Download size={16} />
              Export PDF
            </button>
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
              <p>Creative brief generation coming soon...</p>
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
