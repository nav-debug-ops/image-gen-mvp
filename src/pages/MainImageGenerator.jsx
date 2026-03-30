import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  Search,
  Sliders,
  Image,
  Download,
  RefreshCw,
  Save,
  Check,
  X,
  Loader2,
  Package,
  TrendingUp,
  MousePointerClick,
  Lightbulb,
  Zap,
  Maximize2,
  Pencil,
  BookmarkCheck,
  ExternalLink,
  Undo2,
  ZoomIn,
  ZoomOut,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { generateImage, generateHeroImage, uploadReferenceImage } from '../api/imageGen'
import { lookupASIN } from '../api/asin'
import EvalScoreBadge from '../components/EvalScoreBadge'
import { PRODUCT_CATEGORIES } from '../constants/productCategories'
import {
  buildImagePrompt,
  getRecommendedTemplates,
  getCategoryInsight,
  getCtrDifferentiator,
} from '../constants/imageCategoryPrompts'
import { detectCategoryFromProduct } from '../constants/detectCategory'

// Template categories and items
const TEMPLATE_CATEGORIES = ['All', 'Basic', 'Packaging', 'Elements', 'Tags', 'Lifestyle', 'Advanced']

const TEMPLATES = [
  // Basic
  { id: 'white-bg', name: 'Plain White Background', category: 'Basic', thumbnail: '⬜' },
  { id: 'shadow', name: 'Product with Shadow', category: 'Basic', thumbnail: '🌓' },
  { id: 'platform', name: 'On Platform', category: 'Basic', thumbnail: '📦' },
  { id: 'angles', name: 'Different Angles', category: 'Basic', thumbnail: '🔄' },
  { id: 'floating', name: 'Floating', category: 'Basic', thumbnail: '🎈' },
  // Packaging
  { id: 'pack-left', name: 'Product + Packaging Left', category: 'Packaging', thumbnail: '📦' },
  { id: 'pack-right', name: 'Product + Packaging Right', category: 'Packaging', thumbnail: '📦' },
  { id: 'pack-front', name: 'Packaging Front', category: 'Packaging', thumbnail: '🎁' },
  { id: 'pack-emerging', name: 'Emerging from Box', category: 'Packaging', thumbnail: '📤' },
  { id: 'pack-open', name: 'Open Display', category: 'Packaging', thumbnail: '📬' },
  // Elements
  { id: 'ingredients', name: 'Product + Ingredients', category: 'Elements', thumbnail: '🧪' },
  { id: 'accessories', name: 'With Accessories', category: 'Elements', thumbnail: '🔧' },
  { id: 'element-tag', name: 'Element + Tag', category: 'Elements', thumbnail: '🏷️' },
  { id: 'before-after', name: 'Before/After', category: 'Elements', thumbnail: '↔️' },
  { id: 'size-compare', name: 'Size Comparison', category: 'Elements', thumbnail: '📏' },
  // Tags
  { id: 'corner-tag', name: 'Corner Tag', category: 'Tags', thumbnail: '📐' },
  { id: 'ribbon', name: 'Ribbon Badge', category: 'Tags', thumbnail: '🎀' },
  { id: 'quantity', name: 'Quantity Indicator', category: 'Tags', thumbnail: '🔢' },
  { id: 'quality-cert', name: 'Quality Certification', category: 'Tags', thumbnail: '✅' },
  { id: 'feature-callout', name: 'Feature Callout', category: 'Tags', thumbnail: '💬' },
  { id: 'award', name: 'Award Badge', category: 'Tags', thumbnail: '🏆' },
  { id: 'sale-tag', name: 'Sale Tag', category: 'Tags', thumbnail: '💰' },
  // Lifestyle
  { id: 'with-hand', name: 'With Hand/Avatar', category: 'Lifestyle', thumbnail: '🤚' },
  { id: 'in-use', name: 'In Use', category: 'Lifestyle', thumbnail: '👤' },
  { id: 'complementary', name: 'With Complementary Items', category: 'Lifestyle', thumbnail: '🎯' },
  { id: 'splash', name: 'Splash Effect', category: 'Lifestyle', thumbnail: '💦' },
  { id: 'premium-lighting', name: 'Premium Lighting', category: 'Lifestyle', thumbnail: '✨' },
  // Advanced
  { id: 'multi-angle', name: 'Multi-angle Composite', category: 'Advanced', thumbnail: '🔲' },
  { id: 'bundle', name: 'Bundle Display', category: 'Advanced', thumbnail: '📦' },
  { id: 'exploded', name: 'Exploded View', category: 'Advanced', thumbnail: '💥' },
  { id: 'infographic', name: 'Infographic Style', category: 'Advanced', thumbnail: '📊' },
  { id: 'comparison', name: 'Comparison Layout', category: 'Advanced', thumbnail: '⚖️' },
]

const IMAGE_STRATEGIES = [
  {
    id: 'top-performing',
    name: 'Top-Performing',
    icon: TrendingUp,
    description: 'Proven approach used by bestsellers — safe, high-converting, Amazon-compliant',
  },
  {
    id: 'high-ctr',
    name: 'High-CTR',
    icon: MousePointerClick,
    description: 'Visually distinctive to maximize click-through — bold, differentiated, thumb-stopping',
  },
]

