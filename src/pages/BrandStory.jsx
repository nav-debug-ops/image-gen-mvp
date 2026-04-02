import { useState, useCallback, useEffect, useRef } from 'react'
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
  LayoutGrid,
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
  ShoppingBag,
  Lock
} from 'lucide-react'

// Brand Story Module Definitions
const BRAND_STORY_MODULES = [
  {
    id: 'carousel-background',
    name: 'Brand Carousel Background',
    description: 'Mandatory background image with headline and body text',
    dimensions: '1464 x 625 px',
    width: 1464,
    height: 625,
    hasText: true,
    textFields: ['headline', 'body'],
    headlineLimit: 30,
    bodyLimit: 135,
    category: 'background',
    preview: '🎠',
    isMandatory: true
  },
  {
    id: 'focus-image',
    name: 'Brand Focus Image',
    description: 'Visual image showcasing brand creator or product line',
    dimensions: '362 x 453 px',
    width: 362,
    height: 453,
    hasText: true,
    textFields: ['headline'],
    headlineLimit: 30,
    category: 'visual',
    preview: '📸'
  },
  {
    id: 'logo-description',
    name: 'Brand Logo & Description',
    description: 'Brand logo with detailed description text',
    dimensions: '315 x 145 px',
    width: 315,
    height: 145,
    hasText: true,
    textFields: ['body'],
    bodyLimit: 450,
    category: 'branding',
    preview: '🏷️'
  },
  {
    id: 'asin-showcase',
    name: 'Brand ASIN & Store Showcase',
    description: 'Showcase up to 4 products with ASINs',
    dimensions: '166 x 182 px each',
    width: 166,
    height: 182,
    imageCount: 4,
    hasText: true,
    textFields: ['headline'],
    headlineLimit: 30,
    category: 'products',
    preview: '🛍️',
    isAsinShowcase: true
  },
  {
    id: 'brand-qa',
    name: 'Brand Q&A',
    description: 'Interactive FAQ section with 3 Q&A pairs',
    dimensions: 'Text only',
    width: 0,
    height: 0,
    hasText: true,
    textOnly: true,
    textFields: ['qa'],
    qaLimit: 750,
    qaCount: 3,
    category: 'text',
    preview: '❓',
    isQA: true
  }
]

const BRAND_STORY_GUIDELINES = [
  { icon: '✓', text: 'Use high-resolution brand images (min 72 DPI)' },
  { icon: '✓', text: 'Tell your brand\'s origin story authentically' },
  { icon: '✓', text: 'Highlight brand values and mission' },
  { icon: '✓', text: 'Use consistent brand colors and fonts' },
  { icon: '✓', text: 'Include your brand logo in the Logo module' },
  { icon: '✓', text: 'Showcase best-selling products in ASIN module' },
  { icon: '✓', text: 'Keep text concise — customers scan, not read' },
  { icon: '✓', text: 'Use 3-5 cards for maximum impact (up to 19 allowed)' },
  { icon: '✗', text: 'No pricing or promotional claims' },
  { icon: '✗', text: 'No time-sensitive information (sales, limited offers)' },
  { icon: '✗', text: 'No external URLs or contact information' },
  { icon: '✗', text: 'No competitor references or comparisons' },
  { icon: '✗', text: 'No unverified superlatives ("best", "#1")' },
  { icon: '✗', text: 'No customer reviews or testimonials' }
]

// Mock Creative Campaign Data
const CREATIVE_CAMPAIGN_DATA = {
  productName: 'Premium Wireless Headphones',
  brandName: 'AudioPro',
  brandStory: 'Founded in 2018 by audio engineers passionate about perfect sound',
  brandMission: 'Making premium audio accessible to everyone',
  brandValues: ['Innovation', 'Quality', 'Sustainability', 'Customer First'],
  targetAudience: 'Tech-savvy professionals aged 25-45',
  keyBenefits: [
    'Active noise cancellation',
    '40-hour battery life',
    'Premium comfort memory foam',
    'Crystal clear audio quality'
  ],
  topProducts: [
    'Pro X1 Over-Ear',
    'Sport Buds Elite',
    'Studio Monitor Pro',
    'Travel Companion'
  ],
  emotionalTriggers: [
    'Focus and productivity',
    'Premium quality and status',
    'Comfort and relaxation'
  ],
  toneOfVoice: 'Professional, confident, premium',
  keywords: ['wireless', 'noise-cancelling', 'premium', 'comfort', 'professional']
}

