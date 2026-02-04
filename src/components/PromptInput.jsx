import { Sparkles, Loader2, Package, Camera, LayoutGrid, Users, Zap, Box, RotateCcw, Layers, Maximize, Hand, Grid3X3 } from 'lucide-react'

// Main Image Templates for Amazon product photography
const MAIN_IMAGE_TEMPLATES = [
  {
    id: 'hero',
    label: 'Hero Shot',
    icon: Maximize,
    description: 'Front-facing, dramatic lighting',
    promptModifier: 'hero shot, front-facing view, dramatic studio lighting, product as the star, powerful presence, centered composition'
  },
  {
    id: 'angle45',
    label: '45° Angle',
    icon: RotateCcw,
    description: 'Classic 3/4 view showing depth',
    promptModifier: '45-degree angle view, three-quarter perspective, showing product depth and dimension, professional product photography angle'
  },
  {
    id: 'front',
    label: 'Front View',
    icon: Box,
    description: 'Straight-on front facing',
    promptModifier: 'straight-on front view, symmetrical composition, direct facing camera, clean frontal perspective'
  },
  {
    id: 'side',
    label: 'Side Profile',
    icon: Layers,
    description: 'Side view showing thickness',
    promptModifier: 'side profile view, showing product thickness and depth, 90-degree side angle, profile perspective'
  },
  {
    id: 'topdown',
    label: 'Top-Down',
    icon: Grid3X3,
    description: 'Bird\'s eye view from above',
    promptModifier: 'top-down view, bird\'s eye perspective, flat lay style, overhead shot, looking straight down at product'
  },
  {
    id: 'withscale',
    label: 'With Scale',
    icon: Hand,
    description: 'Shows size reference',
    promptModifier: 'product with scale reference, showing actual size, hand holding product or next to common object for size comparison'
  }
]

const IMAGE_TYPES = [
  { id: 'main', label: 'Main Image', icon: Package, description: 'White background, product only' },
  { id: 'lifestyle', label: 'Lifestyle', icon: Users, description: 'Product in use context' },
  { id: 'infographic', label: 'Infographic', icon: LayoutGrid, description: 'Features & benefits' },
  { id: 'detail', label: 'Detail Shot', icon: Camera, description: 'Close-up details' },
  { id: 'comparison', label: 'Comparison', icon: Zap, description: 'Before/after or vs competitor' }
]

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Home & Kitchen',
  'Beauty',
  'Sports & Outdoors',
  'Toys & Games',
  'Clothing',
  'Food & Grocery',
  'Pet Supplies'
]

// Amazon-compliant aspect ratios
const ASPECT_RATIOS = [
  {
    id: '1:1',
    label: '1:1 Square',
    description: 'Standard for main & additional images',
    dimensions: { width: 2000, height: 2000 },
    recommended: true
  },
  {
    id: '4:3',
    label: '4:3 Portrait',
    description: 'Common for product photography',
    dimensions: { width: 2000, height: 1500 }
  },
  {
    id: '3:2',
    label: '3:2 Rectangle',
    description: 'Desktop search results (may show bars)',
    dimensions: { width: 2000, height: 1333 }
  }
]

const STYLE_MODIFIERS = [
  'Pure white background',
  'Studio lighting',
  'High contrast',
  'Soft shadows',
  '45-degree angle',
  'Eye-level shot',
  'Flat lay',
  'Hero shot'
]

function PromptInput({
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
  imageType,
  setImageType,
  productCategory,
  setProductCategory,
  productName,
  setProductName,
  productAsin,
  setProductAsin,
  mainTemplate,
  setMainTemplate,
  aspectRatio,
  setAspectRatio
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onGenerate()
    }
  }

  const applyModifier = (modifier) => {
    setPrompt(prev => prev ? `${prev}, ${modifier.toLowerCase()}` : modifier)
  }

  const getPlaceholder = () => {
    switch (imageType) {
      case 'main':
        return 'Describe your product (e.g., "Stainless steel water bottle, 32oz, matte black finish")'
      case 'lifestyle':
        return 'Describe the scene (e.g., "Person hiking in mountains, using the water bottle")'
      case 'infographic':
        return 'List features to highlight (e.g., "Double-wall insulation, leak-proof lid, BPA-free")'
      case 'detail':
        return 'Describe the detail to focus on (e.g., "Close-up of leak-proof lid mechanism")'
      case 'comparison':
        return 'Describe comparison (e.g., "Side by side: our bottle keeps ice 24hrs vs competitor 6hrs")'
      default:
        return 'Describe your product...'
    }
  }

  const selectedType = IMAGE_TYPES.find(t => t.id === imageType)

  return (
    <div className="prompt-section">
      <div className="section-group product-identity">
        <h2>Product Identity</h2>
        <div className="product-inputs">
          <div className="input-field">
            <label htmlFor="product-name">Product Name</label>
            <input
              id="product-name"
              type="text"
              className="product-input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Stainless Steel Water Bottle 32oz"
              disabled={isLoading}
            />
          </div>
          <div className="input-field">
            <label htmlFor="product-asin">ASIN (Optional)</label>
            <input
              id="product-asin"
              type="text"
              className="product-input asin-input"
              value={productAsin}
              onChange={(e) => setProductAsin(e.target.value.toUpperCase())}
              placeholder="e.g., B08XYZ1234"
              maxLength={10}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="section-group">
        <h2>Image Type</h2>
        <div className="image-type-grid">
          {IMAGE_TYPES.map(type => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                className={`image-type-btn ${imageType === type.id ? 'active' : ''}`}
                onClick={() => setImageType(type.id)}
                disabled={isLoading}
                title={type.description}
              >
                <Icon size={16} />
                <span>{type.label}</span>
              </button>
            )
          })}
        </div>
        {selectedType && (
          <p className="type-hint">{selectedType.description}</p>
        )}
      </div>

      {imageType === 'main' && (
        <div className="section-group main-templates-section">
          <h2>Main Image Template</h2>
          <div className="main-template-grid">
            {MAIN_IMAGE_TEMPLATES.map(template => {
              const Icon = template.icon
              return (
                <button
                  key={template.id}
                  className={`main-template-btn ${mainTemplate === template.id ? 'active' : ''}`}
                  onClick={() => setMainTemplate(template.id)}
                  disabled={isLoading}
                  title={template.description}
                >
                  <Icon size={20} />
                  <span className="template-label">{template.label}</span>
                  <span className="template-desc">{template.description}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="section-group">
        <h2>Product Category</h2>
        <select
          className="category-select"
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select category...</option>
          {PRODUCT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="section-group">
        <h2>Aspect Ratio</h2>
        <div className="aspect-ratio-grid">
          {ASPECT_RATIOS.map(ratio => (
            <button
              key={ratio.id}
              className={`aspect-ratio-btn ${aspectRatio === ratio.id ? 'active' : ''} ${ratio.recommended ? 'recommended' : ''}`}
              onClick={() => setAspectRatio(ratio.id)}
              disabled={isLoading}
              title={ratio.description}
            >
              <div className={`ratio-preview ratio-${ratio.id.replace(':', '-')}`}></div>
              <div className="ratio-info">
                <span className="ratio-label">{ratio.label}</span>
                {ratio.recommended && <span className="ratio-badge">Recommended</span>}
              </div>
            </button>
          ))}
        </div>
        <p className="aspect-ratio-tip">
          Min 1,000px longest side • Recommended 2,000px+ for zoom capability
        </p>
      </div>

      <div className="section-group">
        <h2>Product Description</h2>
        <textarea
          className="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={isLoading}
        />
      </div>

      <div className="section-group">
        <h2>Style Modifiers</h2>
        <div className="templates">
          {STYLE_MODIFIERS.map(modifier => (
            <button
              key={modifier}
              className="template-btn"
              onClick={() => applyModifier(modifier)}
              disabled={isLoading}
            >
              {modifier}
            </button>
          ))}
        </div>
      </div>

      <button
        className="generate-btn"
        onClick={onGenerate}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate Listing Image
          </>
        )}
      </button>

      {imageType === 'main' && (
        <div className="amazon-tip">
          <strong>Amazon Main Image Requirements:</strong> Pure white background (RGB 255,255,255), product fills 85% of frame, no text/logos/watermarks
        </div>
      )}
    </div>
  )
}

export default PromptInput
export { MAIN_IMAGE_TEMPLATES, ASPECT_RATIOS }
