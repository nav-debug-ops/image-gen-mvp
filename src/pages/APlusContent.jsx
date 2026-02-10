import { useState, useCallback, useEffect } from 'react'
import { PRODUCT_CATEGORIES } from '../constants/productCategories'
import {
  Upload,
  Search,
  Image,
  Type,
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
  FileText
} from 'lucide-react'

// Standard A+ Content Module Definitions
const STANDARD_MODULES = [
  {
    id: 'image-header',
    name: 'Standard Image Header',
    description: 'Full-width hero image for brand impact',
    dimensions: '970 x 600 px',
    width: 970,
    height: 600,
    hasText: false,
    category: 'header',
    preview: '🖼️'
  },
  {
    id: 'company-logo',
    name: 'Standard Company Logo',
    description: 'Brand logo for consistent branding',
    dimensions: '600 x 180 px',
    width: 600,
    height: 180,
    hasText: false,
    category: 'header',
    preview: '🏢'
  },
  {
    id: 'image-light-overlay',
    name: 'Image & Light Text Overlay',
    description: 'Image with light-colored text overlay',
    dimensions: '970 x 300 px',
    width: 970,
    height: 300,
    hasText: true,
    textPosition: 'overlay-light',
    category: 'banner',
    preview: '☀️'
  },
  {
    id: 'image-dark-overlay',
    name: 'Image & Dark Text Overlay',
    description: 'Image with dark-colored text overlay',
    dimensions: '970 x 300 px',
    width: 970,
    height: 300,
    hasText: true,
    textPosition: 'overlay-dark',
    category: 'banner',
    preview: '🌙'
  },
  {
    id: 'single-image-highlights',
    name: 'Single Image & Highlights',
    description: 'Square image with bullet point highlights',
    dimensions: '300 x 300 px',
    width: 300,
    height: 300,
    hasText: true,
    textType: 'highlights',
    category: 'feature',
    preview: '✨'
  },
  {
    id: 'single-image-sidebar',
    name: 'Single Image & Sidebar',
    description: 'Main image with sidebar text',
    dimensions: '300 x 400 px',
    width: 300,
    height: 400,
    hasText: true,
    textPosition: 'sidebar',
    category: 'feature',
    preview: '📐'
  },
  {
    id: 'multiple-image-a',
    name: 'Multiple Image Module A',
    description: 'Up to 4 images in a row',
    dimensions: '220 x 220 px each',
    width: 220,
    height: 220,
    imageCount: 4,
    hasText: false,
    category: 'gallery',
    preview: '🔲'
  },
  {
    id: 'four-image-text',
    name: 'Four Image & Text',
    description: '4 images with text below each',
    dimensions: '220 x 220 px each',
    width: 220,
    height: 220,
    imageCount: 4,
    hasText: true,
    textPosition: 'below',
    category: 'gallery',
    preview: '📊'
  },
  {
    id: 'single-image-specs',
    name: 'Single Image & Specs Detail',
    description: 'Image with detailed specifications',
    dimensions: '300 x 300 px',
    width: 300,
    height: 300,
    hasText: true,
    textType: 'specs',
    category: 'feature',
    preview: '📋'
  },
  {
    id: 'single-left-image',
    name: 'Single Left Image',
    description: 'Image on left, text on right',
    dimensions: '300 x 300 px',
    width: 300,
    height: 300,
    hasText: true,
    textPosition: 'right',
    category: 'feature',
    preview: '◀️'
  },
  {
    id: 'single-right-image',
    name: 'Single Right Image',
    description: 'Text on left, image on right',
    dimensions: '300 x 300 px',
    width: 300,
    height: 300,
    hasText: true,
    textPosition: 'left',
    category: 'feature',
    preview: '▶️'
  },
  {
    id: 'description-text',
    name: 'Product Description Text',
    description: 'Text-only module for detailed descriptions',
    dimensions: 'Text only',
    width: 0,
    height: 0,
    hasText: true,
    textOnly: true,
    category: 'text',
    preview: '📝'
  },
  {
    id: 'comparison-chart',
    name: 'Comparison Chart',
    description: 'Compare up to 5 products side by side',
    dimensions: '150 x 300 px per product',
    width: 150,
    height: 300,
    imageCount: 5,
    hasText: true,
    textType: 'comparison',
    category: 'comparison',
    preview: '⚖️'
  },
  {
    id: 'three-images-text',
    name: 'Three Images & Text',
    description: '3 images with accompanying text',
    dimensions: '300 x 300 px each',
    width: 300,
    height: 300,
    imageCount: 3,
    hasText: true,
    textPosition: 'below',
    category: 'gallery',
    preview: '🎯'
  }
]

