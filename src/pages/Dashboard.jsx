import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Image,
  Lightbulb,
  FileText,
  GalleryHorizontal,
  LayoutGrid,
  BookOpen,
  Store,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowRight,
  Loader2,
  ImageOff,
  RefreshCw,
  AlertCircle,
  History,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { fetchAPI, safeJson } from '../api/client'

const tools = [
  {
    name: 'Main Image Generator',
    description: 'Generate professional Amazon product images with AI. Choose from 30+ templates.',
    href: '/tools/main-image-generator',
    icon: Image,
    color: '#3B82F6',
    features: ['30+ Templates', 'Multiple AI Models', 'Img2Img'],
  },
  {
    name: 'Secondary Images',
    description: 'Create infographic-style secondary images: benefits, features, comparisons and more.',
    href: '/tools/secondary-images',
    icon: GalleryHorizontal,
    color: '#6366F1',
    features: ['7 Image Types', 'AI Briefs', 'Batch ZIP'],
  },
  {
    name: 'Listing Copywriter',
    description: 'Generate optimized titles, bullets, and descriptions in 20+ languages.',
    href: '/tools/listing-copywriter',
    icon: FileText,
    color: '#10B981',
    features: ['20+ Languages', '14 Tones', 'SEO Optimized'],
  },
  {
    name: 'A+ Content',
    description: 'Build Amazon A+ Content modules with AI-generated copy and layout suggestions.',
    href: '/tools/aplus-content',
    icon: LayoutGrid,
    color: '#F59E0B',
    features: ['15+ Modules', 'Amazon Dims', 'JSON Export'],
  },
  {
    name: 'Brand Story',
    description: 'Craft your brand narrative with Amazon Brand Story carousel modules.',
    href: '/tools/brand-story',
    icon: BookOpen,
    color: '#EC4899',
    features: ['5 Modules', 'Carousel Ready', 'Multi-market'],
  },
  {
    name: 'Storefront Designer',
    description: 'Design your Amazon Storefront pages with widgets and template pre-population.',
    href: '/tools/storefront',
    icon: Store,
    color: '#8B5CF6',
    features: ['4 Templates', '10+ Widgets', 'Multi-page'],
  },
  {
    name: 'Creative Campaigns',
    description: 'Deep market intelligence and automated creative briefs based on customer insights.',
    href: '/tools/creative-campaigns',
    icon: Lightbulb,
    color: '#14B8A6',
    features: ['Market Analysis', 'Customer Avatars', 'AI Briefs'],
  },
]

function StatusBadge({ status }) {
  if (status === 'completed') return (
    <span className="dash-status-badge dash-status-completed">
      <CheckCircle size={12} /> Done
    </span>
  )
  if (status === 'failed') return (
    <span className="dash-status-badge dash-status-failed">
      <XCircle size={12} /> Failed
    </span>
  )
  return (
    <span className="dash-status-badge dash-status-pending">
      <Clock size={12} /> {status}
    </span>
  )
}

