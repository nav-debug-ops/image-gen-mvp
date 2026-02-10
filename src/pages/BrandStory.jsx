import { useState, useCallback, useEffect } from 'react'
import { PRODUCT_CATEGORIES } from '../constants/productCategories'
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
  const prompts = {
    'carousel-background': `Create a stunning brand story carousel background for ${campaignData.brandName}.
Brand Story: ${campaignData.brandStory}
Mission: ${campaignData.brandMission}
Style: Cinematic, premium, brand-defining
Mood: Aspirational, trustworthy, authentic
Include: Brand essence imagery, lifestyle context, subtle product presence
Target: ${campaignData.targetAudience}
Tone: ${campaignData.toneOfVoice}
Note: This is the hero background image — must be visually striking
Dimensions: 1464x625 pixels (full-width carousel background)`,

    'focus-image': `Create a brand focus image for ${campaignData.brandName}.
Purpose: Showcase the brand creator, team, or defining product line
Brand Story: ${campaignData.brandStory}
Values: ${campaignData.brandValues.join(', ')}
Style: Authentic, personal, premium quality
Show: The people or craftsmanship behind the brand
Emotional appeal: ${campaignData.emotionalTriggers[0]}
Target: ${campaignData.targetAudience}
Dimensions: 362x453 pixels (portrait format)`,

    'logo-description': `Create a professional brand logo display for ${campaignData.brandName}.
Style: Clean, professional, brand-consistent
Background: White or transparent
Requirements:
- High resolution logo centered
- Adequate padding around logo
- Horizontal/landscape format
- Consistent with brand identity
Brand values: ${campaignData.brandValues.join(', ')}
Dimensions: 315x145 pixels (landscape logo format)`,

    'asin-showcase': `Create 4 product showcase images for ${campaignData.brandName}'s top products:
${campaignData.topProducts.map((p, i) => `Product ${i + 1}: ${p}`).join('\n')}
Style: Clean product photography, white background
Purpose: Cross-sell and drive traffic to other listings
Each image: Professional, consistent lighting, product-focused
Target: ${campaignData.targetAudience}
Dimensions: 166x182 pixels each (small product thumbnails)`,

    'brand-qa': `Write Brand Q&A content for ${campaignData.brandName}.
Brand: ${campaignData.brandName}
Tone: ${campaignData.toneOfVoice}

Suggested Q&A pairs:
Q1: "What makes ${campaignData.brandName} different?"
A1: Focus on ${campaignData.brandValues[0]} and ${campaignData.brandValues[1]}

Q2: "What is ${campaignData.brandName}'s mission?"
A2: ${campaignData.brandMission}

Q3: "Who are ${campaignData.brandName} products designed for?"
A3: ${campaignData.targetAudience}

Style: Helpful, authoritative, brand-consistent
Total character limit: 750 characters for all Q&A combined
Note: No pricing, no superlatives, no competitor mentions`
  }

  return prompts[moduleType] || `Create professional brand story content for ${campaignData.brandName}.
Brand: ${campaignData.brandName}
Target: ${campaignData.targetAudience}
Style: Premium, authentic, brand-consistent`
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [asinValue, setAsinValue] = useState('')
  const [productCategory, setProductCategory] = useState('')

  // Validation
  const isValidASIN = (asin) => /^[A-Z0-9]{10}$/i.test(asin)
  const maxModules = 19
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
          aiPrompt: generateBrandStoryPrompt('carousel-background'),
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
        aiPrompt: generateBrandStoryPrompt(moduleType),
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

  // Generate AI content
  const generateModuleContent = async (instanceId) => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const module = selectedModules.find(m => m.instanceId === instanceId)

    if (module?.type === 'brand-qa') {
      updateModuleData(instanceId, 'qaItems', [
        { question: `What makes ${CREATIVE_CAMPAIGN_DATA.brandName} different?`, answer: `We combine ${CREATIVE_CAMPAIGN_DATA.brandValues[0].toLowerCase()} with ${CREATIVE_CAMPAIGN_DATA.brandValues[1].toLowerCase()} to deliver exceptional products.` },
        { question: `What is ${CREATIVE_CAMPAIGN_DATA.brandName}'s mission?`, answer: CREATIVE_CAMPAIGN_DATA.brandMission },
        { question: `Who are ${CREATIVE_CAMPAIGN_DATA.brandName} products for?`, answer: CREATIVE_CAMPAIGN_DATA.targetAudience }
      ])
    } else {
      updateModuleData(instanceId, 'headline', `${CREATIVE_CAMPAIGN_DATA.brandName} — ${CREATIVE_CAMPAIGN_DATA.brandValues[0]}`)
      updateModuleData(instanceId, 'body', CREATIVE_CAMPAIGN_DATA.brandStory)
    }

    setIsGenerating(false)
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
            disabled={isGenerating || !data.referenceImage}
            onClick={() => generateModuleContent(module.instanceId)}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate with AI
              </>
            )}
          </button>
          {!data.referenceImage && (
            <p className="ai-prompt-hint">Upload a reference image first to enable AI generation</p>
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
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
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
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
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
                onChange={(e) => setAsinValue(e.target.value.toUpperCase())}
                maxLength={10}
              />
              {asinValue && (
                <span className={`asin-status ${isValidASIN(asinValue) ? 'valid' : 'invalid'}`}>
                  {isValidASIN(asinValue) ? <Check size={14} /> : <X size={14} />}
                </span>
              )}
            </div>
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
            <button className="btn btn-sm btn-secondary" disabled={selectedModules.length === 0}>
              <Save size={16} />
              Save
            </button>
            <button className="btn btn-sm btn-primary" disabled={!hasMinModules}>
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