// Generate AI prompt templates for Brand Story modules
const generateBrandStoryPrompt = (moduleType, campaignData = CREATIVE_CAMPAIGN_DATA) => {
  const b    = campaignData.brandName    || 'the brand'
  const aud  = campaignData.targetAudience || 'Amazon shoppers'
  const tone = campaignData.toneOfVoice  || 'professional, authentic, trustworthy'
  const story = campaignData.brandStory  || ''
  const mission = campaignData.brandMission || ''
  const vals  = (campaignData.brandValues || []).join(', ')
  const emo   = (campaignData.emotionalTriggers || [])[0] || 'trust and quality'
  const tops  = campaignData.topProducts || []
  const COMPLIANCE = `No pricing text, no competitor brand names, no unverified claims. Photorealistic commercial photography — not illustration, not flat design.`

  const prompts = {
    'carousel-background': `Amazon Brand Story carousel background for ${b}. Cinematic full-width landscape at 1464×625 px — this is the brand's first impression. Preserve the horizontal center strip (middle third) as a clean uncluttered zone for headline and body text overlay. Scene: premium lifestyle environment that reflects the brand's origin and values${story ? ` — "${story.slice(0, 80)}"` : ''}. Products present in the scene but supporting the brand narrative, not dominating. Color palette: warm, aspirational, on-brand. Lighting: cinematic soft directional key light, high production quality. Mood: authentic, trustworthy, aspirational. Target: ${aud}. ${COMPLIANCE}`,

    'focus-image': `Amazon Brand Story focus image for ${b}. Portrait composition at 362×453 px — visually authentic image showcasing the brand creator, a team member, or the defining product line. Warm authentic lifestyle lighting, not overly staged or studio-stiff. Scene conveys the origin story or craftsmanship behind ${b}. Natural, credible, premium. Emotional tone: ${emo}. Upper area of the frame reserved as a lighter zone for short headline text overlay. Photorealistic, authentic — not stock-photo generic. ${COMPLIANCE}`,

    'logo-description': `UPLOAD ONLY — Do not AI-generate this module. Upload your official ${b} brand logo. AI image generators produce distorted text and unreliable brand marks. Requirements: PNG with transparent background, minimum 315×145 px, landscape/horizontal format, adequate white padding around the logo mark. If no logo file is available, export one from your design tool before returning here.`,

    'asin-showcase': `Amazon Brand Story product showcase — ${tops.length || 4} portrait product images at 166×182 px each for ${b}'s top products.${tops.length ? ` Products: ${tops.map((p, i) => `${i + 1}. ${p}`).join(', ')}.` : ''} Studio-quality clean photography: pure white or very light neutral background, consistent warm studio lighting, product centered and filling 80% of each frame. All images: accurate color, real texture, crisp focus throughout. Consistent studio treatment across all images. No text in generated images — product names are added separately in Amazon's module editor. ${COMPLIANCE}`,

    'brand-qa': `TEXT MODULE — No image to generate. Write Brand Story Q&A content for ${b}.${mission ? ` Brand mission: ${mission}.` : ''}${vals ? ` Brand values: ${vals}.` : ''} Target audience: ${aud}. Write 3 helpful Q&A pairs: Q1 about what makes ${b} unique, Q2 about the brand mission, Q3 about who the products are designed for. Tone: ${tone}. Rules: no pricing, no superlatives like "best" or "#1", no competitor mentions, no customer reviews or testimonials. Total combined answer length: under 750 characters.`,
  }

  return prompts[moduleType] || `Create professional brand story content for ${b}. Target: ${aud}. Tone: ${tone}. Style: premium, authentic, Amazon-compliant. ${COMPLIANCE}`
}

function BrandStory() {
  // Module management
  const [selectedModules, setSelectedModules] = useState([])
  const [moduleData, setModuleData] = useState({})
  const [draggedIndex, setDraggedIndex] = useState(null)

  // UI state
  const [expandedModule, setExpandedModule] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [generatingModules, setGeneratingModules] = useState({})
  const [moduleErrors, setModuleErrors] = useState({})
  const [asinValue, setAsinValue] = useState('')
  const [marketplace, setMarketplace] = useState('US')
  const [productCategory, setProductCategory] = useState('')

  // Validation
  const isValidASIN = (asin) => /^[A-Z0-9]{10}$/i.test(asin)
  const maxModules = 19

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
      brandValues: [],
      targetAudience: 'Amazon shoppers',
      keyBenefits: bullets.slice(0, 5),
      topProducts: [],
      emotionalTriggers: ['confidence', 'trust', 'quality'],
      toneOfVoice: 'Professional, authentic, trustworthy',
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
  const canAddModule = selectedModules.length < maxModules
  const hasMinModules = selectedModules.length >= 1

  // Auto-add mandatory Carousel Background on mount
  useEffect(() => {
    if (selectedModules.length === 0) {
      const bgModule = BRAND_STORY_MODULES.find(m => m.id === 'carousel-background')
      const newModule = {
        instanceId: `carousel-background-${Date.now()}`,
        type: 'carousel-background',
        ...bgModule
      }
      setSelectedModules([newModule])
      setModuleData({
        [newModule.instanceId]: {
          referenceImage: null,
          aiPrompt: generateBrandStoryPrompt('carousel-background', product ? buildCampaignData(product) : undefined),
          images: [],
          headline: '',
          body: '',
          qaItems: [
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' }
          ],
          asins: ['', '', '', '']
        }
      })
      setExpandedModule(newModule.instanceId)
    }
  }, [])

  // Add module
  const addModule = (moduleType) => {
    if (!canAddModule) return

    const moduleDefinition = BRAND_STORY_MODULES.find(m => m.id === moduleType)
    if (!moduleDefinition) return

    const newModule = {
      instanceId: `${moduleType}-${Date.now()}`,
      type: moduleType,
      ...moduleDefinition
    }

    setSelectedModules(prev => [...prev, newModule])
    setModuleData(prev => ({
      ...prev,
      [newModule.instanceId]: {
        referenceImage: null,
        aiPrompt: generateBrandStoryPrompt(moduleType, product ? buildCampaignData(product) : undefined),
        images: [],
        headline: '',
        body: '',
        qaItems: [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ],
        asins: ['', '', '', '']
      }
    }))
    setExpandedModule(newModule.instanceId)
  }

  // Remove module (prevent removing mandatory carousel background if it's the only one)
  const removeModule = (instanceId) => {
    const module = selectedModules.find(m => m.instanceId === instanceId)
    if (module?.isMandatory && selectedModules.filter(m => m.type === 'carousel-background').length <= 1) {
      return // Cannot remove the only carousel background
    }

    setSelectedModules(prev => prev.filter(m => m.instanceId !== instanceId))
    setModuleData(prev => {
      const updated = { ...prev }
      delete updated[instanceId]
      return updated
    })
    if (expandedModule === instanceId) {
      setExpandedModule(null)
    }
  }

  // Drag and drop
  const handleDragStart = (index) => setDraggedIndex(index)

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newModules = [...selectedModules]
    const draggedModule = newModules[draggedIndex]
    newModules.splice(draggedIndex, 1)
    newModules.splice(index, 0, draggedModule)

    setSelectedModules(newModules)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => setDraggedIndex(null)

  // Move module
  const moveModule = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= selectedModules.length) return

    const newModules = [...selectedModules]
    const temp = newModules[index]
    newModules[index] = newModules[newIndex]
    newModules[newIndex] = temp
    setSelectedModules(newModules)
  }

  // Update module data
  const updateModuleData = (instanceId, field, value) => {
    setModuleData(prev => ({
      ...prev,
      [instanceId]: {
        ...prev[instanceId],
        [field]: value
      }
    }))
  }

  // Handle reference image upload
  const handleReferenceImageUpload = useCallback((instanceId, e) => {
    const file = e.target?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Reference image must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setModuleData(prev => ({
        ...prev,
        [instanceId]: {
          ...prev[instanceId],
          referenceImage: {
            file,
            preview: e.target.result,
            name: file.name
          }
        }
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle output image upload
  const handleModuleImageUpload = useCallback((instanceId, imageIndex, e) => {
    const file = e.target?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setModuleData(prev => {
        const currentImages = prev[instanceId]?.images || []
        const newImages = [...currentImages]
        newImages[imageIndex] = {
          file,
          preview: e.target.result,
          name: file.name
        }
        return {
          ...prev,
          [instanceId]: {
            ...prev[instanceId],
            images: newImages
          }
        }
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

  // Generate AI images for a module — calls existing /api/generate endpoint
  const generateModuleImage = async (instanceId) => {
    const module = selectedModules.find(m => m.instanceId === instanceId)
    const data = moduleData[instanceId] || {}
    if (!module || module.textOnly) return

    const imageCount = module.imageCount || 1
    const aspectRatio = getAspectRatio(module.width, module.height)
    const prompt = data.aiPrompt || ''

    setGeneratingModules(prev => ({ ...prev, [instanceId]: true }))
    setModuleErrors(prev => ({ ...prev, [instanceId]: null }))

    try {
      const generated = []
      for (let i = 0; i < imageCount; i++) {
        const result = await generateImage(prompt, { aspectRatio })
        generated.push({ url: result.url, preview: result.url, name: 'AI Generated', isGenerated: true, prompt })
      }
      setModuleData(prev => {
        const existing = [...(prev[instanceId]?.images || [])]
        generated.forEach((img, i) => { existing[i] = img })
        return { ...prev, [instanceId]: { ...prev[instanceId], images: existing } }
      })
    } catch (err) {
      setModuleErrors(prev => ({ ...prev, [instanceId]: err.message || 'Generation failed' }))
    } finally {
      setGeneratingModules(prev => ({ ...prev, [instanceId]: false }))
    }
  }

  // Generate All
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generateAllProgress, setGenerateAllProgress] = useState(null)
  const cancelAllRef = useRef(false)

  const handleGenerateAll = async () => {
    if (!selectedModules.length || generatingAll) return
    setGeneratingAll(true)
    cancelAllRef.current = false
    setGenerateAllProgress({ current: 0, total: selectedModules.length })
    for (let i = 0; i < selectedModules.length; i++) {
      if (cancelAllRef.current) break
      const module = selectedModules[i]
      setGenerateAllProgress({ current: i + 1, total: selectedModules.length })
      if (!module.textOnly) await generateModuleImage(module.instanceId)
      if (cancelAllRef.current) break
      if (isValidASIN(asinValue) && module.hasText) await generateModuleContent(module.instanceId)
    }
    setGeneratingAll(false)
    setGenerateAllProgress(null)
  }

  const cloudDrafts = useDrafts('brand_story')

  const handleLoadDraft = (draft) => {
    const d = draft.data
    if (d.asinValue) setAsinValue(d.asinValue)
    if (d.selectedModules?.length) setSelectedModules(d.selectedModules)
    if (d.moduleData) setModuleData(d.moduleData)
    cloudDrafts.togglePanel()
  }

  const handleSave = () => {
    const saveData = { asinValue, selectedModules, moduleData, savedAt: new Date().toISOString() }
    localStorage.setItem('brand_story_draft', JSON.stringify(saveData))
    const name = asinValue || `Brand Story ${new Date().toLocaleDateString()}`
    cloudDrafts.save({ name, data: { asinValue, selectedModules, moduleData } })
    const prev = document.title
    document.title = '✓ Saved — ' + prev
    setTimeout(() => { document.title = prev }, 1500)
  }

  const handleExport = () => {
    const modules = selectedModules.map(m => ({
      module_type: m.id,
      module_name: m.name,
      headline: moduleData[m.instanceId]?.headline || '',
      body: moduleData[m.instanceId]?.body || '',
      qa_items: moduleData[m.instanceId]?.qaItems || [],
      image_urls: (moduleData[m.instanceId]?.images || [])
        .filter(Boolean)
        .map(img => img.url || img.preview || null)
        .filter(Boolean),
    }))
    const blob = new Blob([JSON.stringify({ asin: asinValue, page_type: 'brand_story', modules, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brand-story-${asinValue || 'draft'}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate AI text content via /api/content/generate
  const generateModuleContent = async (instanceId) => {
    const module = selectedModules.find(m => m.instanceId === instanceId)
    if (!module) return

    if (!isValidASIN(asinValue)) {
      setModuleErrors(prev => ({ ...prev, [instanceId]: 'Enter a valid ASIN first to generate content' }))
      return
    }

    setGeneratingModules(prev => ({ ...prev, [instanceId]: true }))
    setModuleErrors(prev => ({ ...prev, [instanceId]: null }))

    try {
      const result = await generateModuleContentAPI({
        asin: asinValue,
        pageType: 'brand_story',
        moduleType: module.id,
        marketplace,
      })
      if (module.type === 'brand-qa' && result.qa_pairs?.length) {
        updateModuleData(instanceId, 'qaItems', result.qa_pairs.map(p => ({
          question: p.question || '',
          answer: p.answer || '',
        })))
      } else {
        if (result.headline) updateModuleData(instanceId, 'headline', result.headline)
        if (result.body)     updateModuleData(instanceId, 'body',     result.body)
      }
    } catch (err) {
      setModuleErrors(prev => ({ ...prev, [instanceId]: err.message || 'Content generation failed' }))
    } finally {
      setGeneratingModules(prev => ({ ...prev, [instanceId]: false }))
    }
  }

  // Regenerate prompt
  const regeneratePrompt = (instanceId, moduleType) => {
    updateModuleData(instanceId, 'aiPrompt', generateBrandStoryPrompt(moduleType))
  }

  // Get total Q&A characters
  const getQACharCount = (qaItems) => {
    if (!qaItems) return 0
    return qaItems.reduce((total, item) => total + (item.question?.length || 0) + (item.answer?.length || 0), 0)
  }

  // Render module editor
  const renderModuleEditor = (module) => {
    const data = moduleData[module.instanceId] || {}
    const imageCount = module.imageCount || 1

    return (
      <div className="module-editor">
        {/* Reference Image Upload */}
        <div className="reference-image-section">
          <label className="module-label">
            <Image size={16} />
            Reference Image
            <span className="label-hint">(Your brand photo for AI to use)</span>
          </label>
          <div className="reference-image-upload-area">
            {data.referenceImage ? (
              <div className="reference-image-preview">
                <img src={data.referenceImage.preview} alt="Reference" />
                <div className="reference-image-info">
                  <span className="reference-image-name">{data.referenceImage.name}</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => updateModuleData(module.instanceId, 'referenceImage', null)}
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="reference-image-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleReferenceImageUpload(module.instanceId, e)}
                  style={{ display: 'none' }}
                />
                <Upload size={24} />
                <span className="dropzone-title">Upload Reference Image</span>
                <span className="dropzone-hint">JPG, PNG, WebP (Max 10MB)</span>
              </label>
            )}
          </div>
        </div>

        {/* AI Prompt Section */}
        <div className="ai-prompt-section">
          <div className="ai-prompt-header">
            <label className="module-label">
              <Wand2 size={16} />
              AI Generation Prompt
              <span className="label-hint">(Auto-generated from Creative Campaign)</span>
            </label>
            <div className="ai-prompt-actions">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => regeneratePrompt(module.instanceId, module.id)}
                title="Regenerate prompt from campaign data"
              >
                <RefreshCw size={14} />
                Reset
              </button>
            </div>
          </div>
          <div className="ai-prompt-textarea-wrapper">
            <textarea
              className="ai-prompt-textarea"
              value={data.aiPrompt || ''}
              onChange={(e) => updateModuleData(module.instanceId, 'aiPrompt', e.target.value)}
              placeholder="Enter your AI generation prompt here..."
              rows={8}
            />
            <div className="ai-prompt-footer">
              <span className="char-count">{(data.aiPrompt || '').length} characters</span>
              <div className="ai-prompt-tags">
                <span className="prompt-tag">
                  <FileText size={12} />
                  Based on Campaign Data
                </span>
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary btn-generate-images"
            disabled={!!generatingModules[module.instanceId]}
            onClick={() => generateModuleImage(module.instanceId)}
          >
            {generatingModules[module.instanceId] ? (
              <><Loader2 size={16} className="spin" /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Generate with AI</>
            )}
          </button>
          {moduleErrors[module.instanceId] && (
            <p className="ai-prompt-hint" style={{ color: 'var(--error)' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
              {moduleErrors[module.instanceId]}
            </p>
          )}
        </div>

        {/* Output Images (not for text-only modules) */}
        {!module.textOnly && !module.isAsinShowcase && (
          <div className="module-images">
            <label className="module-label">
              Output Images <span className="dim">({module.dimensions})</span>
              <span className="label-hint">— AI generated or manually upload</span>
            </label>
            <div className={`module-image-grid images-${imageCount}`}>
              {Array.from({ length: imageCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="module-image-slot"
                  style={{ aspectRatio: `${module.width}/${module.height}` }}
                >
                  {data.images?.[idx] ? (
                    <>
                      <div className="module-image-preview">
                        <img src={data.images[idx].preview} alt={`Image ${idx + 1}`} />
                        <button
                          className="remove-image-btn"
                          onClick={() => {
                            const newImages = [...(data.images || [])]
                            newImages[idx] = null
                            updateModuleData(module.instanceId, 'images', newImages)
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {data.images[idx]?.isGenerated && (
                        <EvalScoreBadge
                          imageUrl={data.images[idx].url}
                          prompt={data.images[idx].prompt || data.aiPrompt || ''}
                          contentType="brand_story"
                        />
                      )}
                    </>
                  ) : (
                    <label className="module-image-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleModuleImageUpload(module.instanceId, idx, e)}
                        style={{ display: 'none' }}
                      />
                      <Upload size={20} />
                      <span>{module.width}x{module.height}</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASIN Showcase Special Editor */}
        {module.isAsinShowcase && (
          <div className="asin-showcase-editor">
            <label className="module-label">
              <ShoppingBag size={16} />
              Product Showcase (up to 4 ASINs)
            </label>
            <div className="asin-showcase-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="asin-showcase-item">
                  <div
                    className="asin-showcase-image"
                    style={{ aspectRatio: `${module.width}/${module.height}` }}
                  >
                    {data.images?.[idx] ? (
                      <div className="module-image-preview">
                        <img src={data.images[idx].preview} alt={`Product ${idx + 1}`} />
                        <button
                          className="remove-image-btn"
                          onClick={() => {
                            const newImages = [...(data.images || [])]
                            newImages[idx] = null
                            updateModuleData(module.instanceId, 'images', newImages)
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="module-image-upload">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleModuleImageUpload(module.instanceId, idx, e)}
                          style={{ display: 'none' }}
                        />
                        <Upload size={16} />
                        <span className="upload-size-sm">166x182</span>
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    className="asin-input-field"
                    placeholder={`ASIN ${idx + 1} (e.g., B09XYZ1234)`}
                    value={data.asins?.[idx] || ''}
                    onChange={(e) => {
                      const newAsins = [...(data.asins || ['', '', '', ''])]
                      newAsins[idx] = e.target.value.toUpperCase()
                      updateModuleData(module.instanceId, 'asins', newAsins)
                    }}
                    maxLength={10}
                  />
                  {data.asins?.[idx] && (
                    <span className={`asin-validation ${isValidASIN(data.asins[idx]) ? 'valid' : 'invalid'}`}>
                      {isValidASIN(data.asins[idx]) ? <Check size={12} /> : <X size={12} />}
                      {isValidASIN(data.asins[idx]) ? 'Valid' : 'Invalid'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Q&A Module Special Editor */}
        {module.isQA && (
          <div className="qa-editor">
            <label className="module-label">
              Q&A Pairs (3 questions)
              <span className="label-hint">— Total limit: 750 characters</span>
            </label>
            <div className="qa-pairs">
              {(data.qaItems || []).map((item, idx) => (
                <div key={idx} className="qa-pair">
                  <div className="qa-pair-header">
                    <span className="qa-number">Q{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    className="qa-question-input"
                    placeholder={`Question ${idx + 1}...`}
                    value={item.question || ''}
                    onChange={(e) => {
                      const newQA = [...(data.qaItems || [])]
                      newQA[idx] = { ...newQA[idx], question: e.target.value }
                      updateModuleData(module.instanceId, 'qaItems', newQA)
                    }}
                  />
                  <textarea
                    className="qa-answer-input"
                    placeholder={`Answer ${idx + 1}...`}
                    value={item.answer || ''}
                    onChange={(e) => {
                      const newQA = [...(data.qaItems || [])]
                      newQA[idx] = { ...newQA[idx], answer: e.target.value }
                      updateModuleData(module.instanceId, 'qaItems', newQA)
                    }}
                    rows={3}
                  />
                </div>
              ))}
            </div>
            <div className="qa-char-counter">
              <span className={`char-count ${getQACharCount(data.qaItems) > 750 ? 'over-limit' : ''}`}>
                {getQACharCount(data.qaItems)}/750 characters
              </span>
              {getQACharCount(data.qaItems) > 750 && (
                <span className="char-warning">Over character limit!</span>
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm ai-generate-btn"
              onClick={() => generateModuleContent(module.instanceId)}
              disabled={!!generatingModules[module.instanceId]}
            >
              {generatingModules[module.instanceId] ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              AI Generate Q&A
            </button>
          </div>
        )}

        {/* Standard Text Fields (headline/body) */}
        {module.hasText && !module.isQA && !module.isAsinShowcase && (
          <div className="module-text-fields">
            {module.textFields?.includes('headline') && (
              <div className="module-field">
                <label className="module-label">Headline</label>
                <input
                  type="text"
                  placeholder="Enter headline..."
                  value={data.headline || ''}
                  onChange={(e) => updateModuleData(module.instanceId, 'headline', e.target.value)}
                  maxLength={module.headlineLimit || 30}
                />
                <span className="char-count">{(data.headline || '').length}/{module.headlineLimit || 30}</span>
              </div>
            )}

            {module.textFields?.includes('body') && (
              <div className="module-field">
                <label className="module-label">Body Text</label>
                <textarea
                  placeholder="Enter body text..."
                  value={data.body || ''}
                  onChange={(e) => updateModuleData(module.instanceId, 'body', e.target.value)}
                  maxLength={module.bodyLimit || 135}
                  rows={module.bodyLimit > 200 ? 6 : 3}
                />
                <span className="char-count">{(data.body || '').length}/{module.bodyLimit || 135}</span>
              </div>
            )}

            {/* ASIN Showcase headline */}
            {module.isAsinShowcase && module.textFields?.includes('headline') && (
              <div className="module-field">
                <label className="module-label">Showcase Headline</label>
                <input
                  type="text"
                  placeholder="e.g., Our Best Sellers"
                  value={data.headline || ''}
                  onChange={(e) => updateModuleData(module.instanceId, 'headline', e.target.value)}
                  maxLength={30}
                />
                <span className="char-count">{(data.headline || '').length}/30</span>
              </div>
            )}

            <button
              className="btn btn-secondary btn-sm ai-generate-btn"
              onClick={() => generateModuleContent(module.instanceId)}
              disabled={!!generatingModules[module.instanceId]}
            >
              {generatingModules[module.instanceId] ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              AI Generate Content
            </button>
          </div>
        )}

        {/* ASIN Showcase Headline (separate since it has isAsinShowcase flag) */}
        {module.isAsinShowcase && (
          <div className="module-text-fields">
            <div className="module-field">
              <label className="module-label">Showcase Headline</label>
              <input
                type="text"
                placeholder="e.g., Our Best Sellers"
                value={data.headline || ''}
                onChange={(e) => updateModuleData(module.instanceId, 'headline', e.target.value)}
                maxLength={30}
              />
              <span className="char-count">{(data.headline || '').length}/30</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render module preview
  const renderModulePreview = (module) => {
    const data = moduleData[module.instanceId] || {}

    if (module.isQA) {
      return (
        <div className="brand-preview-card brand-preview-qa">
          <h4 className="preview-card-title">Q&A</h4>
          {(data.qaItems || []).map((item, idx) => (
            item.question && (
              <div key={idx} className="preview-qa-item">
                <strong>Q: {item.question}</strong>
                <p>A: {item.answer || '...'}</p>
              </div>
            )
          ))}
        </div>
      )
    }

    if (module.isAsinShowcase) {
      return (
        <div className="brand-preview-card brand-preview-asin">
          {data.headline && <h4 className="preview-card-title">{data.headline}</h4>}
          <div className="preview-asin-grid">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="preview-asin-item">
                {data.images?.[idx] ? (
                  <img src={data.images[idx].preview} alt={`Product ${idx + 1}`} />
                ) : (
                  <div className="preview-placeholder-sm">
                    <ShoppingBag size={16} />
                  </div>
                )}
                {data.asins?.[idx] && <span className="preview-asin-label">{data.asins[idx]}</span>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (module.type === 'carousel-background') {
      return (
        <div className="brand-preview-card brand-preview-bg">
          {data.images?.[0] ? (
            <img src={data.images[0].preview} alt="Background" className="preview-bg-image" />
          ) : (
            <div className="preview-bg-placeholder">
              <Image size={32} />
              <span>1464 x 625</span>
            </div>
          )}
          <div className="preview-bg-overlay">
            <h3>{data.headline || 'Brand Headline'}</h3>
            <p>{data.body || 'Brand story text...'}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="brand-preview-card">
        {data.images?.[0] ? (
          <img src={data.images[0].preview} alt="Preview" />
        ) : (
          <div className="preview-placeholder">
            <Image size={24} />
            <span>{module.dimensions}</span>
          </div>
        )}
        {module.hasText && (
          <div className="preview-text">
            {data.headline && <h4>{data.headline}</h4>}
            {data.body && <p>{data.body}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="aplus-content-page aplus-layout-vertical brand-story-page">
      {/* Top Toolbar */}
      <div className="aplus-toolbar">
        <div className="toolbar-row toolbar-main">
          <div className="toolbar-left">
            <h1>Brand Story Creator</h1>
            <span className="brand-story-badge">Carousel Format</span>
          </div>
          <div className="toolbar-center">
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
            <div className="asin-input-compact">
              <Search size={16} />
              <input
                type="text"
                placeholder="Enter ASIN"
                value={asinValue}
                onChange={(e) => { setAsinValue(e.target.value.toUpperCase()); setProduct(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleAsinSearch()}
                maxLength={10}
              />
              {asinValue && (
                <span className={`asin-status ${isValidASIN(asinValue) ? 'valid' : 'invalid'}`}>
                  {isValidASIN(asinValue) ? <Check size={14} /> : <X size={14} />}
                </span>
              )}
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
                {product.brand ? `${product.brand} · ` : ''}{(product.title || '').slice(0, 45)}{(product.title || '').length > 45 ? '…' : ''}
              </span>
            )}
            {asinError && <span style={{ color: '#e74c3c', fontSize: 12 }}>{asinError}</span>}
            <span className="module-counter-badge">
              {selectedModules.length}/{maxModules} modules
            </span>
          </div>
          <div className="toolbar-right">
            <button
              className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            {selectedModules.length > 0 && (
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
            <button className="btn btn-sm btn-secondary" disabled={selectedModules.length === 0} onClick={handleSave}>
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
            <button className="btn btn-sm btn-primary" disabled={!hasMinModules} onClick={handleExport}>
              <Download size={16} />
              Export
            </button>
            {/* Guidelines */}
            <div className="guidelines-dropdown">
              <button
                className={`btn-icon-circle ${showGuidelines ? 'active' : ''}`}
                onClick={() => setShowGuidelines(!showGuidelines)}
                title="Brand Story Guidelines"
              >
                <Info size={18} />
              </button>
              {showGuidelines && (
                <div className="guidelines-popup">
                  <div className="guidelines-popup-header">
                    <h4>Brand Story Guidelines</h4>
                    <button className="popup-close" onClick={() => setShowGuidelines(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="guidelines-popup-content">
                    {BRAND_STORY_GUIDELINES.map((guideline, idx) => (
                      <div
                        key={idx}
                        className={`guideline-row ${guideline.icon === '✓' ? 'do' : 'dont'}`}
                      >
                        <span className="guideline-icon">{guideline.icon}</span>
                        <span>{guideline.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module Library Row */}
        <div className="toolbar-row toolbar-modules">
          <div className="modules-scroll">
            {BRAND_STORY_MODULES.map(module => (
              <button
                key={module.id}
                className={`module-chip ${!canAddModule ? 'disabled' : ''} ${module.isMandatory ? 'mandatory' : ''}`}
                onClick={() => canAddModule && addModule(module.id)}
                disabled={!canAddModule}
                title={`${module.name} (${module.dimensions})${module.isMandatory ? ' — Mandatory' : ''}`}
              >
                <span className="chip-icon">{module.preview}</span>
                <span className="chip-name">{module.name}</span>
                <span className="chip-size">{module.dimensions}</span>
                {module.isMandatory ? (
                  <Lock size={14} className="chip-lock" />
                ) : (
                  <Plus size={14} className="chip-add" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Builder */}
      <div className="aplus-content-area">
        {previewMode ? (
          <div className="brand-story-preview">
            <div className="brand-story-preview-header">
              <h3>Brand Story Preview</h3>
              <p>Scroll horizontally to see all cards as they appear on Amazon</p>
            </div>
            <div className="brand-story-carousel">
              {selectedModules.map(module => (
                <div key={module.instanceId} className={`brand-carousel-card card-${module.type}`}>
                  {renderModulePreview(module)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="modules-container-full">
            {selectedModules.map((module, index) => (
              <div
                key={module.instanceId}
                className={`module-item-full ${draggedIndex === index ? 'dragging' : ''} ${expandedModule === module.instanceId ? 'expanded' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="module-header-full">
                  <div className="module-drag-handle">
                    <GripVertical size={18} />
                  </div>
                  <span className="module-number">{index + 1}</span>
                  <span className="module-icon-lg">{module.preview}</span>
                  <div className="module-title-info">
                    <span className="module-name-lg">
                      {module.name}
                      {module.isMandatory && <span className="mandatory-tag">Required</span>}
                    </span>
                    <span className="module-dims">{module.dimensions}</span>
                  </div>
                  <div className="module-actions-full">
                    <button
                      className="btn-icon-sm"
                      onClick={() => moveModule(index, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      className="btn-icon-sm"
                      onClick={() => moveModule(index, 'down')}
                      disabled={index === selectedModules.length - 1}
                      title="Move down"
                    >
                      <ChevronDown size={18} />
                    </button>
                    <button
                      className="btn-icon-sm expand-btn"
                      onClick={() => setExpandedModule(
                        expandedModule === module.instanceId ? null : module.instanceId
                      )}
                      title={expandedModule === module.instanceId ? 'Collapse' : 'Expand'}
                    >
                      {expandedModule === module.instanceId ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                    <button
                      className="btn-icon-sm delete-btn"
                      onClick={() => removeModule(module.instanceId)}
                      title={module.isMandatory ? 'Cannot remove mandatory module' : 'Remove module'}
                      disabled={module.isMandatory && selectedModules.filter(m => m.type === 'carousel-background').length <= 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {expandedModule === module.instanceId && (
                  <div className="module-content-full">
                    {renderModuleEditor(module)}
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

export default BrandStory