const AI_MODELS = [
  { id: 'imagen-4',       provider: 'gemini', model: 'imagen-4.0-generate-001',        name: 'Imagen 4',               description: 'Best quality hero images',      badge: 'Recommended' },
  { id: 'imagen-4-ultra', provider: 'gemini', model: 'imagen-4.0-ultra-generate-001',   name: 'Imagen 4 Ultra',         description: 'Highest quality, slower',       badge: 'Ultra' },
  { id: 'imagen-4-fast',  provider: 'gemini', model: 'imagen-4.0-fast-generate-001',    name: 'Imagen 4 Fast',          description: 'Faster generation',             badge: 'Fast' },
  { id: 'gemini-flash',   provider: 'gemini', model: 'gemini-2.5-flash-image',          name: 'Gemini 2.5 Flash Image', description: 'Native gen + img2img support',  badge: null },
  { id: 'gemini-3-flash', provider: 'gemini', model: 'gemini-3.1-flash-image-preview',  name: 'Gemini 3.1 Flash Image', description: 'Latest native image preview',    badge: 'New' },
  { id: 'gemini-3-pro',   provider: 'gemini', model: 'gemini-3-pro-image-preview',      name: 'Gemini 3 Pro Image',     description: 'Pro-quality native generation', badge: null },
]

const MARKETPLACES = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'UK', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'IN', flag: '🇮🇳', name: 'India' },
  { code: 'CN', flag: '🇨🇳', name: 'China' },
  { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'TR', flag: '🇹🇷', name: 'Turkey' },
]

// Amazon-compliant aspect ratios only
const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square', width: 2000, height: 2000, icon: '⬜', description: 'Standard for main & additional images', recommended: true },
  { id: '4:3', name: 'Portrait', width: 2000, height: 1500, icon: '🖼️', description: 'Common for product photography' },
  { id: '3:2', name: 'Rectangle', width: 2000, height: 1333, icon: '📷', description: 'Desktop search results' },
]

