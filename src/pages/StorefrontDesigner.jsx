import { useState, useCallback, useRef } from 'react'
import { PRODUCT_CATEGORIES } from '../constants/productCategories'
import { generateImage } from '../api/imageGen'
import { lookupASIN } from '../api/asin'
import { generateModuleContent as generateModuleContentAPI } from '../api/content'
import EvalScoreBadge from '../components/EvalScoreBadge'
import { useDrafts } from '../hooks/useDrafts'
import {
  Upload,
  Search,
  Image,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  Download,
  Save,
  Sparkles,
  Wand2,
  RefreshCw,
  FileText,
  Film,
  Type,
  ShoppingBag,
  Grid3X3,
  Layers,
  Star,
  Tag,
  MousePointer,
  Layout,
  Monitor,
  Smartphone,
  PlusCircle,
  Copy,
  Settings
} from 'lucide-react'

// ─── Widget/Tile Definitions ───
const STORE_WIDGETS = [
  {
    id: 'hero-header',
    name: 'Header / Hero Image',
    description: 'Full-width hero banner at the top of the page',
    dimensions: '3000 x 600 px',
    width: 3000,
    height: 600,
    category: 'header',
    preview: '🖼️',
    maxPerPage: 1,
    note: 'Safe zone: center 70%'
  },
  {
    id: 'brand-logo',
    name: 'Brand Logo',
    description: 'Brand logo displayed in header area',
    dimensions: '400 x 400 px',
    width: 400,
    height: 400,
    category: 'header',
    preview: '🏷️',
    maxPerPage: 1
  },
  {
    id: 'image-full',
    name: 'Image — Full Width',
    description: 'Full-width image banner',
    dimensions: '3000 x 600 px',
    width: 3000,
    height: 600,
    category: 'image',
    preview: '🌅'
  },
  {
    id: 'image-large',
    name: 'Image — Large',
    description: 'Large square image tile',
    dimensions: '1500 x 1500 px',
    width: 1500,
    height: 1500,
    category: 'image',
    preview: '🔲',
    note: '2:2 aspect ratio'
  },
  {
    id: 'image-medium',
    name: 'Image — Medium',
    description: 'Medium rectangular image tile',
    dimensions: '1500 x 750 px',
    width: 1500,
    height: 750,
    category: 'image',
    preview: '▬',
    note: '2:1 aspect ratio'
  },
  {
    id: 'image-small',
    name: 'Image — Small',
    description: 'Small square image tile',
    dimensions: '750 x 750 px',
    width: 750,
    height: 750,
    category: 'image',
    preview: '◻️',
    note: '1:1 aspect ratio'
  },
  {
    id: 'image-text',
    name: 'Image with Text',
    description: 'Image tile with headline and body text overlay',
    dimensions: '1500 x 750 px',
    width: 1500,
    height: 750,
    hasText: true,
    textFields: ['headline', 'body'],
    headlineLimit: 50,
    bodyLimit: 200,
    category: 'image',
    preview: '📰'
  },
  {
    id: 'shoppable-image',
    name: 'Shoppable Image',
    description: 'Image with up to 6 clickable product tags',
    dimensions: '3000 x 1500 px',
    width: 3000,
    height: 1500,
    hasText: false,
    category: 'interactive',
    preview: '🛒',
    isShoppable: true,
    maxTags: 6
  },
  {
    id: 'text-tile',
    name: 'Text',
    description: 'Text-only content block (max 20 lines)',
    dimensions: 'Text only',
    width: 0,
    height: 0,
    hasText: true,
    textOnly: true,
    textFields: ['headline', 'body'],
    headlineLimit: 100,
    bodyLimit: 1000,
    category: 'text',
    preview: '📝'
  },
  {
    id: 'video-tile',
    name: 'Video',
    description: 'Embedded video with cover image',
    dimensions: '1920 x 1080 px',
    width: 1920,
    height: 1080,
    hasText: true,
    textFields: ['headline'],
    headlineLimit: 100,
    category: 'media',
    preview: '🎬',
    isVideo: true,
    note: '<100MB, cover image required'
  },
  {
    id: 'bg-video',
    name: 'Background Video',
    description: 'Auto-playing looping background video (silent)',
    dimensions: '1280 x 640 px min',
    width: 1280,
    height: 640,
    category: 'media',
    preview: '🎥',
    isVideo: true,
    isBgVideo: true,
    maxPerPage: 4,
    note: '2-20 seconds, auto-loop, silent'
  },
  {
    id: 'gallery',
    name: 'Gallery',
    description: 'Image carousel with 3-8 images',
    dimensions: '1500 x 750 px per image',
    width: 1500,
    height: 750,
    imageCount: 8,
    minImages: 3,
    category: 'gallery',
    preview: '🎞️',
    maxPerPage: 1,
    isGallery: true
  },
  {
    id: 'product-grid',
    name: 'Product Grid',
    description: 'Grid of 4+ products with details',
    dimensions: 'Auto layout',
    width: 0,
    height: 0,
    hasText: false,
    category: 'product',
    preview: '🔳',
    isProductGrid: true,
    maxPerPage: 1,
    note: 'Standard or tall layout'
  }
]

const WIDGET_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'header', name: 'Header' },
  { id: 'image', name: 'Images' },
  { id: 'text', name: 'Text' },
  { id: 'media', name: 'Video' },
  { id: 'interactive', name: 'Interactive' },
  { id: 'gallery', name: 'Gallery' },
  { id: 'product', name: 'Products' }
]

const PAGE_TEMPLATES = [
  { id: 'blank', name: 'Blank', description: 'Start from scratch', icon: '📄' },
  { id: 'marquee', name: 'Marquee', description: 'Organized subcategories layout', icon: '🏪' },
  { id: 'product-highlight', name: 'Product Highlight', description: 'Promote bestsellers or new launches', icon: '⭐' },
  { id: 'product-collection', name: 'Product Collection', description: 'Showcase related product groups', icon: '📦' }
]

