import { useState, useEffect, useCallback } from 'react'
import PromptInput, { MAIN_IMAGE_TEMPLATES, ASPECT_RATIOS } from './components/PromptInput'
import ImageDisplay from './components/ImageDisplay'
import History from './components/History'
import Gallery from './components/Gallery'
import SettingsPanel from './components/SettingsPanel'
import ReferenceImageUpload from './components/ReferenceImageUpload'
import StylePresets from './components/StylePresets'
import PromptPreview from './components/PromptPreview'
import { generateImage, getProviderInfo } from './api/imageGen'
import { initDatabase, saveImage, getAllImages, getFavoriteImages, put, remove, getAll, clear, getAllPresets, savePreset, deletePreset } from './services/database'

// Build optimized prompt based on Amazon listing image type
function buildAmazonPrompt(basePrompt, imageType, productCategory, productName, mainTemplate) {
  const categoryContext = productCategory ? `${productCategory} product: ` : ''
  const productContext = productName ? `"${productName}" - ` : ''

  // Get template modifier for main images
  const templateModifier = imageType === 'main' && mainTemplate
    ? MAIN_IMAGE_TEMPLATES.find(t => t.id === mainTemplate)?.promptModifier || ''
    : ''

  const typePrompts = {
    main: `Professional Amazon product photography, ${categoryContext}${productContext}${basePrompt}, ${templateModifier}, pure white background RGB(255,255,255), studio lighting, product centered and filling 85% of frame, high resolution, sharp focus, no text, no logos, no watermarks, commercial product shot`,
    lifestyle: `Lifestyle product photography for Amazon listing, ${categoryContext}${productContext}${basePrompt}, natural setting, product in use, warm lighting, aspirational scene, high quality, professional photography, showing product benefits in real life context`,
    infographic: `Amazon product infographic image, ${categoryContext}${productContext}${basePrompt}, clean layout, feature callouts, benefit highlights, professional design, easy to read, white or light background, product showcase with key features labeled`,
    detail: `Macro product photography for Amazon, ${categoryContext}${productContext}${basePrompt}, extreme close-up detail shot, sharp focus on texture and materials, studio lighting, professional quality, showing craftsmanship and quality`,
    comparison: `Amazon comparison infographic, ${categoryContext}${productContext}${basePrompt}, side by side comparison layout, clear visual difference, professional design, highlighting advantages, clean background`
  }

  return typePrompts[imageType] || basePrompt
}