// Premium A+ Content Module Definitions (1464px wide - full width immersive)
const PREMIUM_MODULES = [
  {
    id: 'premium-header',
    name: 'Premium Header Image',
    description: 'Full-width premium hero image',
    dimensions: '1464 x 600 px',
    width: 1464,
    height: 600,
    hasText: false,
    category: 'header',
    preview: '🌟',
    isPremium: true
  },
  {
    id: 'premium-full-bg-text',
    name: 'Full Background with Text',
    description: 'Immersive background image with text overlay',
    dimensions: '1464 x 625 px',
    width: 1464,
    height: 625,
    hasText: true,
    textPosition: 'overlay',
    category: 'header',
    preview: '🎨',
    isPremium: true
  },
  {
    id: 'premium-light-overlay',
    name: 'Premium Light Text Overlay',
    description: 'Premium banner with light text overlay',
    dimensions: '1464 x 350 px',
    width: 1464,
    height: 350,
    hasText: true,
    textPosition: 'overlay-light',
    category: 'banner',
    preview: '☀️',
    isPremium: true
  },
  {
    id: 'premium-dark-overlay',
    name: 'Premium Dark Text Overlay',
    description: 'Premium banner with dark text overlay',
    dimensions: '1464 x 350 px',
    width: 1464,
    height: 350,
    hasText: true,
    textPosition: 'overlay-dark',
    category: 'banner',
    preview: '🌙',
    isPremium: true
  },
  {
    id: 'premium-single-image',
    name: 'Premium Single Image',
    description: 'Large full-width single image',
    dimensions: '1464 x 600 px',
    width: 1464,
    height: 600,
    hasText: false,
    category: 'feature',
    preview: '🖼️',
    isPremium: true
  },
  {
    id: 'premium-two-image-text',
    name: 'Premium Two Image & Text',
    description: '2 images with text descriptions',
    dimensions: '362 x 453 px each',
    width: 362,
    height: 453,
    imageCount: 2,
    hasText: true,
    textPosition: 'below',
    category: 'gallery',
    preview: '📊',
    isPremium: true
  },
  {
    id: 'premium-three-image-text',
    name: 'Premium Three Image & Text',
    description: '3 images with text descriptions',
    dimensions: '362 x 453 px each',
    width: 362,
    height: 453,
    imageCount: 3,
    hasText: true,
    textPosition: 'below',
    category: 'gallery',
    preview: '🎯',
    isPremium: true
  },
  {
    id: 'premium-four-image-text',
    name: 'Premium Four Image & Text',
    description: '4 images with text below each',
    dimensions: '362 x 453 px each',
    width: 362,
    height: 453,
    imageCount: 4,
    hasText: true,
    textPosition: 'below',
    category: 'gallery',
    preview: '📋',
    isPremium: true
  },
  {
    id: 'premium-four-image-highlight',
    name: 'Premium Four Image Highlight',
    description: '4 square highlight images',
    dimensions: '362 x 362 px each',
    width: 362,
    height: 362,
    imageCount: 4,
    hasText: false,
    category: 'gallery',
    preview: '✨',
    isPremium: true
  },
  {
    id: 'premium-comparison-chart',
    name: 'Premium Comparison Chart',
    description: 'Compare up to 6 products side by side',
    dimensions: '150 x 300 px per product',
    width: 150,
    height: 300,
    imageCount: 6,
    hasText: true,
    textType: 'comparison',
    category: 'comparison',
    preview: '⚖️',
    isPremium: true
  },
  {
    id: 'premium-hotspot',
    name: 'Premium Hotspot Module',
    description: 'Interactive image with clickable hotspots',
    dimensions: '1464 x 600 px',
    width: 1464,
    height: 600,
    hasText: true,
    textType: 'hotspots',
    category: 'interactive',
    preview: '🎯',
    isPremium: true,
    isInteractive: true
  },
  {
    id: 'premium-carousel',
    name: 'Premium Image Carousel',
    description: 'Scrollable image gallery',
    dimensions: '362 x 453 px per image',
    width: 362,
    height: 453,
    imageCount: 5,
    hasText: true,
    category: 'interactive',
    preview: '🎠',
    isPremium: true,
    isInteractive: true
  },
  {
    id: 'premium-video',
    name: 'Premium Video Module',
    description: 'HD video content (1280x720 min)',
    dimensions: '1280 x 720 px (HD)',
    width: 1280,
    height: 720,
    hasText: true,
    textPosition: 'below',
    category: 'interactive',
    preview: '🎬',
    isPremium: true,
    isInteractive: true,
    isVideo: true
  },
  {
    id: 'premium-nav-carousel',
    name: 'Premium Navigation Carousel',
    description: 'Interactive navigation with thumbnails',
    dimensions: 'Variable',
    width: 362,
    height: 362,
    imageCount: 6,
    hasText: true,
    category: 'interactive',
    preview: '🧭',
    isPremium: true,
    isInteractive: true
  },
  {
    id: 'premium-qa',
    name: 'Premium Q&A Module',
    description: 'Interactive FAQ section',
    dimensions: 'Text only',
    width: 0,
    height: 0,
    hasText: true,
    textOnly: true,
    textType: 'qa',
    category: 'interactive',
    preview: '❓',
    isPremium: true,
    isInteractive: true
  }
]