const STORE_GUIDELINES = [
  { icon: '✓', text: 'Use high-resolution images (min 72 DPI, recommended 300 PPI)' },
  { icon: '✓', text: 'Keep hero image safe zone in center 70% (15% cropped each side)' },
  { icon: '✓', text: 'Use consistent brand colors, fonts, and imagery' },
  { icon: '✓', text: 'Organize pages by category, product type, or use case' },
  { icon: '✓', text: 'Include a clear navigation hierarchy (3 subpages max)' },
  { icon: '✓', text: 'Add meta descriptions for SEO visibility' },
  { icon: '✓', text: 'Use 3-8 images per gallery widget' },
  { icon: '✓', text: 'Keep background videos 2-20 seconds, auto-loop, silent' },
  { icon: '✓', text: 'Use shoppable images to drive product discovery (up to 6 tags)' },
  { icon: '✗', text: 'No embedded text in images (accessibility issue)' },
  { icon: '✗', text: 'No random capitalization or all-caps text' },
  { icon: '✗', text: 'No pricing or time-sensitive promotional claims' },
  { icon: '✗', text: 'No external links or contact information' },
  { icon: '✗', text: 'No competitor references or comparisons' },
  { icon: '✗', text: 'No more than 20 sections per page' },
  { icon: '✗', text: 'Max 4 background videos, 1 gallery, 1 product grid per page' }
]

// Mock Campaign Data
const CREATIVE_CAMPAIGN_DATA = {
  productName: 'Premium Wireless Headphones',
  brandName: 'AudioPro',
  brandStory: 'Founded in 2018 by audio engineers passionate about perfect sound',
  brandMission: 'Making premium audio accessible to everyone',
  targetAudience: 'Tech-savvy professionals aged 25-45',
  keyBenefits: ['Active noise cancellation', '40-hour battery life', 'Premium comfort memory foam', 'Crystal clear audio quality'],
  topProducts: ['Pro X1 Over-Ear', 'Sport Buds Elite', 'Studio Monitor Pro', 'Travel Companion'],
  emotionalTriggers: ['Focus and productivity', 'Premium quality and status', 'Comfort and relaxation'],
  toneOfVoice: 'Professional, confident, premium',
  keywords: ['wireless', 'noise-cancelling', 'premium', 'comfort', 'professional']
}

const generateWidgetPrompt = (widgetType, campaignData = CREATIVE_CAMPAIGN_DATA) => {
  const b     = campaignData.brandName    || 'the brand'
  const p     = campaignData.productName  || 'the product'
  const aud   = campaignData.targetAudience || 'Amazon shoppers'
  const tone  = campaignData.toneOfVoice  || 'professional, premium, aspirational'
  const story = campaignData.brandStory   || ''
  const mission = campaignData.brandMission || ''
  const ben   = campaignData.keyBenefits  || []
  const emo   = campaignData.emotionalTriggers || []
  const tops  = campaignData.topProducts  || []
  const COMPLIANCE = `No pricing text, no competitor brand names, no unverified claims. Photorealistic commercial photography — not illustration, not flat design.`

  const prompts = {
    'hero-header': `Amazon Storefront hero banner for ${b}. Full-width cinematic landscape at 3000×600 px — safe zone: keep all critical content inside the center 70% (outer edges may be cropped). ${b} brand hero: aspirational lifestyle scene that captures the brand essence${story ? ` — "${story.slice(0, 80)}"` : ''}. Flagship products visible but supporting the brand story, not dominating. Brand color palette throughout. Cinematic lighting: soft directional key light from upper left, warm and inviting. Mood: ${emo[0] || 'aspirational and premium'}. Target: ${aud}. Tone: ${tone}. ${COMPLIANCE}`,

    'brand-logo': `UPLOAD ONLY — Do not AI-generate this module. Upload your official ${b} brand logo. AI image generators produce distorted text and unreliable brand marks. Requirements: PNG with transparent background, minimum 400×400 px square format, adequate padding around the mark. Export the logo from your design tool before returning here.`,

    'image-full': `Amazon Storefront full-width banner for ${b}. Wide landscape at 3000×600 px — safe zone: keep key content in center 70%. Premium brand lifestyle or category showcase: ${ben[0] || "the brand's primary promise"}. High production value photography, consistent with ${b} brand identity. Warm aspirational lighting. Target: ${aud}. ${COMPLIANCE}`,

    'image-large': `Amazon Storefront large square tile for ${b}. Square format at 1500×1500 px. Feature product ${p} or brand story element. Premium studio or lifestyle photography. Key benefit visualized: ${ben[1] || ben[0] || 'core product benefit'}. Clean composition, product or scene filling 80% of frame. Consistent brand color palette. ${COMPLIANCE}`,

    'image-medium': `Amazon Storefront medium landscape tile for ${b}. Landscape format at 1500×750 px. Highlight product category or key brand feature. Clean professional photography, on-brand. Key message: ${ben[2] || ben[0] || 'product benefit'}. Warm brand lighting, consistent with overall store aesthetic. ${COMPLIANCE}`,

    'image-small': `Amazon Storefront small square tile for ${b}. Square format at 750×750 px. Thumbnail-scale image: product, icon, or category visual. Simple, bold, immediately legible at small size. Clean neutral background, accurate color, crisp focus. Consistent with ${b} brand style. ${COMPLIANCE}`,

    'image-text': `Amazon Storefront image with text overlay zone for ${b}. Landscape format at 1500×750 px. The image background supports a headline and short body text overlay — leave a clean, relatively lighter area on the left 40% for text readability. Right side: ${p} in premium context or aspirational lifestyle. Key message: ${ben[0] || 'primary benefit'}. Professional readable contrast between text zone and image. ${COMPLIANCE}`,

    'shoppable-image': `Amazon Storefront shoppable lifestyle image for ${b}. Wide format at 3000×1500 px. Natural lifestyle scene featuring ${tops.length ? tops.slice(0, 4).join(', ') : 'multiple brand products'} placed naturally in context. Each featured product must be clearly visible and identifiable — not obscured. Scene: ${aud} lifestyle environment, warm natural or studio lighting. Products labeled with hotspot dots by Amazon's module editor — ensure each product has clear visual separation in the scene. Authentic, aspirational, not stock-photo generic. ${COMPLIANCE}`,

    'text-tile': `TEXT MODULE — No image to generate. Write Amazon Storefront text tile content for ${b}. Brand: ${b}. Tone: ${tone}. Key benefits: ${ben.join(', ')}. Target: ${aud}. Max 20 lines, concise and scannable — shoppers skim. Rules: no all-caps, no pricing, no competitor mentions, no promotional claims.`,

    'video-tile': `Amazon Storefront video cover image for ${b}. Wide format at 3000×1500 px — this is the static preview frame shown before the video plays. Cinematic single frame: ${b} flagship product or brand story scene with dramatic lighting and motion-suggesting composition. Brand tone: ${tone}. Emotional hook: ${emo[0] || 'compelling, must-watch energy'}. The thumbnail must make a viewer want to press play. ${COMPLIANCE}`,

    'bg-video': `Amazon Storefront ambient background video concept for ${b}. 2–20 second auto-loop, no sound — pure visual storytelling. Scene concept: ${p} in motion, brand lifestyle in action, or atmospheric brand elements. Cinematic, atmospheric, brand-defining. Minimum video resolution: 1280×640 px. Cover frame: premium still that works without motion. ${COMPLIANCE}`,

    'gallery': `Amazon Storefront image gallery for ${b}. ${tops.length ? tops.length : 4}–8 landscape images at 1500×750 px each. Consistent premium aesthetic, swipeable carousel feel. Theme: product showcase and brand story progression. ${tops.length ? tops.map((t, i) => `Image ${i + 1}: ${t}`).join('. ') + '.' : ''} Consistent warm studio or lifestyle lighting, ${b} brand color palette throughout all images. ${COMPLIANCE}`,

    'product-grid': `Amazon Storefront product grid layout for ${b}. Consistent clean product photography: pure white or very light neutral background, soft even studio lighting, accurate color, product centered. Products: ${tops.join(', ') || 'top brand products'}. Each product: fills 80% of its grid cell, crisp focus, real texture, no color distortion. Consistent treatment across all grid items — same background, same lighting quality. ${COMPLIANCE}`,
  }

  return prompts[widgetType] || `Create professional Amazon Storefront content for ${b}. Target: ${aud}. Tone: ${tone}. Style: premium, brand-consistent, Amazon-compliant. ${COMPLIANCE}`
}

