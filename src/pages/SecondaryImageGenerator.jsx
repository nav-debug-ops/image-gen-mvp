import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  FileText,
  Image,
  Download,
  RefreshCw,
  Save,
  Check,
  X,
  Loader2,
  Sparkles,
  LayoutGrid,
  Users,
  BarChart3,
  Zap,
  Target,
  Heart,
  Shield,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Search,
  Maximize2,
  Pencil,
  BookmarkCheck,
  ExternalLink
} from 'lucide-react'
import { generateImage } from '../api/imageGen'
import { lookupASIN } from '../api/asin'
import { PRODUCT_CATEGORIES } from '../constants/productCategories'
import KeywordInputPanel from '../components/KeywordInputPanel'

// Secondary Image Types
const SECONDARY_IMAGE_TYPES = [
  {
    id: 'benefits',
    name: 'Benefits Infographic',
    icon: Heart,
    description: 'Highlight key product benefits',
    category: 'infographic',
    color: '#22C55E'
  },
  {
    id: 'features',
    name: 'Features Infographic',
    icon: Zap,
    description: 'Showcase product features',
    category: 'infographic',
    color: '#3B82F6'
  },
  {
    id: 'comparison',
    name: 'Comparison Infographic',
    icon: BarChart3,
    description: 'Compare with competitors or before/after',
    category: 'infographic',
    color: '#F59E0B'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Image',
    icon: Users,
    description: 'Product in real-life context',
    category: 'lifestyle',
    color: '#EC4899'
  },
  {
    id: 'quality',
    name: 'Quality & Trust',
    icon: Shield,
    description: 'Certifications, materials, guarantees',
    category: 'infographic',
    color: '#8B5CF6'
  },
  {
    id: 'howto',
    name: 'How To Use',
    icon: Target,
    description: 'Step-by-step usage guide',
    category: 'infographic',
    color: '#06B6D4'
  }
]

// Aspect ratios for secondary images
const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square', width: 2000, height: 2000, recommended: true },
  { id: '4:3', name: 'Portrait', width: 2000, height: 1500 },
  { id: '3:2', name: 'Rectangle', width: 2000, height: 1333 }
]