const MODULE_CATEGORIES = [
  { id: 'all', name: 'All Modules' },
  { id: 'header', name: 'Headers' },
  { id: 'banner', name: 'Banners' },
  { id: 'feature', name: 'Features' },
  { id: 'gallery', name: 'Galleries' },
  { id: 'text', name: 'Text' },
  { id: 'comparison', name: 'Comparison' },
  { id: 'interactive', name: 'Interactive', premiumOnly: true }
]

const GUIDELINES = [
  { icon: '✓', text: 'Use high-resolution, professional images (min 72 DPI)' },
  { icon: '✓', text: 'Focus on brand story and product benefits' },
  { icon: '✓', text: 'Keep text concise and scannable' },
  { icon: '✗', text: 'No pricing or promotional information' },
  { icon: '✗', text: 'No contact info or external links' },
  { icon: '✗', text: 'No unverified claims like "best" or "#1"' },
  { icon: '✗', text: 'No customer reviews or testimonials' }
]

// Mock Creative Campaign Data (would come from Creative Campaigns tool)
const CREATIVE_CAMPAIGN_DATA = {
  productName: 'Premium Wireless Headphones',
  brandName: 'AudioPro',
  targetAudience: 'Tech-savvy professionals aged 25-45',
  keyBenefits: [
    'Active noise cancellation',
    '40-hour battery life',
    'Premium comfort memory foam',
    'Crystal clear audio quality'
  ],
  painPoints: [
    'Uncomfortable headphones during long use',
    'Poor battery life interrupting work',
    'Distracting background noise'
  ],
  emotionalTriggers: [
    'Focus and productivity',
    'Premium quality and status',
    'Comfort and relaxation'
  ],
  competitiveAdvantages: [
    'Industry-leading battery life',
    'Superior noise cancellation',
    'Lightweight premium design'
  ],
  toneOfVoice: 'Professional, confident, premium',
  keywords: ['wireless', 'noise-cancelling', 'premium', 'comfort', 'professional']
}

