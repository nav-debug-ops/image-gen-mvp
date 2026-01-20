import { Sparkles, Loader2, Package, Camera, LayoutGrid, Users, Zap } from 'lucide-react'

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
  setProductCategory
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
