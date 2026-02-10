import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MainImageGenerator from './pages/MainImageGenerator'
import SecondaryImageGenerator from './pages/SecondaryImageGenerator'
import CreativeCampaigns from './pages/CreativeCampaigns'
import ListingCopywriter from './pages/ListingCopywriter'
import APlusContent from './pages/APlusContent'
import BrandStory from './pages/BrandStory'
import StorefrontDesigner from './pages/StorefrontDesigner'
import App from './App' // Original app as legacy

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
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
  )
}

export default AppRouter