// ─── Rich prompt builder ───────────────────────────────────────────────────
// Generates a 180-250 word professional Amazon listing prompt per image type.
// Pass `keywords` (string[]) to inject user-curated chips into the prompt.
function buildPromptForType(typeId, data, keywords = []) {
  if (!data) return ''
  const { productName } = data
  const kwStr = keywords.length > 0 ? keywords.join(', ') : null
  const b3 = kwStr || (data.benefits || []).slice(0, 3).join(', ') || 'premium quality, lasting durability, trusted performance'
  const f4 = kwStr || (data.features  || []).slice(0, 4).join(', ') || 'premium materials, precision construction, thoughtful design, long-lasting quality'
  const usp = kwStr || (data.uniqueSellingPoints || data.benefits || []).slice(0, 3).join(', ') || 'superior quality, outstanding value, proven results'
  const steps = kwStr || 'simple setup, intuitive use, satisfying results'
  const quality = kwStr || 'premium grade materials, built to last, quality certified'
  const lifestyle = kwStr || 'active everyday use, modern lifestyle, trusted by customers'

  const GLOBAL = `Product must match reality exactly — accurate proportions, correct color, real texture, crisp studio detail. All on-image text sits inside a semi-transparent rounded-rectangle card with soft drop shadow. Headline up to ten words, bold deep navy. Subheadline one short line in dark grey lighter weight. Clean geometric sans-serif typography fully readable on mobile. Thin-line teal accent icons with rounded corners where used. No watermarks. No borders. Ultra sharp render.`

  switch (typeId) {
    case 'benefits':
      return `Professional Amazon listing infographic for "${productName}". Strategic goal: answer the buyer's biggest functional doubt using a mixed photo-plus-graphic layout with strong visual hierarchy and large readable callouts. The product is anchored center-left, shot with crisp studio lighting, accurate color and real texture, soft shadow beneath. Three benefit callout cards float alongside as semi-transparent rounded-rectangle panels with soft drop shadow. Each card carries a minimal thin-line teal accent icon and two lines of text: a bold navy headline of up to six words and a lighter dark-grey subline. Benefits highlighted: ${b3}. Background is a premium soft gradient — warm white fading to very light grey — with subtle depth layers creating a three-dimensional feel. Clean arrows or fine connecting lines flow from each card toward the product. Visual hierarchy flows left to right with generous whitespace. Layout tone: professional Amazon agency, not basic template. ${GLOBAL}`

    case 'features':
      return `Professional Amazon features infographic for "${productName}". Strategic goal: showcase technical product details using a creative, visually engaging layout that blends studio photography with modern interface-style graphic elements. The product sits at center, photographed with photorealistic studio quality — correct proportions, real surface texture, true color, sharp edges. Four floating UI-style cards are positioned at each quadrant, each a semi-transparent rounded-rectangle panel with soft inner shadow, a thin-line teal accent icon, a bold navy feature label up to six words, and a short grey descriptor subline. Features: ${f4}. Subtle clean arrows or fine lines connect each card to the relevant part of the product. Background: premium soft gradient warm white to pale grey with gentle depth layers. No flat backgrounds. Typography: clean geometric sans-serif, bold, highly legible at mobile scale. All cards share consistent corner radius, alignment, and shadow depth. Visual tone: premium tech product reveal — sophisticated, conversion-focused. ${GLOBAL}`

    case 'comparison':
      return `Professional Amazon comparison infographic for "${productName}". Strategic goal: build confident purchase decisions by visually proving clear superiority over generic alternatives. Split composition — left side labeled "Our Product" with the product in crisp studio quality, accurate color, real texture, soft drop shadow. Right side shows a de-emphasized muted representation of a generic alternative. Between them: a vertical comparison column with three to four benefit rows. Each row uses a thin-line teal checkmark for our product and a subtle muted X for competitors. Row labels are short, punchy, bold navy. Advantages shown: ${usp}. Background: clean premium gradient off-white to pale blue-grey. Semi-transparent panel cards frame the comparison column with soft shadow. Typography: bold geometric sans-serif, deep navy headlines, dark grey supporting text. Visual hierarchy flows top to bottom clearly. Tone: calm, confident, premium — not aggressive. No clutter. No excessive labels. Every element points toward one conclusion: this is the better choice. ${GLOBAL}`

    case 'lifestyle':
      return `Professional Amazon lifestyle photograph for "${productName}". Strategic goal: create a warm aspirational real-life moment showing a real person using this product naturally in their daily environment. Scene context: ${lifestyle}. The person is 28 to 40 years old, dressed in clean casual clothing. Their face shows natural micro-imperfections — soft pores, slight asymmetry, relaxed facial muscles, genuine expression of calm satisfaction. No plastic skin, no waxy finish, no overly perfect symmetry. The product is clearly visible and in active use, photographed with accurate color, real texture, and correct proportions. The space feels lived-in but tidy: a bright modern kitchen, airy living room, or clean bathroom — natural window light flooding from one side, warm color temperature, balanced exposure. Lower third of the frame: a semi-transparent rounded-rectangle text card with soft shadow containing a bold navy headline up to ten words describing the key benefit shown and one short dark-grey subheadline. No stock photo stiffness. No forced poses. Authentic emotional resonance. Premium clean realism. ${GLOBAL}`

    case 'quality':
      return `Professional Amazon macro close-up quality shot for "${productName}". Strategic goal: eliminate any material doubt by proving craftsmanship, surface finish, and build quality at extreme close range. Quality signals highlighted: ${quality}. Camera is positioned very close to the product surface — capturing real texture, stitching or structural detail, material weave, surface finish, and construction precision at a level that product copy alone cannot convey. Lighting: soft directional studio key light plus a subtle rim light bringing out three-dimensional depth in every fiber, edge, and joint. Colors accurate and naturally saturated. Background is a very shallow depth-of-field soft blur — premium neutral off-white or warm grey. Product occupies 70 to 80 percent of the frame. Alongside the macro shot: two to three floating semi-transparent rounded-rectangle cards with soft shadow, each with a bold navy headline up to six words and a short dark-grey subline. Thin-line teal accent icons beside each card. The result: a luxury craftsmanship proof shot. ${GLOBAL}`

    case 'howto':
      return `Professional Amazon how-to-use infographic for "${productName}". Strategic goal: remove purchase hesitation by making the product feel immediately simple, intuitive, and rewarding through a clean numbered step-by-step visual guide. Usage steps: ${steps}. Layout: three to four numbered steps in a horizontal or vertical flow. Each step contains a circular teal numbered icon with a thin-line illustration, a short bold navy step headline up to six words, and one supporting dark-grey subline describing the action. Steps progress naturally from setup or first use through to the satisfying result. The product appears in at least one step — photographed with crisp studio quality, accurate color, real texture, correct proportions. Background: clean premium soft gradient warm white to very light grey with subtle depth layers and gentle shadows beneath each step card. Each step card is a semi-transparent rounded-rectangle panel with soft drop shadow, consistent corner radius, and aligned text. No flat clip-art style. No harsh borders. Visual language: premium instructional design that builds confidence and excitement. ${GLOBAL}`

    default:
      return `Professional Amazon product secondary image for "${productName}". Ultra sharp studio quality photography with accurate color, real texture, and premium clean background. On-image text callouts in bold navy on semi-transparent rounded-rectangle cards with soft shadow. Clean geometric sans-serif typography. Fully readable on mobile. ${GLOBAL}`
  }
}
// ───────────────────────────────────────────────────────────────────────────