const _TEMPLATE_WIDGETS = {
  'blank': [],
  'marquee': ['hero-header', 'text-tile', 'gallery', 'product-grid'],
  'product-highlight': ['hero-header', 'image-text', 'text-tile', 'product-grid'],
  'product-collection': ['hero-header', 'gallery', 'image-text', 'product-grid'],
}

function StorefrontDesigner() {
  // Page management
  const [pages, setPages] = useState([
    { id: 'home', name: 'Homepage', template: 'blank', widgets: [], isHome: true }
  ])
  const [activePage, setActivePage] = useState('home')
  const [editingPageName, setEditingPageName] = useState(null)

  // Widget state for active page
  const [widgetData, setWidgetData] = useState({})
  const [expandedWidget, setExpandedWidget] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [draggedIndex, setDraggedIndex] = useState(null)

  // ASIN for content generation
  const [asinValue, setAsinValue] = useState('')
  const [marketplace, setMarketplace] = useState('US')
  const isValidASIN = (asin) => /^[A-Z0-9]{10}$/i.test(asin)

  // Product lookup for AI prompt personalisation
  const [product, setProduct] = useState(null)
  const [asinLoading, setAsinLoading] = useState(false)
  const [asinError, setAsinError] = useState(null)

  const buildCampaignData = (p) => {
    const bullets = p?.bullets || []
    return {
      productName: p?.title || 'the product',
      brandName: p?.brand || 'the brand',
      brandStory: '',
      brandMission: '',
      targetAudience: 'Amazon shoppers',
      keyBenefits: bullets.slice(0, 5),
      topProducts: [],
      emotionalTriggers: ['confidence', 'trust', 'quality'],
      toneOfVoice: 'Professional, aspirational, brand-consistent',
      keywords: p?.category ? [p.category] : [],
    }
  }

  const handleAsinSearch = async () => {
    if (!isValidASIN(asinValue)) return
    setAsinLoading(true)
    setAsinError(null)
    setProduct(null)
    try {
      const data = await lookupASIN(asinValue, marketplace)
      setProduct(data)
    } catch (err) {
      setAsinError(err.message || 'Could not look up product')
    } finally {
      setAsinLoading(false)
    }
  }

  // UI state
  const [productCategory, setProductCategory] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'mobile'
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [generatingWidgets, setGeneratingWidgets] = useState({})
  const [widgetErrors, setWidgetErrors] = useState({})

  // Current page helper
  const currentPage = pages.find(p => p.id === activePage) || pages[0]
  const currentWidgets = currentPage.widgets || []

  // Limits
  const maxSections = 20
  const maxSubpages = 3
  const canAddWidget = currentWidgets.length < maxSections
  const canAddPage = pages.length < maxSubpages + 1 // +1 for homepage

  // Check per-page widget limits
  const getWidgetCount = (widgetId) => {
    return currentWidgets.filter(w => w.type === widgetId).length
  }

  const canAddWidgetType = (widget) => {
    if (!canAddWidget) return false
    if (widget.maxPerPage && getWidgetCount(widget.id) >= widget.maxPerPage) return false
    return true
  }

  // Filter widgets
  const filteredWidgets = categoryFilter === 'all'
    ? STORE_WIDGETS
    : STORE_WIDGETS.filter(w => w.category === categoryFilter)

  // ─── Page Management ───
  const addPage = (template = 'blank') => {
    if (!canAddPage) return
    const pageId = `page-${Date.now()}`
    const pageNum = pages.length
    const templateWidgets = (_TEMPLATE_WIDGETS[template] || []).map(widgetType => {
      const widgetDef = STORE_WIDGETS.find(w => w.id === widgetType)
      if (!widgetDef) return null
      return { instanceId: `${widgetType}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, type: widgetType, ...widgetDef }
    }).filter(Boolean)
    setPages(prev => [...prev, {
      id: pageId,
      name: `Page ${pageNum}`,
      template,
      widgets: templateWidgets,
    }])
    setActivePage(pageId)
    setShowTemplates(false)
  }

  const removePage = (pageId) => {
    if (pages.find(p => p.id === pageId)?.isHome) return
    setPages(prev => prev.filter(p => p.id !== pageId))
    // Clean up widget data for removed page
    const removedPage = pages.find(p => p.id === pageId)
    if (removedPage) {
      setWidgetData(prev => {
        const updated = { ...prev }
        removedPage.widgets.forEach(w => delete updated[w.instanceId])
        return updated
      })
    }
    if (activePage === pageId) setActivePage('home')
  }

  const renamePage = (pageId, newName) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, name: newName } : p))
    setEditingPageName(null)
  }

  // ─── Widget Management ───
  const addWidget = (widgetType) => {
    const widgetDef = STORE_WIDGETS.find(w => w.id === widgetType)
    if (!widgetDef || !canAddWidgetType(widgetDef)) return

    const newWidget = {
      instanceId: `${widgetType}-${Date.now()}`,
      type: widgetType,
      ...widgetDef
    }

    setPages(prev => prev.map(p =>
      p.id === activePage
        ? { ...p, widgets: [...p.widgets, newWidget] }
        : p
    ))

    setWidgetData(prev => ({
      ...prev,
      [newWidget.instanceId]: {
        referenceImage: null,
        aiPrompt: generateWidgetPrompt(widgetType, product ? buildCampaignData(product) : undefined),
        images: [],
        headline: '',
        body: '',
        videoFile: null,
        coverImage: null,
        shoppableTags: [],
        productAsins: ['', '', '', '']
      }
    }))
    setExpandedWidget(newWidget.instanceId)
  }

  const removeWidget = (instanceId) => {
    setPages(prev => prev.map(p =>
      p.id === activePage
        ? { ...p, widgets: p.widgets.filter(w => w.instanceId !== instanceId) }
        : p
    ))
    setWidgetData(prev => {
      const updated = { ...prev }
      delete updated[instanceId]
      return updated
    })
    if (expandedWidget === instanceId) setExpandedWidget(null)
  }

  // Drag and drop
  const handleDragStart = (index) => setDraggedIndex(index)
  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setPages(prev => prev.map(p => {
      if (p.id !== activePage) return p
      const newWidgets = [...p.widgets]
      const dragged = newWidgets[draggedIndex]
      newWidgets.splice(draggedIndex, 1)
      newWidgets.splice(index, 0, dragged)
      return { ...p, widgets: newWidgets }
    }))
    setDraggedIndex(index)
  }
  const handleDragEnd = () => setDraggedIndex(null)

  const moveWidget = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= currentWidgets.length) return
    setPages(prev => prev.map(p => {
      if (p.id !== activePage) return p
      const newWidgets = [...p.widgets]
      const temp = newWidgets[index]
      newWidgets[index] = newWidgets[newIndex]
      newWidgets[newIndex] = temp
      return { ...p, widgets: newWidgets }
    }))
  }

  // Update widget data
  const updateWidgetData = (instanceId, field, value) => {
    setWidgetData(prev => ({
      ...prev,
      [instanceId]: { ...prev[instanceId], [field]: value }
    }))
  }

  // File uploads
  const handleReferenceImageUpload = useCallback((instanceId, e) => {
    const file = e.target?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('Max 10MB'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      setWidgetData(prev => ({
        ...prev,
        [instanceId]: {
          ...prev[instanceId],
          referenceImage: { file, preview: e.target.result, name: file.name }
        }
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleWidgetImageUpload = useCallback((instanceId, imageIndex, e) => {
    const file = e.target?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB per image'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      setWidgetData(prev => {
        const currentImages = prev[instanceId]?.images || []
        const newImages = [...currentImages]
        newImages[imageIndex] = { file, preview: e.target.result, name: file.name }
        return { ...prev, [instanceId]: { ...prev[instanceId], images: newImages } }
      })
    }
    reader.readAsDataURL(file)
  }, [])

  const getAspectRatio = (w, h) => {
    if (!w || !h) return '1:1'
    const r = w / h
    if (r >= 2.5) return '3:1'
    if (r >= 1.6) return '16:9'
    if (r >= 1.2) return '4:3'
    if (r >= 0.85) return '1:1'
    if (r >= 0.65) return '3:4'
    return '9:16'
  }

  // Generate AI images — calls existing /api/generate endpoint
  const generateWidgetImage = async (instanceId) => {
    const widget = currentWidgets.find(w => w.instanceId === instanceId)
    const data = widgetData[instanceId] || {}
    if (!widget || widget.textOnly || widget.isProductGrid) return

    // For galleries cap at 4 to avoid very long waits
    const imageCount = widget.isGallery ? Math.min(widget.imageCount || 1, 4) : 1
    const aspectRatio = getAspectRatio(widget.width, widget.height)
    const prompt = data.aiPrompt || ''

    setGeneratingWidgets(prev => ({ ...prev, [instanceId]: true }))
    setWidgetErrors(prev => ({ ...prev, [instanceId]: null }))

    try {
      const generated = []
      for (let i = 0; i < imageCount; i++) {
        const result = await generateImage(prompt, { aspectRatio })
        generated.push({ url: result.url, preview: result.url, name: 'AI Generated', isGenerated: true, prompt })
      }
      setWidgetData(prev => {
        const existing = [...(prev[instanceId]?.images || [])]
        generated.forEach((img, i) => { existing[i] = img })
        return { ...prev, [instanceId]: { ...prev[instanceId], images: existing } }
      })
    } catch (err) {
      setWidgetErrors(prev => ({ ...prev, [instanceId]: err.message || 'Generation failed' }))
    } finally {
      setGeneratingWidgets(prev => ({ ...prev, [instanceId]: false }))
    }
  }

  // Generate All
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generateAllProgress, setGenerateAllProgress] = useState(null)
  const cancelAllRef = useRef(false)

  const handleGenerateAll = async () => {
    if (!currentWidgets.length || generatingAll) return
    setGeneratingAll(true)
    cancelAllRef.current = false
    setGenerateAllProgress({ current: 0, total: currentWidgets.length })
    for (let i = 0; i < currentWidgets.length; i++) {
      if (cancelAllRef.current) break
      const widget = currentWidgets[i]
      setGenerateAllProgress({ current: i + 1, total: currentWidgets.length })
      if (!widget.textOnly && !widget.isProductGrid) await generateWidgetImage(widget.instanceId)
      if (cancelAllRef.current) break
      if (isValidASIN(asinValue) && (widget.hasText || widget.textOnly)) await generateWidgetContent(widget.instanceId)
    }
    setGeneratingAll(false)
    setGenerateAllProgress(null)
  }

  const cloudDrafts = useDrafts('storefront_designer')

  const handleLoadDraft = (draft) => {
    const d = draft.data
    if (d.pages?.length) setPages(d.pages)
    if (d.widgetData) setWidgetData(d.widgetData)
    cloudDrafts.togglePanel()
  }

  const handleSave = () => {
    const saveData = { pages, widgetData, savedAt: new Date().toISOString() }
    localStorage.setItem('storefront_draft', JSON.stringify(saveData))
    const name = `Storefront ${new Date().toLocaleDateString()}`
    cloudDrafts.save({ name, data: { pages, widgetData } })
    const prev = document.title
    document.title = '✓ Saved — ' + prev
    setTimeout(() => { document.title = prev }, 1500)
  }

  const handleExport = () => {
    const exportPages = pages.map(p => ({
      id: p.id,
      name: p.name,
      template: p.template,
      widgets: p.widgets.map(w => ({
        type: w.type,
        name: w.name,
        dimensions: w.dimensions,
        headline: widgetData[w.instanceId]?.headline || '',
        body: widgetData[w.instanceId]?.body || '',
        image_urls: (widgetData[w.instanceId]?.images || [])
          .filter(Boolean)
          .map(img => img.url || img.preview || null)
          .filter(Boolean),
      }))
    }))
    const blob = new Blob([JSON.stringify({ storefront: exportPages, asin: asinValue, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storefront-${asinValue || 'draft'}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate AI text content via /api/content/generate
  const generateWidgetContent = async (instanceId) => {
    const widget = currentWidgets.find(w => w.instanceId === instanceId)
    if (!widget) return

    if (!isValidASIN(asinValue)) {
      setWidgetErrors(prev => ({ ...prev, [instanceId]: 'Enter a valid ASIN first to generate content' }))
      return
    }

    setGeneratingWidgets(prev => ({ ...prev, [instanceId]: true }))
    setWidgetErrors(prev => ({ ...prev, [instanceId]: null }))

    try {
      const result = await generateModuleContentAPI({
        asin: asinValue,
        pageType: 'storefront',
        moduleType: widget.id,
        marketplace,
      })
      if (result.headline) updateWidgetData(instanceId, 'headline', result.headline)
      if (result.body)     updateWidgetData(instanceId, 'body',     result.body)
    } catch (err) {
      setWidgetErrors(prev => ({ ...prev, [instanceId]: err.message || 'Content generation failed' }))
    } finally {
      setGeneratingWidgets(prev => ({ ...prev, [instanceId]: false }))
    }
  }

  const regeneratePrompt = (instanceId, widgetType) => {
    updateWidgetData(instanceId, 'aiPrompt', generateWidgetPrompt(widgetType))
  }

  // ─── Render Widget Editor ───
  const renderWidgetEditor = (widget) => {
    const data = widgetData[widget.instanceId] || {}
    const imageCount = widget.isGallery ? (widget.imageCount || 8) : 1

    return (
      <div className="module-editor">
        {/* Reference Image */}
        <div className="reference-image-section">
          <label className="module-label">
            <Image size={16} /> Reference Image
            <span className="label-hint">(Your photo for AI to use)</span>
          </label>
          <div className="reference-image-upload-area">
            {data.referenceImage ? (
              <div className="reference-image-preview">
                <img src={data.referenceImage.preview} alt="Reference" />
                <div className="reference-image-info">
                  <span className="reference-image-name">{data.referenceImage.name}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => updateWidgetData(widget.instanceId, 'referenceImage', null)}>
                    <X size={14} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="reference-image-dropzone">
                <input type="file" accept="image/*" onChange={(e) => handleReferenceImageUpload(widget.instanceId, e)} style={{ display: 'none' }} />
                <Upload size={24} />
                <span className="dropzone-title">Upload Reference Image</span>
                <span className="dropzone-hint">JPG, PNG, WebP (Max 10MB)</span>
              </label>
            )}
          </div>
        </div>

        {/* AI Prompt */}
        <div className="ai-prompt-section">
          <div className="ai-prompt-header">
            <label className="module-label">
              <Wand2 size={16} /> AI Generation Prompt
              <span className="label-hint">(Auto-generated from Creative Campaign)</span>
            </label>
            <button className="btn btn-sm btn-ghost" onClick={() => regeneratePrompt(widget.instanceId, widget.id)}>
              <RefreshCw size={14} /> Reset
            </button>
          </div>
          <div className="ai-prompt-textarea-wrapper">
            <textarea
              className="ai-prompt-textarea"
              value={data.aiPrompt || ''}
              onChange={(e) => updateWidgetData(widget.instanceId, 'aiPrompt', e.target.value)}
              placeholder="Enter your AI generation prompt..."
              rows={6}
            />
            <div className="ai-prompt-footer">
              <span className="char-count">{(data.aiPrompt || '').length} characters</span>
              <span className="prompt-tag"><FileText size={12} /> Campaign Data</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-generate-images"
            disabled={!!generatingWidgets[widget.instanceId]}
            onClick={() => generateWidgetImage(widget.instanceId)}
          >
            {generatingWidgets[widget.instanceId] ? <><Loader2 size={16} className="spin" /> Generating...</> : <><Sparkles size={16} /> Generate with AI</>}
          </button>
          {widgetErrors[widget.instanceId] && (
            <p className="ai-prompt-hint" style={{ color: 'var(--error)' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
              {widgetErrors[widget.instanceId]}
            </p>
          )}
        </div>

        {/* Output Images */}
        {!widget.textOnly && !widget.isProductGrid && (
          <div className="module-images">
            <label className="module-label">
              Output Images <span className="dim">({widget.dimensions})</span>
              {widget.isGallery && <span className="label-hint">— Upload 3-8 images for carousel</span>}
              {widget.isShoppable && <span className="label-hint">— Up to 6 product tags</span>}
              {widget.note && <span className="label-hint">— {widget.note}</span>}
            </label>
            <div className={`module-image-grid images-${Math.min(imageCount, 4)}`}>
              {Array.from({ length: imageCount }).map((_, idx) => (
                <div key={idx} className="module-image-slot" style={{ aspectRatio: widget.width && widget.height ? `${widget.width}/${widget.height}` : '16/9' }}>
                  {data.images?.[idx] ? (
                    <>
                      <div className="module-image-preview">
                        <img src={data.images[idx].preview} alt={`Image ${idx + 1}`} />
                        <button className="remove-image-btn" onClick={() => {
                          const newImages = [...(data.images || [])]
                          newImages[idx] = null
                          updateWidgetData(widget.instanceId, 'images', newImages)
                        }}>
                          <X size={14} />
                        </button>
                      </div>
                      {data.images[idx]?.isGenerated && (
                        <EvalScoreBadge
                          imageUrl={data.images[idx].url}
                          prompt={data.images[idx].prompt || data.aiPrompt || ''}
                          contentType="brand_store"
                        />
                      )}
                    </>
                  ) : (
                    <label className="module-image-upload">
                      <input type="file" accept="image/*" onChange={(e) => handleWidgetImageUpload(widget.instanceId, idx, e)} style={{ display: 'none' }} />
                      <Upload size={20} />
                      <span>{widget.width ? `${widget.width}x${widget.height}` : 'Upload'}</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Upload (for video widgets) */}
        {widget.isVideo && (
          <div className="video-upload-section">
            <label className="module-label">
              <Film size={16} />
              {widget.isBgVideo ? 'Background Video' : 'Video File'}
              <span className="label-hint">
                {widget.isBgVideo ? '(2-20s, silent, auto-loop)' : '(<100MB, MP4/MOV/AVI)'}
              </span>
            </label>
            <div className="video-upload-area">
              {data.videoFile ? (
                <div className="video-file-info">
                  <Film size={20} />
                  <span>{data.videoFile.name}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => updateWidgetData(widget.instanceId, 'videoFile', null)}>
                    <X size={14} /> Remove
                  </button>
                </div>
              ) : (
                <label className="reference-image-dropzone">
                  <input
                    type="file"
                    accept="video/mp4,video/mov,video/avi,video/mpeg"
                    onChange={(e) => {
                      const file = e.target?.files?.[0]
                      if (file) updateWidgetData(widget.instanceId, 'videoFile', { name: file.name, size: file.size })
                    }}
                    style={{ display: 'none' }}
                  />
                  <Film size={24} />
                  <span className="dropzone-title">Upload Video</span>
                  <span className="dropzone-hint">{widget.isBgVideo ? '2-20s, MP4 (silent, auto-loop)' : 'MP4, MOV, AVI (<100MB)'}</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Shoppable Tags */}
        {widget.isShoppable && (
          <div className="shoppable-tags-editor">
            <label className="module-label">
              <MousePointer size={16} /> Product Tags (up to 6)
            </label>
            <div className="shoppable-tags-list">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="shoppable-tag-row">
                  <span className="tag-number">{idx + 1}</span>
                  <input
                    type="text"
                    placeholder={`ASIN ${idx + 1} (e.g., B09XYZ1234)`}
                    value={data.shoppableTags?.[idx]?.asin || ''}
                    onChange={(e) => {
                      const tags = [...(data.shoppableTags || [])]
                      tags[idx] = { ...tags[idx], asin: e.target.value.toUpperCase() }
                      updateWidgetData(widget.instanceId, 'shoppableTags', tags)
                    }}
                    maxLength={10}
                    className="asin-input-field"
                  />
                  <input
                    type="text"
                    placeholder="Product label"
                    value={data.shoppableTags?.[idx]?.label || ''}
                    onChange={(e) => {
                      const tags = [...(data.shoppableTags || [])]
                      tags[idx] = { ...tags[idx], label: e.target.value }
                      updateWidgetData(widget.instanceId, 'shoppableTags', tags)
                    }}
                    maxLength={50}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid ASINs */}
        {widget.isProductGrid && (
          <div className="product-grid-editor">
            <label className="module-label">
              <Grid3X3 size={16} /> Product ASINs (4 or more)
            </label>
            <textarea
              className="product-asin-textarea"
              placeholder="Enter ASINs separated by commas (e.g., B09XYZ1234, B08ABC5678, ...)"
              value={data.productAsins?.join?.(', ') || ''}
              onChange={(e) => {
                const asins = e.target.value.split(',').map(a => a.trim().toUpperCase())
                updateWidgetData(widget.instanceId, 'productAsins', asins)
              }}
              rows={3}
            />
            <div className="product-grid-options">
              <label className="module-label">Layout</label>
              <div className="grid-layout-options">
                <button
                  className={`layout-option ${(data.gridLayout || 'standard') === 'standard' ? 'active' : ''}`}
                  onClick={() => updateWidgetData(widget.instanceId, 'gridLayout', 'standard')}
                >
                  Standard
                </button>
                <button
                  className={`layout-option ${data.gridLayout === 'tall' ? 'active' : ''}`}
                  onClick={() => updateWidgetData(widget.instanceId, 'gridLayout', 'tall')}
                >
                  Tall
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Text Fields */}
        {widget.hasText && (
          <div className="module-text-fields">
            {widget.textFields?.includes('headline') && (
              <div className="module-field">
                <label className="module-label">Headline</label>
                <input
                  type="text"
                  placeholder="Enter headline..."
                  value={data.headline || ''}
                  onChange={(e) => updateWidgetData(widget.instanceId, 'headline', e.target.value)}
                  maxLength={widget.headlineLimit || 100}
                />
                <span className="char-count">{(data.headline || '').length}/{widget.headlineLimit || 100}</span>
              </div>
            )}
            {widget.textFields?.includes('body') && (
              <div className="module-field">
                <label className="module-label">Body Text</label>
                <textarea
                  placeholder="Enter body text..."
                  value={data.body || ''}
                  onChange={(e) => updateWidgetData(widget.instanceId, 'body', e.target.value)}
                  maxLength={widget.bodyLimit || 1000}
                  rows={widget.bodyLimit > 500 ? 6 : 4}
                />
                <span className="char-count">{(data.body || '').length}/{widget.bodyLimit || 1000}</span>
              </div>
            )}
            <button className="btn btn-secondary btn-sm ai-generate-btn" onClick={() => generateWidgetContent(widget.instanceId)} disabled={!!generatingWidgets[widget.instanceId]}>
              {generatingWidgets[widget.instanceId] ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              AI Generate Content
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Render Widget Preview ───
  const renderWidgetPreview = (widget) => {
    const data = widgetData[widget.instanceId] || {}

    if (widget.textOnly) {
      return (
        <div className="sf-preview-text">
          {data.headline && <h3>{data.headline}</h3>}
          <p>{data.body || 'Text content...'}</p>
        </div>
      )
    }

    if (widget.isProductGrid) {
      return (
        <div className="sf-preview-grid">
          <Grid3X3 size={32} />
          <span>Product Grid ({(data.productAsins || []).filter(a => a).length} products)</span>
          <span className="dim">{data.gridLayout || 'standard'} layout</span>
        </div>
      )
    }

    return (
      <div className="sf-preview-image">
        {data.images?.[0] ? (
          <img src={data.images[0].preview} alt="Preview" />
        ) : (
          <div className="preview-placeholder">
            <Image size={24} />
            <span>{widget.dimensions}</span>
          </div>
        )}
        {widget.hasText && (data.headline || data.body) && (
          <div className="sf-preview-overlay">
            {data.headline && <h4>{data.headline}</h4>}
            {data.body && <p>{data.body}</p>}
          </div>
        )}
        {widget.isShoppable && <div className="sf-preview-shoppable-badge"><MousePointer size={14} /> Shoppable</div>}
        {widget.isVideo && <div className="sf-preview-video-badge"><Film size={14} /> {widget.isBgVideo ? 'BG Video' : 'Video'}</div>}
        {widget.isGallery && <div className="sf-preview-gallery-badge">Gallery ({(data.images || []).filter(Boolean).length} images)</div>}
      </div>
    )
  }

  return (
    <div className="aplus-content-page aplus-layout-vertical storefront-page">
      {/* Top Toolbar */}
      <div className="aplus-toolbar">
        <div className="toolbar-row toolbar-main">
          <div className="toolbar-left">
            <h1>Storefront Designer</h1>
            <span className="brand-story-badge">Amazon Store</span>
          </div>
          <div className="toolbar-center">
            <div className="asin-input-compact">
              <input
                type="text"
                className="asin-input-field"
                placeholder="ASIN for AI content"
                value={asinValue}
                onChange={(e) => { setAsinValue(e.target.value.trim().toUpperCase()); setProduct(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleAsinSearch()}
                maxLength={10}
              />
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleAsinSearch}
                disabled={!isValidASIN(asinValue) || asinLoading}
                title="Look up product data to personalise AI prompts"
              >
                {asinLoading ? <Loader2 size={13} className="spin" /> : <Search size={13} />}
              </button>
            </div>
            {product && (
              <span className="asin-product-name" title={product.title}>
                {product.brand ? `${product.brand} · ` : ''}{(product.title || '').slice(0, 40)}{(product.title || '').length > 40 ? '…' : ''}
              </span>
            )}
            {asinError && <span style={{ color: '#e74c3c', fontSize: 12 }}>{asinError}</span>}
            <select
              className="category-dropdown"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
            >
              <option value="">Product Category</option>
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="module-counter-badge">
              {currentWidgets.length}/{maxSections} sections
            </span>
            <span className="module-counter-badge">
              {pages.length}/{maxSubpages + 1} pages
            </span>
          </div>
          <div className="toolbar-right">
            <button className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            {previewMode && (
              <div className="device-toggle">
                <button
                  className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                  title="Desktop view"
                >
                  <Monitor size={16} />
                </button>
                <button
                  className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                  title="Mobile view"
                >
                  <Smartphone size={16} />
                </button>
              </div>
            )}
            {currentWidgets.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleGenerateAll}
                  disabled={generatingAll}
                >
                  {generatingAll
                    ? <><Loader2 size={14} className="spin" /> {generateAllProgress?.current}/{generateAllProgress?.total}</>
                    : <><Sparkles size={14} /> Generate All</>}
                </button>
                {generatingAll && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { cancelAllRef.current = true }}>
                    <X size={13} /> Cancel
                  </button>
                )}
              </div>
            )}
            <button className="btn btn-sm btn-secondary" disabled={currentWidgets.length === 0} onClick={handleSave}>
              {cloudDrafts.saving ? <Loader2 size={16} className="spin" /> : cloudDrafts.saved ? <Check size={16} /> : <Save size={16} />}
              {cloudDrafts.saved ? 'Saved!' : 'Save'}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-sm btn-ghost" onClick={cloudDrafts.togglePanel}>
                <ChevronDown size={15} /> Drafts
              </button>
              {cloudDrafts.panelOpen && (
                <div className="drafts-dropdown">
                  {cloudDrafts.loading && <div className="drafts-loading">Loading…</div>}
                  {!cloudDrafts.loading && cloudDrafts.drafts.length === 0 && <div className="drafts-empty">No saved drafts</div>}
                  {cloudDrafts.drafts.map(d => (
                    <div key={d.id} className="drafts-item">
                      <button className="drafts-item-name" onClick={() => handleLoadDraft(d)}>{d.name}</button>
                      <button className="drafts-item-delete" onClick={() => cloudDrafts.remove(d.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-sm btn-primary" disabled={currentWidgets.length === 0} onClick={handleExport}>
              <Download size={16} /> Export
            </button>
            <div className="guidelines-dropdown">
              <button className={`btn-icon-circle ${showGuidelines ? 'active' : ''}`} onClick={() => setShowGuidelines(!showGuidelines)} title="Store Guidelines">
                <Info size={18} />
              </button>
              {showGuidelines && (
                <div className="guidelines-popup">
                  <div className="guidelines-popup-header">
                    <h4>Storefront Guidelines</h4>
                    <button className="popup-close" onClick={() => setShowGuidelines(false)}><X size={16} /></button>
                  </div>
                  <div className="guidelines-popup-content">
                    {STORE_GUIDELINES.map((g, idx) => (
                      <div key={idx} className={`guideline-row ${g.icon === '✓' ? 'do' : 'dont'}`}>
                        <span className="guideline-icon">{g.icon}</span>
                        <span>{g.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Tabs */}
        <div className="toolbar-row sf-page-tabs-row">
          <div className="sf-page-tabs">
            {pages.map(page => (
              <div key={page.id} className={`sf-page-tab ${activePage === page.id ? 'active' : ''}`}>
                {editingPageName === page.id ? (
                  <input
                    className="sf-page-name-input"
                    value={page.name}
                    onChange={(e) => setPages(prev => prev.map(p => p.id === page.id ? { ...p, name: e.target.value } : p))}
                    onBlur={() => setEditingPageName(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingPageName(null)}
                    autoFocus
                    maxLength={30}
                  />
                ) : (
                  <button className="sf-page-tab-btn" onClick={() => setActivePage(page.id)} onDoubleClick={() => !page.isHome && setEditingPageName(page.id)}>
                    {page.isHome && <Monitor size={14} />}
                    {page.name}
                    <span className="sf-page-widget-count">{page.widgets.length}</span>
                  </button>
                )}
                {!page.isHome && activePage === page.id && (
                  <button className="sf-page-remove" onClick={() => removePage(page.id)} title="Remove page">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {canAddPage && (
              <div className="sf-add-page-wrapper">
                <button className="sf-add-page-btn" onClick={() => setShowTemplates(!showTemplates)} title="Add subpage">
                  <PlusCircle size={16} /> Add Page
                </button>
                {showTemplates && (
                  <div className="sf-template-dropdown">
                    <div className="sf-template-dropdown-header">
                      <h4>Choose a Template</h4>
                      <button className="popup-close" onClick={() => setShowTemplates(false)}><X size={14} /></button>
                    </div>
                    {PAGE_TEMPLATES.map(tpl => (
                      <button key={tpl.id} className="sf-template-option" onClick={() => addPage(tpl.id)}>
                        <span className="sf-template-icon">{tpl.icon}</span>
                        <div className="sf-template-info">
                          <span className="sf-template-name">{tpl.name}</span>
                          <span className="sf-template-desc">{tpl.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Widget Library Row */}
        <div className="toolbar-row toolbar-modules">
          <div className="category-tabs">
            {WIDGET_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${categoryFilter === cat.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="modules-scroll">
            {filteredWidgets.map(widget => {
              const atLimit = widget.maxPerPage && getWidgetCount(widget.id) >= widget.maxPerPage
              return (
                <button
                  key={widget.id}
                  className={`module-chip ${!canAddWidget || atLimit ? 'disabled' : ''}`}
                  onClick={() => canAddWidgetType(widget) && addWidget(widget.id)}
                  disabled={!canAddWidget || atLimit}
                  title={`${widget.name} (${widget.dimensions})${atLimit ? ' — Limit reached' : ''}${widget.note ? ` — ${widget.note}` : ''}`}
                >
                  <span className="chip-icon">{widget.preview}</span>
                  <span className="chip-name">{widget.name}</span>
                  <span className="chip-size">{widget.dimensions}</span>
                  {atLimit ? <span className="chip-limit">MAX</span> : <Plus size={14} className="chip-add" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="aplus-content-area">
        {currentWidgets.length === 0 ? (
          <div className="builder-empty-full">
            <Layout size={56} />
            <h3>Design Your Storefront</h3>
            <p>Click widgets above to add sections to "{currentPage.name}"</p>
            <span className="hint">Max 20 sections per page • Use the page tabs to add subpages</span>
          </div>
        ) : previewMode ? (
          <div className={`preview-container-full sf-preview-container sf-device-${previewDevice}`}>
            <div className="sf-preview-frame">
              <div className="sf-preview-header-bar">
                {previewDevice === 'mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                <span>{currentPage.name}</span>
                {pages.length > 1 && (
                  <div className="sf-preview-nav">
                    {pages.map(p => (
                      <span key={p.id} className={`sf-preview-nav-link ${p.id === activePage ? 'active' : ''}`}>{p.name}</span>
                    ))}
                  </div>
                )}
              </div>
              {currentWidgets.map(widget => (
                <div key={widget.instanceId} className={`sf-preview-section section-${widget.type}`}>
                  {renderWidgetPreview(widget)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="modules-container-full">
            {currentWidgets.map((widget, index) => (
              <div
                key={widget.instanceId}
                className={`module-item-full ${draggedIndex === index ? 'dragging' : ''} ${expandedWidget === widget.instanceId ? 'expanded' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="module-header-full">
                  <div className="module-drag-handle"><GripVertical size={18} /></div>
                  <span className="module-number">{index + 1}</span>
                  <span className="module-icon-lg">{widget.preview}</span>
                  <div className="module-title-info">
                    <span className="module-name-lg">{widget.name}</span>
                    <span className="module-dims">{widget.dimensions}{widget.note ? ` — ${widget.note}` : ''}</span>
                  </div>
                  <div className="module-actions-full">
                    <button className="btn-icon-sm" onClick={() => moveWidget(index, 'up')} disabled={index === 0}><ChevronUp size={18} /></button>
                    <button className="btn-icon-sm" onClick={() => moveWidget(index, 'down')} disabled={index === currentWidgets.length - 1}><ChevronDown size={18} /></button>
                    <button className="btn-icon-sm expand-btn" onClick={() => setExpandedWidget(expandedWidget === widget.instanceId ? null : widget.instanceId)}>
                      {expandedWidget === widget.instanceId ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button className="btn-icon-sm delete-btn" onClick={() => removeWidget(widget.instanceId)}><Trash2 size={18} /></button>
                  </div>
                </div>
                {expandedWidget === widget.instanceId && (
                  <div className="module-content-full">
                    {renderWidgetEditor(widget)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StorefrontDesigner