function App() {
  // Core state
  const [prompt, setPrompt] = useState('')
  const [imageType, setImageType] = useState('main')
  const [productCategory, setProductCategory] = useState('')
  const [productName, setProductName] = useState('')
  const [productAsin, setProductAsin] = useState('')
  const [mainTemplate, setMainTemplate] = useState('hero')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [currentImage, setCurrentImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(null)
  const [error, setError] = useState(null)

  // Data state
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [allImages, setAllImages] = useState([])

  // Reference images state
  const [referenceImages, setReferenceImages] = useState([])
  const [stylePresets, setStylePresets] = useState([])

  // UI state
  const [activeTab, setActiveTab] = useState('generate')
  const [dbReady, setDbReady] = useState(false)

  const providerInfo = getProviderInfo()

  // Initialize database and load data
  useEffect(() => {
    async function init() {
      try {
        await initDatabase()
        setDbReady(true)

        // Load existing data
        const images = await getAllImages()
        const favs = await getFavoriteImages()
        const presets = await getAllPresets()

        setAllImages(images)
        setHistory(images.slice(0, 50))
        setFavorites(favs)
        setStylePresets(presets || [])
      } catch (err) {
        console.error('Initialization error:', err)
      }
    }
    init()
  }, [])

  // Handle image generation
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setError(null)
    setLoadingProgress({ status: 'starting', progress: 0, message: 'Preparing...' })

    try {
      const fullPrompt = buildAmazonPrompt(prompt, imageType, productCategory, productName, mainTemplate)

      // Get dimensions for the selected aspect ratio
      const ratioConfig = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0]

      // Pass reference images and aspect ratio to API
      const result = await generateImage(fullPrompt, {
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        aspectRatio: aspectRatio,
        width: ratioConfig.dimensions.width,
        height: ratioConfig.dimensions.height
      }, (progress) => {
        setLoadingProgress(progress)
      })

      const newEntry = {
        id: Date.now(),
        prompt,
        fullPrompt,
        imageType,
        productCategory,
        productName,
        productAsin,
        mainTemplate: imageType === 'main' ? mainTemplate : null,
        aspectRatio,
        imageUrl: result.url,
        provider: result.provider,
        model: result.model,
        isFavorite: false,
        timestamp: new Date().toISOString(),
        usedReferences: result.usedReferences || 0,
        referenceCount: referenceImages.length
      }

      // Save to database
      if (dbReady) {
        await saveImage(newEntry)
      }

      setCurrentImage(newEntry)
      setHistory(prev => [newEntry, ...prev].slice(0, 50))
      setAllImages(prev => [newEntry, ...prev])
    } catch (err) {
      setError(err.message || 'Failed to generate image')
    } finally {
      setIsLoading(false)
      setLoadingProgress(null)
    }
  }, [prompt, imageType, productCategory, productName, productAsin, mainTemplate, aspectRatio, dbReady, referenceImages])

  // Favorites management
  const handleSaveToFavorites = useCallback(async () => {
    if (!currentImage || currentImage.isFavorite) return

    const updated = { ...currentImage, isFavorite: true }
    if (dbReady) {
      await saveImage(updated)
    }

    setCurrentImage(updated)
    setFavorites(prev => [updated, ...prev])
    setHistory(prev => prev.map(img => img.id === updated.id ? updated : img))
    setAllImages(prev => prev.map(img => img.id === updated.id ? updated : img))
  }, [currentImage, dbReady])

  const handleRemoveFromFavorites = useCallback(async (id) => {
    const image = allImages.find(img => img.id === id)
    if (!image) return

    const updated = { ...image, isFavorite: false }
    if (dbReady) {
      await saveImage(updated)
    }

    setFavorites(prev => prev.filter(f => f.id !== id))
    setHistory(prev => prev.map(img => img.id === id ? updated : img))
    setAllImages(prev => prev.map(img => img.id === id ? updated : img))
    if (currentImage?.id === id) {
      setCurrentImage(updated)
    }
  }, [allImages, currentImage, dbReady])

  // History management
  const handleHistorySelect = useCallback((entry) => {
    setCurrentImage(entry)
    setPrompt(entry.prompt)
    if (entry.imageType) setImageType(entry.imageType)
    if (entry.productCategory) setProductCategory(entry.productCategory)
    if (entry.productName) setProductName(entry.productName)
    if (entry.productAsin) setProductAsin(entry.productAsin)
    if (entry.mainTemplate) setMainTemplate(entry.mainTemplate)
    if (entry.aspectRatio) setAspectRatio(entry.aspectRatio)
  }, [])

  const handleClearHistory = useCallback(async () => {
    setHistory([])
    // Note: This only clears UI, not database
  }, [])

  // Clear all data
  const handleClearAllData = useCallback(async () => {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) return

    if (dbReady) {
      await clear('images')
    }

    setHistory([])
    setFavorites([])
    setAllImages([])
    setCurrentImage(null)
  }, [dbReady])

  // Style preset management
  const handleSavePreset = useCallback(async (preset) => {
    if (dbReady) {
      await savePreset(preset)
    }
    setStylePresets(prev => [...prev, preset])
  }, [dbReady])

  const handleLoadPreset = useCallback((preset) => {
    // Load reference images from the preset
    const loadedImages = preset.images.map(img => ({
      ...img,
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      preview: img.base64 // Use base64 as preview since we don't have object URLs
    }))
    setReferenceImages(loadedImages)
  }, [])

  const handleDeletePreset = useCallback(async (presetId) => {
    if (dbReady) {
      await deletePreset(presetId)
    }
    setStylePresets(prev => prev.filter(p => p.id !== presetId))
  }, [dbReady])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveToFavorites()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleGenerate, handleSaveToFavorites])

  const isFavorited = currentImage?.isFavorite

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <h1>Amazon Listing Image Generator</h1>
          <span className="badge">{providerInfo.isDemo ? 'DEMO' : providerInfo.provider.toUpperCase()}</span>
        </div>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate
          </button>
          <button
            className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            Saved ({favorites.length})
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      {activeTab === 'generate' ? (
        <main className="main">
          <div className="sidebar">
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              imageType={imageType}
              setImageType={setImageType}
              productCategory={productCategory}
              setProductCategory={setProductCategory}
              productName={productName}
              setProductName={setProductName}
              productAsin={productAsin}
              setProductAsin={setProductAsin}
              mainTemplate={mainTemplate}
              setMainTemplate={setMainTemplate}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
            />
            <ReferenceImageUpload
              referenceImages={referenceImages}
              setReferenceImages={setReferenceImages}
              disabled={isLoading}
            />
            <StylePresets
              presets={stylePresets}
              currentImages={referenceImages}
              onSavePreset={handleSavePreset}
              onLoadPreset={handleLoadPreset}
              onDeletePreset={handleDeletePreset}
              disabled={isLoading}
            />
            <PromptPreview
              textPrompt={prompt}
              referenceImages={referenceImages}
              imageType={imageType}
              productCategory={productCategory}
            />
            <History
              history={history}
              onSelect={handleHistorySelect}
              onClear={handleClearHistory}
              currentId={currentImage?.id}
            />
          </div>

          <div className="content">
            <ImageDisplay
              image={currentImage}
              isLoading={isLoading}
              loadingProgress={loadingProgress}
              error={error}
              onSave={handleSaveToFavorites}
              isFavorited={isFavorited}
            />
          </div>
        </main>
      ) : activeTab === 'gallery' ? (
        <main className="main gallery-main">
          <Gallery
            favorites={favorites}
            onRemove={handleRemoveFromFavorites}
            onSelect={(entry) => {
              setCurrentImage(entry)
              setPrompt(entry.prompt)
              if (entry.imageType) setImageType(entry.imageType)
              if (entry.productCategory) setProductCategory(entry.productCategory)
              if (entry.productName) setProductName(entry.productName)
              if (entry.productAsin) setProductAsin(entry.productAsin)
              if (entry.mainTemplate) setMainTemplate(entry.mainTemplate)
              if (entry.aspectRatio) setAspectRatio(entry.aspectRatio)
              setActiveTab('generate')
            }}
          />
        </main>
      ) : (
        <main className="main settings-main">
          <SettingsPanel
            images={allImages}
            onClearData={handleClearAllData}
          />
        </main>
      )}

      <footer className="footer">
        <span className="shortcut">Ctrl+Enter: Generate</span>
        <span className="shortcut">Ctrl+S: Save to Gallery</span>
      </footer>
    </div>
  )
}

export default App
