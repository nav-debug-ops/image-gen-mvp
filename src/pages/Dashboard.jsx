import { useState, useEffect } from 'react'
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
  Clock,
  Zap,
  ArrowRight,
  Loader2,
  ImageOff,
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

function Dashboard() {
  const { user } = useAuth()
  const [usage, setUsage] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [recentImages, setRecentImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/usage/summary')
      .then(res => safeJson(res))
      .then(data => { if (data) setUsage(data) })
      .catch(() => {})
      .finally(() => setUsageLoading(false))

    fetchAPI('/api/images/?archived=false&limit=6&offset=0')
      .then(res => safeJson(res))
      .then(data => { if (data?.images) setRecentImages(data.images) })
      .catch(() => {})
      .finally(() => setImagesLoading(false))
  }, [])

  const firstName = user?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {firstName}!</h1>
          <p>Create stunning Amazon listings with AI-powered tools</p>
        </div>
        <div className="quick-actions">
          <Link to="/tools/main-image-generator" className="btn btn-primary">
            <Zap size={18} />
            Quick Generate
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid-4">
          {/* Today's usage */}
          <div className="stat-card">
            <div className="stat-icon"><Zap size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : <>
                    <span className="stat-value">{usage?.daily.used ?? '—'}</span>
                    <span className="stat-label">Generated Today</span>
                    <span className="stat-change">{usage ? `${usage.daily.remaining} remaining` : ''}</span>
                  </>}
            </div>
          </div>

          {/* Monthly usage */}
          <div className="stat-card">
            <div className="stat-icon"><TrendingUp size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : <>
                    <span className="stat-value">{usage?.monthly.used ?? '—'}</span>
                    <span className="stat-label">This Month</span>
                    <span className="stat-change">{usage ? `/ ${usage.monthly.limit} limit` : ''}</span>
                  </>}
            </div>
          </div>

          {/* Total generations */}
          <div className="stat-card">
            <div className="stat-icon"><Image size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : <>
                    <span className="stat-value">{usage?.total_generations ?? '—'}</span>
                    <span className="stat-label">Total Generated</span>
                    <span className="stat-change">All time</span>
                  </>}
            </div>
          </div>

          {/* Total cost */}
          <div className="stat-card">
            <div className="stat-icon"><Clock size={24} /></div>
            <div className="stat-info">
              {usageLoading
                ? <Loader2 size={20} className="spin" />
                : <>
                    <span className="stat-value">
                      {usage ? `$${usage.total_cost_estimate.toFixed(3)}` : '—'}
                    </span>
                    <span className="stat-label">Est. API Cost</span>
                    <span className="stat-change">All time</span>
                  </>}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Generations */}
      <section className="projects-section">
        <div className="section-header">
          <h2>Recent Generations</h2>
          <Link to="/archive" className="view-all">View Gallery</Link>
        </div>

        {imagesLoading && (
          <div className="dashboard-images-loading">
            <Loader2 size={24} className="spin" />
            <span>Loading recent images…</span>
          </div>
        )}

        {!imagesLoading && recentImages.length === 0 && (
          <div className="dashboard-images-empty">
            <ImageOff size={40} />
            <p>No images generated yet</p>
            <Link to="/tools/main-image-generator" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Generate your first image
            </Link>
          </div>
        )}

        {!imagesLoading && recentImages.length > 0 && (
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