function QuotaBar({ used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#22C55E'
  return (
    <div className="quota-bar-wrap">
      <div className="quota-bar-bg">
        <div className="quota-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="quota-bar-label">{pct}%</span>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()

  const [usage, setUsage]               = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [usageError, setUsageError]     = useState(false)

  const [recentImages, setRecentImages]       = useState([])
  const [imagesLoading, setImagesLoading]     = useState(true)
  const [imagesError, setImagesError]         = useState(false)

  const [activity, setActivity]             = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError]   = useState(false)

  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    setUsageLoading(true)
    setImagesLoading(true)
    setActivityLoading(true)
    setUsageError(false)
    setImagesError(false)
    setActivityError(false)

    const [usageRes, imagesRes, activityRes] = await Promise.allSettled([
      fetchAPI('/api/usage/summary').then(r => safeJson(r)),
      fetchAPI('/api/images/?archived=false&limit=6&offset=0').then(r => safeJson(r)),
      fetchAPI('/api/usage/history?limit=8&offset=0').then(r => safeJson(r)),
    ])

    if (usageRes.status === 'fulfilled' && usageRes.value) {
      setUsage(usageRes.value)
    } else {
      setUsageError(true)
    }
    setUsageLoading(false)

    if (imagesRes.status === 'fulfilled' && imagesRes.value?.images) {
      setRecentImages(imagesRes.value.images)
    } else {
      setImagesError(true)
    }
    setImagesLoading(false)

    if (activityRes.status === 'fulfilled' && activityRes.value?.generations) {
      setActivity(activityRes.value.generations)
    } else {
      setActivityError(true)
    }
    setActivityLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const firstName = user?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {firstName}!</h1>
          <p>Create stunning Amazon listings with AI-powered tools</p>
        </div>
        <div className="quick-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          <Link to="/tools/main-image-generator" className="btn btn-primary">
            <Zap size={18} />
            Quick Generate
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid-4">

          {/* Today */}
          <div className="stat-card">
            <div className="stat-icon"><Zap size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : usageError
                ? <span className="stat-error"><AlertCircle size={16} /> Unavailable</span>
                : <>
                    <span className="stat-value">{usage.daily.used}</span>
                    <span className="stat-label">Generated Today</span>
                    <QuotaBar used={usage.daily.used} limit={usage.daily.limit} />
                    <span className="stat-change">{usage.daily.remaining} remaining</span>
                  </>}
            </div>
          </div>

          {/* Monthly */}
          <div className="stat-card">
            <div className="stat-icon"><TrendingUp size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : usageError
                ? <span className="stat-error"><AlertCircle size={16} /> Unavailable</span>
                : <>
                    <span className="stat-value">{usage.monthly.used}</span>
                    <span className="stat-label">This Month</span>
                    <QuotaBar used={usage.monthly.used} limit={usage.monthly.limit} />
                    <span className="stat-change">/ {usage.monthly.limit} limit</span>
                  </>}
            </div>
          </div>

          {/* Total */}
          <div className="stat-card">
            <div className="stat-icon"><Image size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : usageError
                ? <span className="stat-error"><AlertCircle size={16} /> Unavailable</span>
                : <>
                    <span className="stat-value">{usage.total_generations}</span>
                    <span className="stat-label">Total Generated</span>
                    <span className="stat-change">All time</span>
                  </>}
            </div>
          </div>

          {/* Cost */}
          <div className="stat-card">
            <div className="stat-icon"><DollarSign size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : usageError
                ? <span className="stat-error"><AlertCircle size={16} /> Unavailable</span>
                : <>
                    <span className="stat-value">${usage.total_cost_estimate.toFixed(4)}</span>
                    <span className="stat-label">Est. API Cost</span>
                    <span className="stat-change">All time</span>
                  </>}
            </div>
          </div>

        </div>
      </section>

      {/* Recent Generations + Activity side-by-side */}
      <div className="dashboard-mid-row">

        {/* Recent Images */}
        <section className="projects-section">
          <div className="section-header">
            <h2>Recent Generations</h2>
            <Link to="/archive" className="view-all">View Gallery</Link>
          </div>

          {imagesLoading && (
            <div className="dashboard-images-loading">
              <Loader2 size={24} className="spin" />
              <span>Loading…</span>
            </div>
          )}

          {!imagesLoading && imagesError && (
            <div className="dashboard-error-state">
              <AlertCircle size={28} />
              <p>Could not load recent images</p>
              <button className="btn btn-ghost btn-sm" onClick={handleRefresh}>Retry</button>
            </div>
          )}

          {!imagesLoading && !imagesError && recentImages.length === 0 && (
            <div className="dashboard-images-empty">
              <ImageOff size={40} />
              <p>No images generated yet</p>
              <Link to="/tools/main-image-generator" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Generate your first image
              </Link>
            </div>
          )}

          {!imagesLoading && !imagesError && recentImages.length > 0 && (
            <div className="dashboard-images-grid">
              {recentImages.map(img => (
                <Link key={img.id} to="/archive" className="dashboard-image-card">
                  <img src={img.image_url} alt={img.prompt?.slice(0, 50)} loading="lazy" />
                  <div className="dashboard-image-overlay">
                    <span className="dashboard-image-provider">{img.provider}</span>
                    <span className="dashboard-image-date">{new Date(img.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <div className="section-header">
            <h2><History size={18} /> Recent Activity</h2>
          </div>

          {activityLoading && (
            <div className="dashboard-images-loading">
              <Loader2 size={20} className="spin" />
              <span>Loading…</span>
            </div>
          )}

          {!activityLoading && activityError && (
            <div className="dashboard-error-state">
              <AlertCircle size={24} />
              <p>Could not load activity</p>
              <button className="btn btn-ghost btn-sm" onClick={handleRefresh}>Retry</button>
            </div>
          )}

          {!activityLoading && !activityError && activity.length === 0 && (
            <div className="dashboard-images-empty">
              <History size={32} />
              <p>No activity yet</p>
            </div>
          )}

          {!activityLoading && !activityError && activity.length > 0 && (
            <div className="activity-list">
              {activity.map(gen => (
                <div key={gen.id} className="activity-row">
                  <StatusBadge status={gen.status} />
                  <span className="activity-prompt" title={gen.prompt}>
                    {gen.prompt?.slice(0, 60)}{gen.prompt?.length > 60 ? '…' : ''}
                  </span>
                  <span className="activity-meta">{gen.provider}</span>
                  <span className="activity-cost">${(gen.cost_estimate ?? 0).toFixed(4)}</span>
                  <span className="activity-date">
                    {new Date(gen.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Tools Section */}
      <section className="tools-section">
        <h2>AI Tools</h2>
        <div className="tools-grid">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.name}
                to={tool.href}
                className="tool-card"
                style={{ '--tool-color': tool.color }}
              >
                <div className="tool-icon" style={{ background: tool.color }}>
                  <Icon size={28} color="white" />
                </div>
                <div className="tool-content">
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <div className="tool-features">
                    {tool.features.map((feature) => (
                      <span key={feature} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
                <ArrowRight size={20} className="tool-arrow" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