function MainImageGenerator() {
  // Input state
  const [inputMode, setInputMode] = useState('asin') // 'asin' | 'upload'
  const [asinValue, setAsinValue] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Confirmed product image for img2img
  const [referenceImageUrl, setReferenceImageUrl] = useState(null)

  // Configuration state
  const [quantity, setQuantity] = useState(3)
  const [selectedModel, setSelectedModel] = useState('imagen-4')
  const [marketplace, setMarketplace] = useState('US')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [selectedTemplates, setSelectedTemplates] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [productCategory, setProductCategory] = useState('')
  const [imageStrategy, setImageStrategy] = useState('top-performing')
  const [productDesc, setProductDesc] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [generatedImages, setGeneratedImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [error, setError] = useState(null)

  // ASIN lookup state
  const [asinLookupLoading, setAsinLookupLoading] = useState(false)
  const [asinProduct, setAsinProduct] = useState(null)  // confirmed product data
  const [asinError, setAsinError] = useState(null)

  // Hero prompts modal state
  const [promptsModal, setPromptsModal] = useState(null)  // null | { img, prompts, allText }
  const [variationGenerating, setVariationGenerating] = useState(null)  // index being generated

  const handleViewPrompts = (img, e) => {
    e.stopPropagation()
    setPromptsModal({ img, prompts: img.heroPrompts, allText: img.allPromptsText })
  }

  const handleGenerateVariation = async (variationIdx) => {
    if (!promptsModal) return
    const { img } = promptsModal
    setVariationGenerating(variationIdx)
    try {
      const result = await generateHeroImage({
        asin: img.asin,
        marketplace: img.marketplace,
        templateName: img.template,
        aspectRatio: img.aspectRatio,
        promptVariation: variationIdx,
      })
      const newImage = {
        id: Date.now(),
        imageId: result.imageId,
        url: result.url,
        prompt: result.activePrompt || promptsModal.prompts[variationIdx] || '',
        template: img.template,
        templateId: img.templateId,
        model: result.model,
        provider: result.provider,
        aspectRatio: img.aspectRatio,
        strategy: img.strategy,
        category: img.category,
        timestamp: new Date().toISOString(),
        heroPrompts: result.imagePrompts || img.heroPrompts,
        allPromptsText: result.allPrompts || img.allPromptsText,
        isHeroGenerated: true,
        asin: img.asin,
        marketplace: img.marketplace,
      }
      setGeneratedImages(prev => [newImage, ...prev])
      setPromptsModal(null)
    } catch (err) {
      setError(`Variation generation failed: ${err.message}`)
    } finally {
      setVariationGenerating(null)
    }
  }

  // ASIN validation
  const isValidASIN = (asin) => /^[A-Z0-9]{10}$/i.test(asin)

  const handleAsinSearch = async () => {
    if (!isValidASIN(asinValue)) return
    setAsinLookupLoading(true)
    setAsinProduct(null)
    setAsinError(null)
    try {
      const product = await lookupASIN(asinValue, marketplace)
      setAsinProduct(product)
    } catch (err) {
      setAsinError(err.message)
    } finally {
      setAsinLookupLoading(false)
    }
  }

  const handleConfirmProduct = () => {
    if (!asinProduct) return
    // Use the actual product image for img2img generation
    if (asinProduct.image_url) setReferenceImageUrl(asinProduct.image_url)
    // Auto-fill product description from title
    const desc = asinProduct.brand
      ? `${asinProduct.brand} ${asinProduct.title}`.slice(0, 120)
      : asinProduct.title.slice(0, 120)
    setProductDesc(desc)
    // Auto-detect category from product data (backend result + client-side fallback)
    const autoCategory = detectCategoryFromProduct(asinProduct)
    if (autoCategory) {
      setProductCategory(autoCategory)
      setCategoryFilter('Recommended')
    }
  }

  const handleRejectProduct = () => {
    setAsinProduct(null)
    setAsinError(null)
    setAsinValue('')
    setReferenceImageUrl(null)
  }

  // Handle file upload
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      // Show local preview immediately
      const reader = new FileReader()
      reader.onload = (ev) => {
        setUploadedImage({ file, preview: ev.target.result, name: file.name })
      }
      reader.readAsDataURL(file)

      // Upload to backend so we get a real URL for img2img
      setUploadingImage(true)
      setReferenceImageUrl(null)
      uploadReferenceImage(file)
        .then(url => { setReferenceImageUrl(url) })
        .catch(err => { setError(`Image upload failed: ${err.message}`) })
        .finally(() => { setUploadingImage(false) })
    }
  }, [])

  // Toggle template selection (limited by quantity)
  const toggleTemplate = (templateId) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        // Always allow deselection
        return prev.filter(id => id !== templateId)
      } else {
        // Only allow selection if under the quantity limit
        if (prev.length >= quantity) {
          return prev // Don't add more if at limit
        }
        return [...prev, templateId]
      }
    })
  }

  // Research-recommended templates for the selected product category
  const recommendedTemplateIds = getRecommendedTemplates(productCategory)
  const categoryInsight = getCategoryInsight(productCategory)
  const ctrDifferentiator = getCtrDifferentiator(productCategory)

  // Filter templates — 'Recommended' shows only research-picked templates for the active category
  const filteredTemplates = (() => {
    if (categoryFilter === 'Recommended') {
      return TEMPLATES.filter(t => recommendedTemplateIds.includes(t.id))
    }
    if (categoryFilter === 'All') return TEMPLATES
    return TEMPLATES.filter(t => t.category === categoryFilter)
  })()

  // Toggle image selection for batch operations
  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  // Select/deselect all images
  const toggleSelectAll = () => {
    if (selectedImages.length === generatedImages.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(generatedImages.map(img => img.id))
    }
  }

  // Download single image
  const downloadImage = async (img) => {
    try {
      const response = await fetch(img.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${img.template.replace(/\s+/g, '-').toLowerCase()}-${img.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  // Download selected images
  const downloadSelected = async () => {
    const imagesToDownload = generatedImages.filter(img => selectedImages.includes(img.id))
    for (const img of imagesToDownload) {
      await downloadImage(img)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between downloads
    }
  }

  // Generate images
  const handleGenerate = async () => {
    if (selectedTemplates.length === 0) {
      setError('Please select at least one template')
      return
    }

    if (inputMode === 'asin' && !isValidASIN(asinValue)) {
      setError('Please enter a valid ASIN (10 alphanumeric characters)')
      return
    }

    if (inputMode === 'upload' && !uploadedImage) {
      setError('Please upload an image')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImages([])
    setSelectedImages([])

    try {
      const results = []
      const totalImages = selectedTemplates.length

      for (let i = 0; i < totalImages; i++) {
        const templateId = selectedTemplates[i]
        const template = TEMPLATES.find(t => t.id === templateId)

        setProgress({
          current: i + 1,
          total: totalImages,
          percentage: Math.round(((i + 1) / totalImages) * 100),
          message: `Generating ${template.name}...`,
          template: template.name
        })

        let result
        if (inputMode === 'asin' && asinValue) {
          // AI-powered hero generation: Gemini builds 16 professional prompts → Imagen 4 generates the image
          result = await generateHeroImage({
            asin: asinValue,
            marketplace,
            templateName: template.name,
            aspectRatio,
            promptVariation: 0,
          }, (p) => {
            setProgress(prev => ({ ...prev, ...p }))
          })
        } else {
          // Manual prompt or upload mode — use existing flow
          const prompt = buildImagePrompt(
            template.name,
            productCategory,
            imageStrategy,
            productDesc
          )
          const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio)
          const modelOption = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]
          result = await generateImage(prompt, {
            provider: modelOption.provider,
            model: modelOption.model,
            width: selectedRatio?.width || 2000,
            height: selectedRatio?.height || 2000,
            aspectRatio: aspectRatio,
            referenceImageUrl: referenceImageUrl || undefined,
          }, (p) => {
            setProgress(prev => ({ ...prev, ...p }))
          })
        }

        const newImage = {
          id: Date.now() + i,
          imageId: result.imageId,
          url: result.url,
          prompt: result.activePrompt || result.prompt || `${template.name} — ${asinValue || productDesc}`,
          template: template.name,
          templateId: template.id,
          model: result.model,
          provider: result.provider,
          aspectRatio,
          strategy: imageStrategy,
          category: productCategory,
          timestamp: new Date().toISOString(),
          // Hero: AI-generated prompt variations (ASIN mode only)
          heroPrompts: result.imagePrompts || [],
          allPromptsText: result.allPrompts || '',
          isHeroGenerated: !!(result.imagePrompts && result.imagePrompts.length > 0),
          asin: inputMode === 'asin' ? asinValue : null,
          marketplace: inputMode === 'asin' ? marketplace : null,
        }

        results.push(newImage)

        // Update results in real-time so user can see progress
        setGeneratedImages([...results])
      }

      setGeneratedImages(results)
    } catch (err) {
      setError(err.message || 'Failed to generate images')
    } finally {
      setIsGenerating(false)
      setProgress(null)
    }
  }

  // Lightbox state
  const [lightboxImg, setLightboxImg] = useState(null)  // null = closed
  const [zoomLevel, setZoomLevel] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef(null)
  const [saveStatus, setSaveStatus] = useState({})      // { [imageId]: 'saving'|'saved'|'error' }
  const [showEditorMenu, setShowEditorMenu] = useState(false)
  const [regeneratingIds, setRegeneratingIds] = useState(new Set())
  const [previousImages, setPreviousImages] = useState({}) // newImg.id → oldImg

  const EDITORS = [
    { id: 'photopea', name: 'Photopea', desc: 'Free Photoshop alternative', url: 'https://www.photopea.com' },
    { id: 'canva',    name: 'Canva',    desc: 'Easy online design tool',    url: 'https://www.canva.com/photo-editor/' },
    { id: 'adobe',    name: 'Adobe Express', desc: 'Quick photo editing',   url: 'https://express.adobe.com' },
  ]

  const handleOpenLightbox = (img) => {
    setLightboxImg(img)
    setShowEditorMenu(false)
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
  }

  const handleCloseLightbox = () => {
    setLightboxImg(null)
    setShowEditorMenu(false)
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
  }

  const handleZoomIn = (e) => { e.stopPropagation(); setZoomLevel(v => Math.min(v + 0.25, 3)) }
  const handleZoomOut = (e) => { e.stopPropagation(); setZoomLevel(v => Math.max(v - 0.25, 0.5)) }
  const handleZoomReset = (e) => { e.stopPropagation(); setZoomLevel(1); setPan({ x: 0, y: 0 }) }

  const handleDragStart = (e) => {
    if (zoomLevel <= 1) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const handleDragMove = (e) => {
    if (!isDragging || !dragStart.current) return
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }
  const handleDragEnd = () => {
    setIsDragging(false)
    dragStart.current = null
  }

  const handleSaveToArchive = async (img) => {
    const id = img.id
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }))
    try {
      const { fetchAPI } = await import('../api/client')
      const res = await fetchAPI(`/api/images/${img.imageId || img.url?.split('/').pop()?.replace('.png','')}/archive`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }))
    } catch {
      // Image is always saved server-side on generation; treat as saved
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }))
    }
  }

  const handleDownloadLightbox = async (img) => {
    try {
      const response = await fetch(img.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${img.template?.replace(/\s+/g, '-').toLowerCase() || 'image'}-${img.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleEditInEditor = async (img, editorUrl) => {
    // Download the image first so the user has it ready to import
    await handleDownloadLightbox(img)
    // Open editor in new tab
    window.open(editorUrl, '_blank', 'noopener')
    setShowEditorMenu(false)
  }

  const handleRegenerateImage = async (img) => {
    setRegeneratingIds(prev => new Set(prev).add(img.id))
    try {
      const prompt = buildImagePrompt(img.template, img.category, img.strategy, productDesc)
      const selectedRatio = ASPECT_RATIOS.find(r => r.id === img.aspectRatio) || ASPECT_RATIOS[0]
      // Use the original image's model so the regeneration is consistent
      const modelOption = AI_MODELS.find(m => m.model === img.model) || AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]
      const result = await generateImage(prompt, {
        provider: modelOption.provider,
        model: modelOption.model,
        width: selectedRatio.width,
        height: selectedRatio.height,
        aspectRatio: img.aspectRatio,
        referenceImageUrl: referenceImageUrl || undefined,
      })
      const newImg = {
        ...img,
        id: Date.now(),
        url: result.url,
        provider: result.provider,
        model: result.model,
        timestamp: new Date().toISOString(),
      }
      // Save old image so user can undo
      setPreviousImages(prev => ({ ...prev, [newImg.id]: img }))
      setGeneratedImages(prev => prev.map(i => i.id === img.id ? newImg : i))
      setLightboxImg(prev => prev?.id === img.id ? newImg : prev)
    } catch (err) {
      console.error('Regeneration failed:', err)
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev)
        next.delete(img.id)
        return next
      })
    }
  }

  const handleUndoRegenerate = (img) => {
    const oldImg = previousImages[img.id]
    if (!oldImg) return
    setGeneratedImages(prev => prev.map(i => i.id === img.id ? oldImg : i))
    setLightboxImg(prev => prev?.id === img.id ? oldImg : prev)
    setPreviousImages(prev => {
      const next = { ...prev }
      delete next[img.id]
      return next
    })
  }

  const asinInputRef = useRef(null)

  const handleTryAnotherProduct = () => {
    // Reset everything for a fresh generation batch
    setAsinValue('')
    setAsinProduct(null)
    setAsinError(null)
    setReferenceImageUrl(null)
    setProductDesc('')
    setGeneratedImages([])
    setSelectedImages([])
    setSelectedTemplates([])
    setError(null)
    setProgress(null)
    // Focus ASIN input so user can type immediately
    setTimeout(() => asinInputRef.current?.focus(), 50)
  }

  const canGenerate = (inputMode === 'asin' ? isValidASIN(asinValue) : !!uploadedImage) &&
    selectedTemplates.length > 0 && !isGenerating && !uploadingImage

  return (
    <div className="main-image-generator">
      <header className="page-header">
        <div>
          <h1>Main Image Generator</h1>
          <p>Generate professional Amazon product images with AI</p>
        </div>
      </header>

      <div className="generator-layout">
        {/* Left Panel - Input & Configuration */}
        <div className="generator-sidebar">
          {/* Input Mode Tabs */}
          <div className="input-section">
            <div className="input-tabs">
              <button
                className={`input-tab ${inputMode === 'asin' ? 'active' : ''}`}
                onClick={() => setInputMode('asin')}
              >
                <Search size={18} />
                By ASIN
              </button>
              <button
                className={`input-tab ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={() => setInputMode('upload')}
              >
                <Upload size={18} />
                Upload Image
              </button>
            </div>

            {inputMode === 'asin' ? (
              <div className="asin-input-wrapper">
                <div className="asin-search-row">
                  <div className="asin-input">
                    <input
                      ref={asinInputRef}
                      type="text"
                      placeholder="Enter ASIN (e.g., B08N5WRWNW)"
                      value={asinValue}
                      onChange={(e) => {
                        setAsinValue(e.target.value.toUpperCase())
                        setAsinProduct(null)
                        setAsinError(null)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleAsinSearch()}
                      maxLength={10}
                      className={asinValue && !isValidASIN(asinValue) ? 'invalid' : ''}
                    />
                  </div>
                  <button
                    className="btn btn-secondary asin-search-btn"
                    onClick={handleAsinSearch}
                    disabled={!isValidASIN(asinValue) || asinLookupLoading}
                  >
                    {asinLookupLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                    {asinLookupLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* ASIN lookup error */}
                {asinError && (
                  <div className="asin-lookup-error">
                    <X size={14} /> {asinError}
                  </div>
                )}

                {/* Product confirmation card */}
                {asinProduct && (
                  <div className="asin-product-card">
                    <div className="asin-product-header">
                      <span className="asin-product-label">Is this your product?</span>
                    </div>
                    <div className="asin-product-body">
                      {asinProduct.image_url && (
                        <img
                          src={asinProduct.image_url}
                          alt={asinProduct.title}
                          className="asin-product-img"
                        />
                      )}
                      <div className="asin-product-info">
                        {asinProduct.brand && (
                          <span className="asin-product-brand">{asinProduct.brand}</span>
                        )}
                        <p className="asin-product-title">{asinProduct.title}</p>
                        {asinProduct.bullets?.length > 0 && (
                          <ul className="asin-product-bullets">
                            {asinProduct.bullets.slice(0, 2).map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="asin-product-actions">
                      {referenceImageUrl ? (
                        <div className="asin-confirmed-badge">
                          <Check size={13} /> Product locked in — AI will edit this exact image
                          <button className="asin-change-btn" onClick={handleRejectProduct}>Change</button>
                        </div>
                      ) : (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={handleConfirmProduct}>
                            <Check size={14} /> Yes, use this product
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={handleRejectProduct}>
                            <X size={14} /> Wrong product
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploadedImage ? 'has-image' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleDrop}
                  style={{ display: 'none' }}
                />
                {uploadedImage ? (
                  <div className="uploaded-preview">
                    <img src={uploadedImage.preview} alt="Uploaded" />
                    <span>{uploadedImage.name}</span>
                    {uploadingImage ? (
                      <span className="upload-status"><Loader2 size={14} className="spin" /> Uploading…</span>
                    ) : referenceImageUrl ? (
                      <span className="upload-status upload-ready"><Check size={14} /> Ready</span>
                    ) : null}
                    <button
                      className="remove-upload"
                      onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setReferenceImageUrl(null) }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} />
                    <p>Drag & drop or click to upload</p>
                    <span>JPG, PNG, WebP (Max 10MB)</span>
                  </>
                )}
              </div>
            )}

            {/* Product Description — below ASIN/upload input */}
            <div className="product-desc-group">
              <label>
                Product Description
                <span className="label-optional"> (optional)</span>
              </label>
              <input
                type="text"
                className="config-input"
                placeholder="e.g. stainless steel water bottle, matte black, 32oz"
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                maxLength={120}
              />
              <p className="config-hint">This is what the AI uses to know your product — be specific about material, color, and size</p>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="config-section">
            <h3><Sliders size={18} /> Configuration</h3>

            {/* Image Strategy Toggle */}
            <div className="config-group">
              <label>Image Strategy</label>
              <div className="strategy-toggle">
                {IMAGE_STRATEGIES.map((s) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.id}
                      className={`strategy-btn ${imageStrategy === s.id ? 'active' : ''}`}
                      onClick={() => setImageStrategy(s.id)}
                      title={s.description}
                    >
                      <Icon size={15} />
                      <span>{s.name}</span>
                    </button>
                  )
                })}
              </div>
              <p className="strategy-hint">
                {IMAGE_STRATEGIES.find(s => s.id === imageStrategy)?.description}
              </p>
            </div>

            {/* Product Category */}
            <div className="config-group">
              <label>Product Category</label>
              <select
                className="category-dropdown"
                value={productCategory}
                onChange={(e) => {
                  const cat = e.target.value
                  setProductCategory(cat)
                  // Auto-switch template filter to Recommended when a category is picked
                  if (cat) {
                    setCategoryFilter('Recommended')
                  } else {
                    setCategoryFilter('All')
                  }
                }}
              >
                <option value="">-- Select Category --</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Research insight for selected category */}
              {productCategory && categoryInsight && (
                <div className={`category-insight ${imageStrategy === 'high-ctr' ? 'high-ctr' : ''}`}>
                  <Lightbulb size={13} />
                  <span>
                    {imageStrategy === 'high-ctr' && ctrDifferentiator
                      ? ctrDifferentiator
                      : categoryInsight}
                  </span>
                </div>
              )}
            </div>

            {/* Quantity Control */}
            <div className="config-group batch-controls">
              <label className="batch-label">
                <span>Number of Images</span>
                <span className="batch-total">{quantity}</span>
              </label>

              <input
                type="range"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => {
                  const newQty = Number(e.target.value)
                  setQuantity(newQty)
                  // Trim selected templates if over new limit
                  if (selectedTemplates.length > newQty) {
                    setSelectedTemplates(prev => prev.slice(0, newQty))
                  }
                }}
              />

              <p className="batch-hint">
                {selectedTemplates.length} of {quantity} templates selected
                {selectedTemplates.length < quantity && (
                  <span className="hint-warning"> — select {quantity - selectedTemplates.length} more</span>
                )}
              </p>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="config-group">
              <label>Aspect Ratio</label>
              <select
                className="config-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                {ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio.id} value={ratio.id}>
                    {ratio.icon} {ratio.id} {ratio.name} — {ratio.description}{ratio.recommended ? ' ★' : ''}
                  </option>
                ))}
              </select>
              <p className="config-hint">Min 1,000px • Recommended 2,000px+ for zoom</p>
            </div>

            {/* AI Model Selector */}
            <div className="config-group">
              <label>AI Model</label>
              <select
                className="config-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} — {model.description} {model.badge ? `(${model.badge})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Marketplace Selector */}
            <div className="config-group">
              <label>Marketplace</label>
              <select
                className="config-select"
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
              >
                {MARKETPLACES.map((mp) => (
                  <option key={mp.code} value={mp.code}>
                    {mp.flag} {mp.name} ({mp.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center Panel - Templates */}
        <div className="templates-section">
          <div className="templates-header">
            <h3>
              <Package size={18} />
              Select Templates
              <span className="template-count">{selectedTemplates.length} selected</span>
            </h3>
            <div className="category-filters">
              {/* Recommended tab — only shown when a product category is selected */}
              {productCategory && recommendedTemplateIds.length > 0 && (
                <button
                  className={`category-btn category-btn-recommended ${categoryFilter === 'Recommended' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('Recommended')}
                >
                  ⚡ Recommended
                </button>
              )}
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Research tip — shown on non-Recommended filters to guide users */}
          {productCategory && recommendedTemplateIds.length > 0 && categoryFilter !== 'Recommended' && (
            <div className="templates-research-tip">
              <Zap size={13} />
              <span>
                <strong>{productCategory}:</strong> ⚡ badges mark research-recommended templates.{' '}
                <button
                  className="tip-switch-btn"
                  onClick={() => setCategoryFilter('Recommended')}
                >
                  Show only recommended
                </button>
              </span>
            </div>
          )}

          <div className="templates-grid">
            {filteredTemplates.map((template) => {
              const isRecommended = productCategory && recommendedTemplateIds.includes(template.id)
              return (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplates.includes(template.id) ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
                  onClick={() => toggleTemplate(template.id)}
                >
                  {isRecommended && (
                    <div className="template-recommended-badge">
                      <Zap size={10} />
                    </div>
                  )}
                  <div className="template-thumbnail">{template.thumbnail}</div>
                  <span className="template-name">{template.name}</span>
                  <div className="template-check">
                    {selectedTemplates.includes(template.id) && <Check size={16} />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Generate Button */}
          <div className="generate-action">
            {error && <div className="error-message">{error}</div>}
            <button
              className="btn btn-primary btn-large"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="spin" />
                  Generating {progress?.current}/{progress?.total}...
                </>
              ) : (
                <>
                  <Image size={20} />
                  Generate {selectedTemplates.length} Image{selectedTemplates.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="results-section">
          <div className="results-header">
            <h3>
              Generated Images
              {generatedImages.length > 0 && (
                <span className="results-count">({generatedImages.length})</span>
              )}
            </h3>
            {generatedImages.length > 0 && (
              <div className="results-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleTryAnotherProduct}
                  title="Clear results and try a new ASIN"
                >
                  <RefreshCw size={15} />
                  Try Another
                </button>
                <button
                  className={`btn btn-sm ${selectedImages.length === generatedImages.length ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={toggleSelectAll}
                >
                  <Check size={16} />
                  {selectedImages.length === generatedImages.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={downloadSelected}
                  disabled={selectedImages.length === 0}
                >
                  <Download size={16} />
                  Download {selectedImages.length > 0 ? `(${selectedImages.length})` : 'Selected'}
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isGenerating && progress && (
            <div className="generation-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress.percentage || 0}%` }}
                />
              </div>
              <div className="progress-info">
                <span className="progress-text">{progress.message}</span>
                <span className="progress-count">{progress.current} / {progress.total}</span>
              </div>
            </div>
          )}

          {generatedImages.length === 0 && !isGenerating ? (
            <div className="results-empty">
              <Image size={48} />
              <p>Your generated images will appear here</p>
              <span>Select templates and click Generate to start</span>
            </div>
          ) : (
            <div className="results-grid">
              {generatedImages.map((img) => (
                <div
                  key={img.id}
                  className={`result-card ${selectedImages.includes(img.id) ? 'selected' : ''}`}
                  onClick={() => toggleImageSelection(img.id)}
                >
                  <div className="result-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(img.id)}
                      onChange={() => toggleImageSelection(img.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <img
                    src={img.url}
                    alt={img.template}
                    style={{ cursor: 'zoom-in' }}
                    onClick={(e) => { e.stopPropagation(); handleOpenLightbox(img) }}
                  />
                  <EvalScoreBadge imageUrl={img.url} prompt={img.prompt} contentType="listing_main" />
                  <div className="result-info">
                    <span className="result-template">{img.template}</span>
                    <div className="result-meta">
                      <span className="result-model">{img.provider}</span>
                      {img.strategy === 'high-ctr' && (
                        <span className="result-strategy-badge">
                          <MousePointerClick size={10} /> High-CTR
                        </span>
                      )}
                      {img.isHeroGenerated && (
                        <span className="result-strategy-badge result-strategy-badge--prompts">
                          <FileText size={10} /> {img.heroPrompts.length} prompts
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="result-actions">
                    <button
                      className="action-btn"
                      title="Open"
                      onClick={(e) => { e.stopPropagation(); handleOpenLightbox(img) }}
                    >
                      <Maximize2 size={16} />
                    </button>
                    {img.isHeroGenerated && (
                      <button
                        className="action-btn action-btn-prompts"
                        title="View all 16 prompt variations"
                        onClick={(e) => handleViewPrompts(img, e)}
                      >
                        <FileText size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn"
                      title="Regenerate"
                      disabled={regeneratingIds.has(img.id)}
                      onClick={(e) => { e.stopPropagation(); handleRegenerateImage(img) }}
                    >
                      {regeneratingIds.has(img.id) ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                    </button>
                    {previousImages[img.id] && (
                      <button
                        className="action-btn action-btn-undo"
                        title="Restore previous version"
                        onClick={(e) => { e.stopPropagation(); handleUndoRegenerate(img) }}
                      >
                        <Undo2 size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn"
                      title="Download"
                      onClick={(e) => { e.stopPropagation(); downloadImage(img) }}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className={`action-btn ${saveStatus[img.id] === 'saved' ? 'saved' : ''}`}
                      title="Save to archive"
                      onClick={(e) => { e.stopPropagation(); handleSaveToArchive(img) }}
                    >
                      {saveStatus[img.id] === 'saved' ? <BookmarkCheck size={16} /> : <Save size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Hero Prompts Modal ── */}
      {promptsModal && (
        <div className="lightbox-overlay" onClick={() => setPromptsModal(null)}>
          <div className="prompts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prompts-modal-header">
              <div className="prompts-modal-title">
                <FileText size={18} />
                <span>16 Professional Image Prompts</span>
                <span className="prompts-modal-sub">AI-generated · Click any variation to generate that image</span>
              </div>
              <button className="lightbox-close" onClick={() => setPromptsModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="prompts-modal-body">
              {/* Group prompts into 4 images × 4 variations */}
              {[0, 1, 2, 3].map((imgIdx) => {
                const imageLabels = ['Pure Product Shot', 'Product + Packaging', 'Product with Tag', 'Creative High-CTR']
                const imageRoles = [
                  'Ultra-safe main image. Product only, pure white background, zero text.',
                  'Prove value, gift-ready. Primary keyword on box or tag.',
                  'Primary keyword impossible to miss via clean tag.',
                  'High-reward variant with one dramatic creative element.',
                ]
                return (
                  <div key={imgIdx} className="prompts-image-group">
                    <div className="prompts-image-label">
                      <span className="prompts-image-num">Image {imgIdx + 1}</span>
                      <span className="prompts-image-name">{imageLabels[imgIdx]}</span>
                      <span className="prompts-image-role">{imageRoles[imgIdx]}</span>
                    </div>
                    <div className="prompts-variations">
                      {[0, 1, 2, 3].map((varIdx) => {
                        const globalIdx = imgIdx * 4 + varIdx
                        const prompt = promptsModal.prompts[globalIdx]
                        const varLabels = ['Variation 1', 'Variation 2', 'Variation 3', 'Variation 4 (Minimal)']
                        if (!prompt) return null
                        return (
                          <div key={varIdx} className="prompts-variation-card">
                            <div className="prompts-variation-header">
                              <span className="prompts-var-label">{varLabels[varIdx]}</span>
                              <button
                                className="prompts-generate-btn"
                                onClick={() => handleGenerateVariation(globalIdx)}
                                disabled={variationGenerating !== null}
                              >
                                {variationGenerating === globalIdx
                                  ? <><Loader2 size={13} className="spin" /> Generating...</>
                                  : <><RefreshCw size={13} /> Generate this</>}
                              </button>
                            </div>
                            <p className="prompts-variation-text">{prompt}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox Modal ── */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button className="lightbox-close" onClick={handleCloseLightbox}>
              <X size={20} />
            </button>

            {/* Image */}
            <div
              className="lightbox-image-wrap"
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <img
                src={lightboxImg.url}
                alt={lightboxImg.template}
                draggable={false}
                style={{
                  transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  userSelect: 'none',
                }}
              />
              {/* Zoom controls — lower right */}
              <div className="lightbox-zoom-controls">
                <button className="lightbox-zoom-btn" onClick={handleZoomOut} title="Zoom out" disabled={zoomLevel <= 0.5}>
                  <ZoomOut size={15} />
                </button>
                <span className="lightbox-zoom-level" onClick={handleZoomReset} title="Reset zoom">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button className="lightbox-zoom-btn" onClick={handleZoomIn} title="Zoom in" disabled={zoomLevel >= 3}>
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>

            {/* Info strip */}
            <div className="lightbox-info">
              <span className="lightbox-template">{lightboxImg.template}</span>
              <span className="lightbox-meta">{lightboxImg.provider} · {lightboxImg.aspectRatio}</span>
            </div>

            {/* Eval score */}
            <EvalScoreBadge imageUrl={lightboxImg.url} prompt={lightboxImg.prompt} contentType="listing_main" defaultExpanded />

            {/* Action bar */}
            <div className="lightbox-actions">

              {/* Save */}
              <button
                className={`lightbox-btn ${saveStatus[lightboxImg.id] === 'saved' ? 'lightbox-btn-saved' : 'lightbox-btn-save'}`}
                onClick={() => handleSaveToArchive(lightboxImg)}
                disabled={saveStatus[lightboxImg.id] === 'saving'}
              >
                {saveStatus[lightboxImg.id] === 'saving' ? (
                  <><Loader2 size={17} className="spin" /> Saving...</>
                ) : saveStatus[lightboxImg.id] === 'saved' ? (
                  <><BookmarkCheck size={17} /> Saved to Archive</>
                ) : (
                  <><Save size={17} /> Save to Archive</>
                )}
              </button>

              {/* Download */}
              <button
                className="lightbox-btn lightbox-btn-download"
                onClick={() => handleDownloadLightbox(lightboxImg)}
              >
                <Download size={17} /> Download
              </button>

              {/* Regenerate */}
              <button
                className="lightbox-btn lightbox-btn-regen"
                onClick={() => handleRegenerateImage(lightboxImg)}
                disabled={regeneratingIds.has(lightboxImg.id)}
              >
                {regeneratingIds.has(lightboxImg.id)
                  ? <><Loader2 size={17} className="spin" /> Regenerating...</>
                  : <><RefreshCw size={17} /> Regenerate</>}
              </button>

              {/* Undo regenerate */}
              {previousImages[lightboxImg.id] && (
                <button
                  className="lightbox-btn lightbox-btn-undo"
                  onClick={() => handleUndoRegenerate(lightboxImg)}
                >
                  <Undo2 size={17} /> Previous Version
                </button>
              )}

              {/* Edit — with editor picker */}
              <div className="lightbox-edit-wrap">
                <button
                  className="lightbox-btn lightbox-btn-edit"
                  onClick={() => setShowEditorMenu(v => !v)}
                >
                  <Pencil size={17} /> Edit <span className="lightbox-edit-arrow">▾</span>
                </button>
                {showEditorMenu && (
                  <div className="lightbox-editor-menu">
                    <p className="editor-menu-hint">Image will be downloaded — then import it in the editor</p>
                    {EDITORS.map(ed => (
                      <button
                        key={ed.id}
                        className="editor-menu-item"
                        onClick={() => handleEditInEditor(lightboxImg, ed.url)}
                      >
                        <span className="editor-menu-name">
                          {ed.name} <ExternalLink size={11} />
                        </span>
                        <span className="editor-menu-desc">{ed.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default MainImageGenerator