// Generate prompt templates based on module type and campaign data
const generateModulePrompt = (moduleType, campaignData = CREATIVE_CAMPAIGN_DATA) => {
  const prompts = {
    'image-header': `Create a stunning hero image for ${campaignData.productName} by ${campaignData.brandName}.
Target audience: ${campaignData.targetAudience}
Style: Professional, premium, aspirational
Key message: Showcase the product as a premium lifestyle choice
Include: Product prominently displayed, clean background, subtle brand elements
Mood: ${campaignData.emotionalTriggers.join(', ')}
Dimensions: 970x600 pixels, full-width banner`,

    'company-logo': `Create a professional company logo display for ${campaignData.brandName}.
Style: Clean, professional, brand-consistent
Background: Pure white or transparent
Requirements:
- High resolution logo centered
- Adequate padding around logo
- No taglines or additional text unless part of official logo
- Consistent with brand identity guidelines
Tone: ${campaignData.toneOfVoice}
Dimensions: 600x180 pixels (horizontal/landscape format)`,

    'image-light-overlay': `Design a banner image with light text overlay for ${campaignData.productName}.
Highlight: ${campaignData.keyBenefits[0]}
Background: Bright, airy lifestyle setting
Text area: Left or right side for headline overlay
Target: ${campaignData.targetAudience}
Tone: ${campaignData.toneOfVoice}
Dimensions: 970x300 pixels`,

    'image-dark-overlay': `Design a banner image with dark text overlay for ${campaignData.productName}.
Highlight: ${campaignData.keyBenefits[1] || campaignData.keyBenefits[0]}
Background: Rich, dramatic setting that conveys premium quality
Text area: Contrasting area for dark text overlay
Emotional appeal: ${campaignData.emotionalTriggers[0]}
Dimensions: 970x300 pixels`,

    'single-image-highlights': `Create a feature image showcasing ${campaignData.productName} with highlight points.
Key features to visualize:
${campaignData.keyBenefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}
Style: Clean product shot on white/neutral background
Focus: Clear detail visibility for feature callouts
Dimensions: 300x300 pixels`,

    'single-image-sidebar': `Create a product image for sidebar layout featuring ${campaignData.productName}.
Solving pain point: ${campaignData.painPoints[0]}
Show: Product in use or lifestyle context
Complement: Space for descriptive text on the side
Appeal to: ${campaignData.targetAudience}
Dimensions: 300x400 pixels`,

    'multiple-image-a': `Create a series of 4 complementary images for ${campaignData.productName}.
Image 1: Product front view - professional studio shot
Image 2: Product angle view - showing design details
Image 3: Product in use - lifestyle context
Image 4: Key feature close-up - ${campaignData.keyBenefits[0]}
Style: Consistent lighting and background across all images
Dimensions: 220x220 pixels each`,

    'four-image-text': `Create 4 feature images with text space for ${campaignData.productName}.
${campaignData.keyBenefits.slice(0, 4).map((benefit, i) => `Image ${i + 1}: Visualize "${benefit}"`).join('\n')}
Style: Icon-style or focused product shots
Background: Clean, consistent across all
Leave space below for feature descriptions
Dimensions: 220x220 pixels each`,

    'single-image-specs': `Create a technical specification image for ${campaignData.productName}.
Show: Product with clear visibility of key components
Style: Technical/informative but still premium
Highlight areas for spec callouts
Include: Clean angles showing dimensions and features
Keywords: ${campaignData.keywords.join(', ')}
Dimensions: 300x300 pixels`,

    'single-left-image': `Create a left-aligned product image for ${campaignData.productName}.
Context: ${campaignData.emotionalTriggers[1] || 'Premium lifestyle'}
Show: Product in aspirational setting
Solving: ${campaignData.painPoints[1] || campaignData.painPoints[0]}
Right side: Space for benefit-focused copy
Dimensions: 300x300 pixels`,

    'single-right-image': `Create a right-aligned product image for ${campaignData.productName}.
Advantage: ${campaignData.competitiveAdvantages[0]}
Show: Product demonstrating this competitive edge
Left side: Space for compelling headline and body text
Target emotion: ${campaignData.emotionalTriggers[2] || campaignData.emotionalTriggers[0]}
Dimensions: 300x300 pixels`,

    'description-text': `Write compelling A+ Content copy for ${campaignData.productName}.
Brand: ${campaignData.brandName}
Tone: ${campaignData.toneOfVoice}
Target: ${campaignData.targetAudience}

Key benefits to convey:
${campaignData.keyBenefits.map(b => `• ${b}`).join('\n')}

Pain points to address:
${campaignData.painPoints.map(p => `• ${p}`).join('\n')}

Competitive advantages:
${campaignData.competitiveAdvantages.map(a => `• ${a}`).join('\n')}

Note: No pricing, no superlatives like "best", no competitor mentions`,

    'comparison-chart': `Create comparison chart images for ${campaignData.productName} vs alternatives.
Our product advantages:
${campaignData.competitiveAdvantages.map(a => `✓ ${a}`).join('\n')}
Style: Professional product shots on white background
Show: Our product as the premium choice
Include: Up to 5 product slots
Dimensions: 150x300 pixels per product`,

    'three-images-text': `Create 3 storytelling images for ${campaignData.productName}.
Image 1 - The Problem: Visualize "${campaignData.painPoints[0]}"
Image 2 - The Solution: Show ${campaignData.productName} in action
Image 3 - The Result: ${campaignData.emotionalTriggers[0]} achieved
Flow: Problem → Solution → Benefit narrative
Style: Consistent, premium, relatable to ${campaignData.targetAudience}
Dimensions: 300x300 pixels each`,

    // Premium A+ Content Prompts (1464px wide - immersive full-width)
    'premium-header': `Create a stunning PREMIUM hero image for ${campaignData.productName} by ${campaignData.brandName}.
Format: Premium A+ Content (1464px wide - full immersive width)
Target audience: ${campaignData.targetAudience}
Style: Ultra-premium, cinematic, aspirational
Key message: Position the product as a luxury lifestyle choice
Include: Product as hero, dramatic lighting, high-end aesthetic
Mood: ${campaignData.emotionalTriggers.join(', ')}
Dimensions: 1464x600 pixels (Premium full-width)`,

    'premium-full-bg-text': `Create an immersive full-background image for ${campaignData.productName}.
Format: Premium A+ Content - Full Background with Text
Style: Cinematic, lifestyle-focused, premium atmosphere
Background: Rich, detailed scene that tells a story
Text overlay area: Leave space for compelling headline
Brand essence: ${campaignData.toneOfVoice}
Key benefit: ${campaignData.keyBenefits[0]}
Dimensions: 1464x625 pixels`,

    'premium-light-overlay': `Design a premium banner with light text overlay for ${campaignData.productName}.
Format: Premium A+ Content (1464px wide)
Highlight: ${campaignData.keyBenefits[0]}
Background: Bright, premium lifestyle setting
Text area: Generous space for light-colored headline overlay
Target: ${campaignData.targetAudience}
Dimensions: 1464x350 pixels`,

    'premium-dark-overlay': `Design a premium banner with dark text overlay for ${campaignData.productName}.
Format: Premium A+ Content (1464px wide)
Highlight: ${campaignData.keyBenefits[1] || campaignData.keyBenefits[0]}
Background: Rich, dramatic setting conveying luxury
Text area: Contrasting area for dark text overlay
Emotional appeal: ${campaignData.emotionalTriggers[0]}
Dimensions: 1464x350 pixels`,

    'premium-single-image': `Create a large premium single image for ${campaignData.productName}.
Format: Premium A+ Content - Full Width Single Image
Style: Studio quality, dramatic lighting, ultra-high resolution
Focus: Product detail and craftsmanship
Showcase: ${campaignData.competitiveAdvantages[0]}
Background: Clean, premium gradient or contextual
Dimensions: 1464x600 pixels`,

    'premium-two-image-text': `Create 2 premium feature images for ${campaignData.productName}.
Image 1: ${campaignData.keyBenefits[0]} - visualize the benefit
Image 2: ${campaignData.keyBenefits[1] || 'Product in premium context'}
Style: Consistent premium aesthetic, lifestyle-oriented
Space below each for feature descriptions
Target: ${campaignData.targetAudience}
Dimensions: 362x453 pixels each`,

    'premium-three-image-text': `Create 3 premium storytelling images for ${campaignData.productName}.
Image 1: The Challenge - ${campaignData.painPoints[0]}
Image 2: The Solution - ${campaignData.productName} in action
Image 3: The Transformation - ${campaignData.emotionalTriggers[0]}
Flow: Problem → Solution → Success narrative
Style: Premium, cinematic, emotionally engaging
Dimensions: 362x453 pixels each`,

    'premium-four-image-text': `Create 4 premium feature images for ${campaignData.productName}.
${campaignData.keyBenefits.slice(0, 4).map((benefit, i) => `Image ${i + 1}: "${benefit}"`).join('\n')}
Style: Premium, consistent lighting and treatment
Each image should have space below for text
Target audience: ${campaignData.targetAudience}
Dimensions: 362x453 pixels each`,

    'premium-four-image-highlight': `Create 4 premium square highlight images for ${campaignData.productName}.
Image 1: Product hero shot - premium angle
Image 2: Key feature close-up - ${campaignData.keyBenefits[0]}
Image 3: Lifestyle context - product in use
Image 4: Detail/texture shot - quality craftsmanship
Style: Ultra-premium, gallery-worthy
Dimensions: 362x362 pixels each`,

    'premium-comparison-chart': `Create premium comparison chart images for ${campaignData.productName}.
Our product advantages:
${campaignData.competitiveAdvantages.map(a => `✓ ${a}`).join('\n')}
Style: Premium product photography, white background
Show: Our product as the clear premium choice
Include: Up to 6 product comparison slots
Visual hierarchy: Our product prominently featured
Dimensions: 150x300 pixels per product`,

    'premium-hotspot': `Create an interactive hotspot image for ${campaignData.productName}.
Format: Premium A+ Content - Interactive Hotspot Module
Main image: Full product shot with clear feature areas
Hotspot areas to highlight:
${campaignData.keyBenefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}
Style: Clean, detailed product photography
Purpose: Users click areas to learn about features
Dimensions: 1464x600 pixels`,

    'premium-carousel': `Create a premium scrollable image carousel for ${campaignData.productName}.
5 carousel slides:
Slide 1: Hero product shot
Slide 2: Feature highlight - ${campaignData.keyBenefits[0]}
Slide 3: Lifestyle usage context
Slide 4: Detail close-up
Slide 5: Brand story/packaging
Style: Premium, consistent, scroll-worthy
Dimensions: 362x453 pixels per image`,

    'premium-video': `Create a video thumbnail/cover for ${campaignData.productName}.
Format: Premium A+ Content - Video Module
Video content suggestions:
- Product demonstration
- Feature showcase
- Brand story
- Customer transformation
Thumbnail: Compelling frame that encourages play
Style: Cinematic, professional
Minimum: 1280x720 pixels (HD)`,

    'premium-nav-carousel': `Create navigation carousel thumbnails for ${campaignData.productName}.
6 navigation items showcasing:
1. Product overview
2. Key features
3. Benefits
4. How to use
5. Specifications
6. Brand story
Style: Consistent, clickable thumbnails
Each should clearly represent its section
Dimensions: 362x362 pixels per thumbnail`,

    'premium-qa': `Write Premium Q&A content for ${campaignData.productName}.
Format: Interactive FAQ Module
Brand: ${campaignData.brandName}
Tone: ${campaignData.toneOfVoice}

Suggested Q&A pairs addressing:
${campaignData.painPoints.map(p => `Q: How does this solve "${p}"?`).join('\n')}
${campaignData.keyBenefits.map(b => `Q: Tell me about "${b}"`).join('\n')}

Style: Helpful, authoritative, brand-consistent
Note: No pricing, no superlatives, no competitor mentions`
  }

  return prompts[moduleType] || `Create a professional Amazon A+ Content image for ${campaignData.productName}.
Brand: ${campaignData.brandName}
Target: ${campaignData.targetAudience}
Key benefit: ${campaignData.keyBenefits[0]}
Style: Premium, professional, Amazon-compliant`
}

