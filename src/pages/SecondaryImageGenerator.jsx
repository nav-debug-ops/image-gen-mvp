import { useState, useCallback } from 'react'
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
  Edit3
} from 'lucide-react'
import { generateImage } from '../api/imageGen'
import { PRODUCT_CATEGORIES } from '../constants/productCategories'

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
  // Campaign data state
  const [campaignData, setCampaignData] = useState(MOCK_CAMPAIGN_SUMMARY)
  const [hasCampaignData, setHasCampaignData] = useState(true)

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

  // Generate default prompt for a given type based on campaign data
  const getDefaultPrompt = (typeId) => {
    switch (typeId) {
      case 'benefits':
        return `Amazon product infographic for "${campaignData.productName}", benefits showcase layout, clean white background, professional design highlighting: ${campaignData.benefits.slice(0, 3).join(', ')}. Include icons and benefit callouts, modern minimalist style, easy to read text hierarchy, product image integrated, high quality commercial design`
      case 'features':
        return `Amazon product features infographic for "${campaignData.productName}", technical features layout showing: ${campaignData.features.slice(0, 4).join(', ')}. Clean diagram style with labeled arrows pointing to features, white background, professional product photography style, specifications highlighted, modern design`
      case 'comparison':
        return `Amazon comparison infographic for "${campaignData.productName}", side-by-side comparison layout, "Our Product vs Others" style, highlighting advantages: ${campaignData.uniqueSellingPoints.slice(0, 3).join(', ')}. Professional design with checkmarks and X marks, clean white background, trust-building visual hierarchy`
      case 'lifestyle':
        return `Lifestyle product photography for Amazon listing, "${campaignData.productName}" being used by ${campaignData.targetAudience.primary}, ${campaignData.targetAudience.useCase} setting, natural lighting, aspirational scene showing ${campaignData.targetAudience.lifestyle} lifestyle, high quality commercial photography, product clearly visible and in use`
      case 'quality':
        return `Amazon trust and quality infographic for "${campaignData.productName}", showcasing premium materials and certifications, quality badges, warranty information, "Why Choose Us" style layout, professional design with trust symbols, clean white background, premium feel`
      case 'howto':
        return `Amazon how-to-use infographic for "${campaignData.productName}", step-by-step usage guide with numbered steps, clean instructional layout, icons and simple illustrations, easy to follow visual guide, white background, professional design`
      default:
        return `Amazon product secondary image for "${campaignData.productName}", professional commercial photography, high quality`
    }
  }

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
          aspectRatio: aspectRatio
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

  const canGenerateImages = selectedType && typePrompts[selectedType] && !isGenerating

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
                  <span>{campaignData.category}</span>
                </div>
                <div className="summary-item">
                  <label>Target</label>
                  <span>{campaignData.targetAudience.primary}</span>
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
                <p>No campaign data loaded</p>
                <button className="btn btn-secondary btn-sm">
                  Load from Creative Campaign
                </button>
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

                    <div className="prompt-edit-area">
                      <label className="prompt-label">
                        Auto-generated prompt from campaign data (editable):
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
                      title="Download"
                      onClick={(e) => { e.stopPropagation(); downloadImage(img) }}
                    >
                      <Download size={16} />
                    </button>
                    <button className="action-btn" title="Regenerate" onClick={(e) => e.stopPropagation()}>
                      <RefreshCw size={16} />
                    </button>
                    <button className="action-btn" title="Save" onClick={(e) => e.stopPropagation()}>
                      <Save size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecondaryImageGenerator
