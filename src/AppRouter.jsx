import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MainImageGenerator from './pages/MainImageGenerator'
import SecondaryImageGenerator from './pages/SecondaryImageGenerator'
import CreativeCampaigns from './pages/CreativeCampaigns'
import ListingCopywriter from './pages/ListingCopywriter'
import APlusContent from './pages/APlusContent'
import BrandStory from './pages/BrandStory'
import StorefrontDesigner from './pages/StorefrontDesigner'
import Login from './pages/Login'
import App from './App' // Original app as legacy

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f', color: '#fff' }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tools/main-image-generator" element={<MainImageGenerator />} />
          <Route path="tools/secondary-images" element={<SecondaryImageGenerator />} />
          <Route path="tools/creative-campaigns" element={<CreativeCampaigns />} />
          <Route path="tools/listing-copywriter" element={<ListingCopywriter />} />
          <Route path="tools/aplus-content" element={<APlusContent />} />
          <Route path="tools/brand-story" element={<BrandStory />} />
          <Route path="tools/storefront" element={<StorefrontDesigner />} />
          <Route path="legacy" element={<App />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default AppRouter