function APlusContent() {
  // Content type selection
  const [contentType, setContentType] = useState('standard') // 'standard' | 'premium'

  // ASIN input
  const [asinValue, setAsinValue] = useState('')
  const [productCategory, setProductCategory] = useState('')

  // Module management
  const [selectedModules, setSelectedModules] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Module data (images and text for each added module)
  const [moduleData, setModuleData] = useState({})

  // UI state
  const [previewMode, setPreviewMode] = useState(false)
  const [expandedModule, setExpandedModule] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(true)

  // Validation
  const isValidASIN = (asin) => /^[A-Z0-9]{10}$/i.test(asin)
  const canAddModule = selectedModules.length < 7
  const hasMinModules = selectedModules.length >= 1

  // Get current modules based on content type
  const currentModules = contentType === 'premium' ? PREMIUM_MODULES : STANDARD_MODULES

  // Get available categories based on content type
  const availableCategories = contentType === 'premium'
    ? MODULE_CATEGORIES
    : MODULE_CATEGORIES.filter(c => !c.premiumOnly)

  // Filter modules by category
  const filteredModules = categoryFilter === 'all'
    ? currentModules
    : currentModules.filter(m => m.category === categoryFilter)

  // Clear modules when switching content type
  const handleContentTypeChange = (newType) => {
    if (newType !== contentType) {
      setContentType(newType)
      setSelectedModules([])
      setModuleData({})
      setCategoryFilter('all')
      setExpandedModule(null)
    }
  }

  // Add module to content
  const addModule = (moduleType) => {
    if (!canAddModule) return

    const moduleDefinition = currentModules.find(m => m.id === moduleType)
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
        aiPrompt: generateModulePrompt(moduleType),
        images: [],
        headline: '',
        body: '',
        highlights: [],
        specs: [],
        hotspots: [],
        qaItems: []
      }
    }))
    setExpandedModule(newModule.instanceId)
  }

  // Remove module from content
  const removeModule = (instanceId) => {
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

  // Reorder modules via drag and drop
  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

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

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Move module up/down
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

  // Handle reference image upload for module
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

  // Handle image upload for module
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

  // Generate AI content for module
  const generateModuleContent = async (instanceId) => {
    setIsGenerating(true)
    // Simulated AI generation - in production, this would call the AI API
    await new Promise(resolve => setTimeout(resolve, 1500))

    const module = selectedModules.find(m => m.instanceId === instanceId)

    // Generate sample content based on module type
    const sampleContent = {
      headline: `Premium Quality ${module?.name || 'Product'} Feature`,
      body: 'Discover the exceptional craftsmanship and attention to detail that sets our product apart. Made with premium materials for lasting durability and performance.',
      highlights: [
        'Premium quality materials',
        'Ergonomic design for comfort',
        'Built to last with durability',
        'Satisfaction guaranteed'
      ],
      specs: [
        { label: 'Material', value: 'Premium Grade' },
        { label: 'Dimensions', value: 'Standard Size' },
        { label: 'Weight', value: 'Lightweight' },
        { label: 'Warranty', value: '1 Year' }
      ]
    }

    updateModuleData(instanceId, 'headline', sampleContent.headline)
    updateModuleData(instanceId, 'body', sampleContent.body)
    if (module?.textType === 'highlights') {
      updateModuleData(instanceId, 'highlights', sampleContent.highlights)
    }
    if (module?.textType === 'specs') {
      updateModuleData(instanceId, 'specs', sampleContent.specs)
    }

    setIsGenerating(false)
  }

  // Regenerate AI prompt for module
  const regeneratePrompt = (instanceId, moduleType) => {
    const newPrompt = generateModulePrompt(moduleType)
    updateModuleData(instanceId, 'aiPrompt', newPrompt)
  }

  // Render module editor based on type
  const renderModuleEditor = (module) => {
    const data = moduleData[module.instanceId] || {}
    const imageCount = module.imageCount || 1

    return (
      <div className="module-editor">
        {/* Reference Image Upload Section */}
        <div className="reference-image-section">
          <label className="module-label">
            <Image size={16} />
            Reference Image
            <span className="label-hint">(Your product photo for AI to use)</span>
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
                <span className="dropzone-hint">This image will be used by AI to generate module content</span>
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

        {/* Generated/Output Image Upload Section */}
        {!module.textOnly && (
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
                  style={{
                    aspectRatio: `${module.width}/${module.height}`
                  }}
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

        {/* Text Fields */}
        {module.hasText && (
          <div className="module-text-fields">
            <div className="module-field">
              <label className="module-label">Headline</label>
              <input
                type="text"
                placeholder="Enter headline..."
                value={data.headline || ''}
                onChange={(e) => updateModuleData(module.instanceId, 'headline', e.target.value)}
                maxLength={150}
              />
              <span className="char-count">{(data.headline || '').length}/150</span>
            </div>

            {module.textType === 'highlights' ? (
              <div className="module-field">
                <label className="module-label">Highlights (up to 4)</label>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Highlight ${idx + 1}`}
                    value={data.highlights?.[idx] || ''}
                    onChange={(e) => {
                      const newHighlights = [...(data.highlights || [])]
                      newHighlights[idx] = e.target.value
                      updateModuleData(module.instanceId, 'highlights', newHighlights)
                    }}
                    maxLength={100}
                  />
                ))}
              </div>
            ) : module.textType === 'specs' ? (
              <div className="module-field">
                <label className="module-label">Specifications</label>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="spec-row">
                    <input
                      type="text"
                      placeholder="Label"
                      value={data.specs?.[idx]?.label || ''}
                      onChange={(e) => {
                        const newSpecs = [...(data.specs || [])]
                        newSpecs[idx] = { ...newSpecs[idx], label: e.target.value }
                        updateModuleData(module.instanceId, 'specs', newSpecs)
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={data.specs?.[idx]?.value || ''}
                      onChange={(e) => {
                        const newSpecs = [...(data.specs || [])]
                        newSpecs[idx] = { ...newSpecs[idx], value: e.target.value }
                        updateModuleData(module.instanceId, 'specs', newSpecs)
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : module.textType === 'comparison' ? (
              <div className="module-field">
                <label className="module-label">Comparison Products (up to 5)</label>
                <p className="field-hint">Add product names and features to compare</p>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Product ${idx + 1} name`}
                    value={data.products?.[idx] || ''}
                    onChange={(e) => {
                      const newProducts = [...(data.products || [])]
                      newProducts[idx] = e.target.value
                      updateModuleData(module.instanceId, 'products', newProducts)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="module-field">
                <label className="module-label">Body Text</label>
                <textarea
                  placeholder="Enter body text..."
                  value={data.body || ''}
                  onChange={(e) => updateModuleData(module.instanceId, 'body', e.target.value)}
                  maxLength={500}
                  rows={4}
                />
                <span className="char-count">{(data.body || '').length}/500</span>
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
      </div>
    )
  }

  // Render module preview
  const renderModulePreview = (module) => {
    const data = moduleData[module.instanceId] || {}

    return (
      <div className={`module-preview preview-${module.id}`}>
        {module.textOnly ? (
          <div className="preview-text-only">
            <h4>{data.headline || 'Headline'}</h4>
            <p>{data.body || 'Body text will appear here...'}</p>
          </div>
        ) : (
          <div className="preview-with-image">
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
                <h4>{data.headline || 'Headline'}</h4>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="aplus-content-page aplus-layout-vertical">
      {/* Top Toolbar */}
      <div className="aplus-toolbar">
        <div className="toolbar-row toolbar-main">
          <div className="toolbar-left">
            <h1>A+ Content Creator</h1>
            <div className="content-type-switcher">
              <button
                className={`type-btn ${contentType === 'standard' ? 'active' : ''}`}
                onClick={() => handleContentTypeChange('standard')}
              >
                Standard
                <span className="type-width">970px</span>
              </button>
              <button
                className={`type-btn ${contentType === 'premium' ? 'active' : ''}`}
                onClick={() => handleContentTypeChange('premium')}
              >
                Premium
                <span className="type-width">1464px</span>
              </button>
            </div>
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
              {selectedModules.length}/7 modules
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
            {/* Guidelines Info Icon with Popup */}
            <div className="guidelines-dropdown">
              <button
                className={`btn-icon-circle ${showGuidelines ? 'active' : ''}`}
                onClick={() => setShowGuidelines(!showGuidelines)}
                title="A+ Content Guidelines"
              >
                <Info size={18} />
              </button>
              {showGuidelines && (
                <div className="guidelines-popup">
                  <div className="guidelines-popup-header">
                    <h4>A+ Content Guidelines</h4>
                    <button className="popup-close" onClick={() => setShowGuidelines(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="guidelines-popup-content">
                    {GUIDELINES.map((guideline, idx) => (
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
          <div className="category-tabs">
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${categoryFilter === cat.id ? 'active' : ''} ${cat.premiumOnly ? 'premium-only' : ''}`}
                onClick={() => setCategoryFilter(cat.id)}
              >
                {cat.name}
                {cat.premiumOnly && <span className="premium-badge">✨</span>}
              </button>
            ))}
          </div>
          <div className="modules-scroll">
            {filteredModules.map(module => (
              <button
                key={module.id}
                className={`module-chip ${!canAddModule ? 'disabled' : ''}`}
                onClick={() => canAddModule && addModule(module.id)}
                disabled={!canAddModule}
                title={`${module.name} (${module.dimensions})`}
              >
                <span className="chip-icon">{module.preview}</span>
                <span className="chip-name">{module.name}</span>
                <span className="chip-size">{module.dimensions}</span>
                <Plus size={14} className="chip-add" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Builder - Full Width */}
      <div className="aplus-content-area">
        {selectedModules.length === 0 ? (
          <div className="builder-empty-full">
            <LayoutGrid size={56} />
            <h3>Start Building Your A+ Content</h3>
            <p>Click on modules above to add them to your content</p>
            <span className="hint">Minimum 1 module • Maximum 7 modules</span>
          </div>
        ) : previewMode ? (
          <div className="preview-container-full">
            <div className="preview-frame">
              {selectedModules.map(module => (
                <div key={module.instanceId} className="preview-module">
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
                    <span className="module-name-lg">{module.name}</span>
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
                      title="Remove module"
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

export default APlusContent
