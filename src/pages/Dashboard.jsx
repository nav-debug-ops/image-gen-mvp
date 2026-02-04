import { Link } from 'react-router-dom'
import {
  Image,
  Lightbulb,
  FileText,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  Zap
} from 'lucide-react'

const tools = [
  {
    name: 'Main Image Generator',
    description: 'Generate professional Amazon product images with AI. Choose from 30+ templates.',
    href: '/tools/main-image-generator',
    icon: Image,
    color: '#3B82F6',
    features: ['30+ Templates', 'Multiple AI Models', 'Batch Generation']
  },
  {
    name: 'Creative Campaigns',
    description: 'Deep market intelligence and automated creative briefs based on customer insights.',
    href: '/tools/creative-campaigns',
    icon: Lightbulb,
    color: '#8B5CF6',
    features: ['Market Analysis', 'Customer Avatars', 'AI Briefs']
  },
  {
    name: 'Listing Copywriter',
    description: 'Generate optimized titles, bullets, and descriptions in 20+ languages.',
    href: '/tools/listing-copywriter',
    icon: FileText,
    color: '#10B981',
    features: ['20+ Languages', '14 Tones', 'SEO Optimized']
  }
]

const recentProjects = [
  { id: 1, name: 'Wireless Earbuds Pro', marketplace: 'US', status: 'complete', images: 5 },
  { id: 2, name: 'Yoga Mat Premium', marketplace: 'UK', status: 'processing', images: 3 },
  { id: 3, name: 'Kitchen Scale', marketplace: 'DE', status: 'draft', images: 0 },
]

const stats = [
  { label: 'Images Generated', value: '127', icon: Image, change: '+12%' },
  { label: 'Projects', value: '8', icon: TrendingUp, change: '+3' },
  { label: 'Credits Used', value: '45', icon: Zap, change: 'This month' },
  { label: 'Avg. Time Saved', value: '4.2h', icon: Clock, change: 'Per project' },
]

function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome Back!</h1>
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
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon">
                  <Icon size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-change">{stat.change}</span>
                </div>
              </div>
            )
          })}
        </div>
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
                      <span key={feature} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight size={20} className="tool-arrow" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Recent Projects */}
      <section className="projects-section">
        <div className="section-header">
          <h2>Recent Projects</h2>
          <Link to="/projects" className="view-all">View All</Link>
        </div>
        <div className="projects-table">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Marketplace</th>
                <th>Status</th>
                <th>Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className="project-name">
                      <Star size={16} className="star-icon" />
                      {project.name}
                    </div>
                  </td>
                  <td>
                    <span className="marketplace-badge">
                      {project.marketplace === 'US' && '🇺🇸'}
                      {project.marketplace === 'UK' && '🇬🇧'}
                      {project.marketplace === 'DE' && '🇩🇪'}
                      {project.marketplace}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${project.status}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>{project.images}</td>
                  <td>
                    <button className="btn btn-sm">Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