// Mock campaign summary data (would come from Creative Campaigns)
const MOCK_CAMPAIGN_SUMMARY = {
  productName: 'Premium Stainless Steel Water Bottle',
  category: 'Sports & Outdoors',
  asin: 'B08N5WRWNW',
  benefits: [
    'Keeps drinks cold for 24 hours',
    'Double-wall vacuum insulation',
    'BPA-free and eco-friendly',
    'Leak-proof lid design',
    'Fits standard cup holders'
  ],
  features: [
    '32oz capacity',
    'Food-grade stainless steel',
    'Wide mouth opening',
    'Powder-coated finish',
    'Built-in carrying loop'
  ],
  painPoints: [
    'Competitors have short insulation time',
    'Other bottles leak easily',
    'Plastic bottles harm environment'
  ],
  targetAudience: {
    primary: 'Busy professionals aged 28-42',
    lifestyle: 'Health-conscious, active, eco-aware',
    useCase: 'Gym, office, outdoor activities'
  },
  competitorWeaknesses: [
    'Poor insulation',
    'Flimsy construction',
    'No warranty'
  ],
  uniqueSellingPoints: [
    '24-hour cold retention (vs 6-hour competitors)',
    'Lifetime warranty',
    'Premium materials'
  ]
}

function SecondaryImageGenerator() {
  // ASIN lookup state
  const [asin, setAsin] = useState('')
  const [asinLookupLoading, setAsinLookupLoading] = useState(false)
  const [asinProduct, setAsinProduct] = useState(null)
  const [asinError, setAsinError] = useState(null)
  const [referenceImageUrl, setReferenceImageUrl] = useState(null)
  const asinInputRef = useRef(null)

  // Campaign data state
  const [campaignData, setCampaignData] = useState(null)
  const [hasCampaignData, setHasCampaignData] = useState(false)

  // Configuration state
  const [productCategory, setProductCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [quantity, setQuantity] = useState(1)

  // Prompts for each image type (user can edit these)
  const [typePrompts, setTypePrompts] = useState({})

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [generatedImages, setGeneratedImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [error, setError] = useState(null)

  // Keyword panel state: { [typeId]: string[] }
  const [mergedKeywords, setMergedKeywords] = useState({})

  // Lightbox state
  const [lightboxImg, setLightboxImg] = useState(null)
  const [saveStatus, setSaveStatus] = useState({})
  const [showEditorMenu, setShowEditorMenu] = useState(false)
  const [regeneratingIds, setRegeneratingIds] = useState(new Set())

  const EDITORS = [
    { id: 'photopea', name: 'Photopea',      desc: 'Free Photoshop alternative', url: 'https://www.photopea.com' },
    { id: 'canva',    name: 'Canva',          desc: 'Easy online design tool',    url: 'https://www.canva.com/photo-editor/' },
    { id: 'adobe',    name: 'Adobe Express',  desc: 'Quick photo editing',        url: 'https://express.adobe.com' },
  ]

  const handleOpenLightbox = (img) => {
    setLightboxImg(img)
    setShowEditorMenu(false)
  }

  const handleCloseLightbox = () => {
    setLightboxImg(null)
    setShowEditorMenu(false)
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
      a.download = `${img.typeName?.replace(/\s+/g, '-').toLowerCase() || 'image'}-${img.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleEditInEditor = async (img, editorUrl) => {
    await handleDownloadLightbox(img)
    window.open(editorUrl, '_blank', 'noopener')
    setShowEditorMenu(false)
  }

  const handleRegenerateImage = async (img) => {
    setRegeneratingIds(prev => new Set(prev).add(img.id))
    try {
      const selectedRatio = ASPECT_RATIOS.find(r => r.id === img.aspectRatio) || ASPECT_RATIOS[0]
      const result = await generateImage(img.prompt, {
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
        timestamp: new Date().toISOString(),
      }
      setGeneratedImages(prev => prev.map(i => i.id === img.id ? newImg : i))
      // If this image is open in the lightbox, update it there too
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

  // ASIN lookup handlers
  const handleAsinSearch = async () => {
    if (!asin.trim()) return
    setAsinLookupLoading(true)
    setAsinError(null)
    setAsinProduct(null)
    try {
      const product = await lookupASIN(asin.trim().toUpperCase())
      setAsinProduct(product)
    } catch (err) {
      setAsinError(err.message || 'Failed to look up product')
    } finally {
      setAsinLookupLoading(false)
    }
  }

  const handleConfirmProduct = () => {
    const bullets = asinProduct.bullets || []
    const newData = {
      productName: asinProduct.title,
      category: asinProduct.category || '',
      asin: asin.trim().toUpperCase(),
      benefits: bullets,
      features: bullets,
      painPoints: [],
      targetAudience: {
        primary: 'Amazon customers',
        lifestyle: '',
        useCase: ''
      },
      competitorWeaknesses: [],
      uniqueSellingPoints: bullets.slice(0, 3)
    }
    setCampaignData(newData)
    setHasCampaignData(true)
    setReferenceImageUrl(asinProduct.image_url || null)
    // Regenerate prompts using new product data (state not yet updated, pass newData directly)
    const freshPrompts = {}
    if (selectedType) {
      freshPrompts[selectedType] = buildPromptForType(selectedType, newData)
    }
    setTypePrompts(freshPrompts)
  }

  const handleRejectProduct = () => {
    setAsinProduct(null)
    setAsin('')
    setCampaignData(null)
    setHasCampaignData(false)
    setReferenceImageUrl(null)
    setTypePrompts({})
    setTimeout(() => asinInputRef.current?.focus(), 50)
  }

  // Called when user clicks "Merge & Use Selected" in the keyword panel
  const handleKeywordsMerge = (typeId, keywords) => {
    setMergedKeywords(prev => ({ ...prev, [typeId]: keywords }))
    // Rebuild the prompt immediately with the new keywords
    const newPrompt = buildPromptForType(typeId, campaignData, keywords)
    setTypePrompts(prev => ({ ...prev, [typeId]: newPrompt }))
  }

  // Generate default prompt for a given type based on campaign data
  const getDefaultPrompt = (typeId) => buildPromptForType(typeId, campaignData, mergedKeywords[typeId] || [])

  // Handle image type selection change
  const handleTypeChange = (typeId) => {
    setSelectedType(typeId)
    // Auto-generate prompt if not already set
    if (typeId && !typePrompts[typeId]) {
      setTypePrompts(prev => ({
        ...prev,
        [typeId]: getDefaultPrompt(typeId)
      }))
    }
  }

  // Update prompt for a specific type
  const updateTypePrompt = (typeId, newPrompt) => {
    setTypePrompts(prev => ({
      ...prev,
      [typeId]: newPrompt
    }))
  }

  // Reset prompt to auto-generated default
  const resetToDefault = (typeId) => {
    setTypePrompts(prev => ({
      ...prev,
      [typeId]: getDefaultPrompt(typeId)
    }))
  }

  // Copy prompt to clipboard
  const copyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt)
  }

  // Toggle image selection
  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  // Download image
  const downloadImage = async (img) => {
    try {
      const response = await fetch(img.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${img.typeName.replace(/\s+/g, '-').toLowerCase()}-${img.id}.png`
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
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Generate images from prompts
  const handleGenerate = async () => {
    if (!selectedType || !typePrompts[selectedType]) {
      setError('Please select an image type and ensure prompt is ready')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImages([])
    setSelectedImages([])

    const imageType = SECONDARY_IMAGE_TYPES.find(t => t.id === selectedType)

    try {
      const results = []
      const totalImages = quantity

      for (let i = 0; i < totalImages; i++) {
        setProgress({
          current: i + 1,
          total: totalImages,
          percentage: Math.round(((i + 1) / totalImages) * 100),
          message: `Generating ${imageType.name} ${i + 1}/${totalImages}...`
        })

        const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio)
        const result = await generateImage(typePrompts[selectedType], {
          width: selectedRatio?.width || 2000,
          height: selectedRatio?.height || 2000,
          aspectRatio: aspectRatio,
          referenceImageUrl: referenceImageUrl || undefined,
        }, (p) => {
          setProgress(prev => ({ ...prev, ...p }))
        })

        const newImage = {
          id: Date.now() + i,
          url: result.url,
          typeName: imageType.name,
          typeId: selectedType,
          typeColor: imageType.color,
          prompt: typePrompts[selectedType],
          variation: i + 1,
          provider: result.provider,
          aspectRatio,
          timestamp: new Date().toISOString()
        }

        results.push(newImage)
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

  const canGenerateImages = hasCampaignData && selectedType && typePrompts[selectedType] && !isGenerating

  return (
    <div className="secondary-image-generator">
      <header className="page-header">
        <div>
          <h1>Secondary Image Generator</h1>
          <p>Generate infographics and lifestyle images from your campaign data</p>
        </div>
      </header>

      <div className="generator-layout secondary-layout">
        {/* Left Panel - Configuration */}
        <div className="generator-sidebar">
          {/* ASIN Lookup */}
          <div className="config-section">
            <h3>
              <Search size={18} />
              Product ASIN
            </h3>
            {!asinProduct ? (
              <>
                <div className="asin-search-row">
                  <input
                    ref={asinInputRef}
                    type="text"
                    className="config-input"
                    placeholder="e.g. B08N5WRWNW"
                    value={asin}
                    onChange={(e) => setAsin(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsinSearch()}
                    maxLength={10}
                  />
                  <button
                    className="asin-search-btn"
                    onClick={handleAsinSearch}
                    disabled={asinLookupLoading || !asin.trim()}
                  >
                    {asinLookupLoading ? <Loader2 size={15} className="spin" /> : <Search size={15} />}
                  </button>
                </div>
                {asinError && <div className="asin-lookup-error">{asinError}</div>}
              </>
            ) : (
              <div className="asin-product-card">
                <div className="asin-product-header">
                  {asinProduct.image_url && (
                    <img src={asinProduct.image_url} alt="Product" className="asin-product-img" />
                  )}
                  <div className="asin-product-body">
                    {asinProduct.brand && (
                      <div className="asin-product-brand">{asinProduct.brand}</div>
                    )}
                    <div className="asin-product-title">{asinProduct.title}</div>
                  </div>
                </div>
                {asinProduct.bullets?.length > 0 && (
                  <ul className="asin-product-bullets">
                    {asinProduct.bullets.slice(0, 2).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {!hasCampaignData ? (
                  <div className="asin-product-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleConfirmProduct}>
                      <Check size={14} /> Yes, this is my product
                    </button>
                    <button className="asin-change-btn" onClick={handleRejectProduct}>
                      <X size={14} /> Try another
                    </button>
                  </div>
                ) : (
                  <div className="asin-confirmed-badge">
                    <Check size={14} /> Product confirmed — AI will reference this image
                    <button className="asin-change-btn" onClick={handleRejectProduct} style={{ marginTop: 6 }}>
                      Change product
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campaign Summary */}
          <div className="config-section campaign-summary">
            <h3>
              <FileText size={18} />
              Campaign Summary
            </h3>
            {hasCampaignData ? (
              <div className="summary-content">
                <div className="summary-item">
                  <label>Product</label>
                  <span>{campaignData.productName}</span>
                </div>
                <div className="summary-item">
                  <label>Category</label>
                  <span>{campaignData.category || '—'}</span>
                </div>
                <div className="summary-item">
                  <label>Benefits</label>
                  <span>{campaignData.benefits.length} identified</span>
                </div>
                <div className="summary-item">
                  <label>Features</label>
                  <span>{campaignData.features.length} identified</span>
                </div>
              </div>
            ) : (
              <div className="no-campaign">
                <p>Enter an ASIN above to load product data</p>
              </div>
            )}
          </div>

          {/* Product Category */}
          <div className="config-section">
            <h3>Product Category</h3>
            <div className="config-group">
              <select
                className="category-dropdown"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Type Selection */}
          <div className="config-section">
            <h3>
              <LayoutGrid size={18} />
              Select Image Type
            </h3>
            <div className="config-group">
              <label>Image Type</label>
              <select
                className="config-select"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="">-- Select an image type --</option>
                {SECONDARY_IMAGE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Aspect Ratio */}
          <div className="config-section">
            <h3>Configuration</h3>

            <div className="config-group">
              <label>
                <span>Quantity</span>
                <span className="config-value">{quantity}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="config-group">
              <label>Aspect Ratio</label>
              <select
                className="config-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                {ASPECT_RATIOS.map(ratio => (
                  <option key={ratio.id} value={ratio.id}>
                    {ratio.id} {ratio.name} {ratio.recommended ? '(Recommended)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="total-images">
                Total: <strong>{quantity}</strong> image{quantity > 1 ? 's' : ''} to generate
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            className="btn btn-primary btn-large"
            onClick={handleGenerate}
            disabled={!canGenerateImages}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="spin" />
                Generating {progress?.current}/{progress?.total}...
              </>
            ) : (
              <>
                <Image size={18} />
                Generate {quantity} Image{quantity > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Center Panel - Prompt Editor */}
        <div className="prompts-section">
          <div className="prompts-header">
            <h3>
              <Edit3 size={18} />
              Prompt Editor
            </h3>
          </div>

          {!selectedType ? (
            <div className="prompts-empty">
              <Sparkles size={48} />
              <p>Select an image type to see the auto-generated prompt</p>
              <span>You can edit the prompt before generating</span>
            </div>
          ) : (
            <div className="prompt-editor-container">
              {(() => {
                const imageType = SECONDARY_IMAGE_TYPES.find(t => t.id === selectedType)
                return (
                  <div className="prompt-card active-prompt">
                    <div className="prompt-header">
                      <span
                        className="prompt-type-badge"
                        style={{ backgroundColor: imageType?.color }}
                      >
                        {imageType?.name}
                      </span>
                      <div className="prompt-actions">
                        <button
                          className="action-btn"
                          onClick={() => copyPrompt(typePrompts[selectedType] || '')}
                          title="Copy prompt"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => resetToDefault(selectedType)}
                          title="Reset to auto-generated prompt"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>

                    {hasCampaignData && (
                      <KeywordInputPanel
                        typeId={selectedType}
                        asinProduct={asinProduct}
                        onMerge={(kws) => handleKeywordsMerge(selectedType, kws)}
                      />
                    )}

                    <div className="prompt-edit-area">
                      <label className="prompt-label">
                        {mergedKeywords[selectedType]?.length > 0
                          ? `Prompt updated with ${mergedKeywords[selectedType].length} keywords (editable):`
                          : 'Auto-generated prompt from campaign data (editable):'}
                      </label>
                      <textarea
                        className="prompt-textarea"
                        value={typePrompts[selectedType] || ''}
                        onChange={(e) => updateTypePrompt(selectedType, e.target.value)}
                        rows={8}
                        placeholder="Enter your custom prompt or let it auto-generate from campaign data..."
                      />
                      <div className="prompt-char-count">
                        {(typePrompts[selectedType] || '').length} characters
                      </div>
                    </div>
                  </div>
                )
              })()}

              {error && <div className="error-message">{error}</div>}
            </div>
          )}

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
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    if (selectedImages.length === generatedImages.length) {
                      setSelectedImages([])
                    } else {
                      setSelectedImages(generatedImages.map(img => img.id))
                    }
                  }}
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
                  Download ({selectedImages.length})
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
              <span>Generate prompts first, then click Generate Images</span>
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
                  <img src={img.url} alt={img.typeName} />
                  <div className="result-info">
                    <span
                      className="result-type-badge"
                      style={{ backgroundColor: img.typeColor }}
                    >
                      {img.typeName}
                    </span>
                    <span className="result-model">{img.provider}</span>
                  </div>
                  <div className="result-actions">
                    <button
                      className="action-btn"
                      title="Open"
                      onClick={(e) => { e.stopPropagation(); handleOpenLightbox(img) }}
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      className="action-btn"
                      title="Regenerate"
                      disabled={regeneratingIds.has(img.id)}
                      onClick={(e) => { e.stopPropagation(); handleRegenerateImage(img) }}
                    >
                      {regeneratingIds.has(img.id) ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                    </button>
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
      {/* ── Lightbox Modal ── */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>

            <button className="lightbox-close" onClick={handleCloseLightbox}>
              <X size={20} />
            </button>

            <div className="lightbox-image-wrap">
              <img src={lightboxImg.url} alt={lightboxImg.typeName} />
            </div>

            <div className="lightbox-info">
              <span className="lightbox-template">{lightboxImg.typeName}</span>
              <span className="lightbox-meta">{lightboxImg.provider} · {lightboxImg.aspectRatio}</span>
            </div>

            <div className="lightbox-actions">

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

              <button
                className="lightbox-btn lightbox-btn-download"
                onClick={() => handleDownloadLightbox(lightboxImg)}
              >
                <Download size={17} /> Download
              </button>

              <button
                className="lightbox-btn lightbox-btn-regen"
                onClick={() => handleRegenerateImage(lightboxImg)}
                disabled={regeneratingIds.has(lightboxImg.id)}
              >
                {regeneratingIds.has(lightboxImg.id)
                  ? <><Loader2 size={17} className="spin" /> Regenerating...</>
                  : <><RefreshCw size={17} /> Regenerate</>}
              </button>

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

export default SecondaryImageGenerator
