import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Image,
  GalleryHorizontal,
  Lightbulb,
  FileText,
  LayoutGrid,
  Coins,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Main Image Generator', href: '/tools/main-image-generator', icon: Image },
  { name: 'Secondary Images', href: '/tools/secondary-images', icon: GalleryHorizontal },
  { name: 'A+ Content', href: '/tools/aplus-content', icon: LayoutGrid },
  { name: 'Creative Campaigns', href: '/tools/creative-campaigns', icon: Lightbulb },
  { name: 'Listing Copywriter', href: '/tools/listing-copywriter', icon: FileText },
]

function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [credits] = useState(100) // Mock credits

  return (
    <div className="layout">
      {/* Mobile sidebar toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar-nav ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <Image size={28} className="logo-icon" />
            <span>Amazon Listing Pro</span>
          </Link>
        </div>

        <nav className="nav-links">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
                {isActive && <ChevronRight size={16} className="nav-arrow" />}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="credits-display">
            <Coins size={18} />
            <span>{credits} Credits</span>
          </div>
          <Link to="/legacy" className="legacy-link">
            Legacy Generator
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout
