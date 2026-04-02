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
  const p    = campaignData.productName || 'the product'
  const b    = campaignData.brandName   || 'the brand'
  const aud  = campaignData.targetAudience || 'Amazon shoppers'
  const ben  = campaignData.keyBenefits || []
  const emo  = campaignData.emotionalTriggers || []
  const adv  = campaignData.competitiveAdvantages || campaignData.keyBenefits || []
  const tone = campaignData.toneOfVoice || 'professional, trustworthy'
  const pain = campaignData.painPoints || []

  const COMPLIANCE = `No pricing text, no competitor brand names, no unverified claims. Photorealistic commercial photography — not illustration, not flat design, not 3D render.`

  const prompts = {
    'image-header': `Amazon A+ Content hero banner for ${p} by ${b}. Full-width landscape composition — preserve the upper third as a clean area for Amazon text overlay (no critical product detail in that zone). ${p} is the clear hero: studio-quality photography with accurate color, real material texture, crisp edges, occupying the right 55–65% of the frame at a slight three-quarter angle. Left side: softly blurred lifestyle scene consistent with ${aud} use context, warm shallow depth-of-field background. Soft directional key light from upper left with warm fill, creating depth without harsh shadows. Tone: ${tone}. Mood: ${emo[0] || 'aspirational confidence'}. ${COMPLIANCE}`,

    'company-logo': `UPLOAD ONLY — Do not AI-generate this module. Upload your official ${b} brand logo. AI image generators produce distorted text and unreliable brand marks. Requirements: PNG with transparent background, minimum 600×180 px, landscape/horizontal format, adequate white padding around the logo mark. Export the logo from your design tool before returning here.`,

    'image-light-overlay': `Amazon A+ Content wide banner with light text overlay zone for ${p}. Landscape banner — keep the left 45% as a bright, clean area suitable for light-colored headline text overlay. Right side: ${p} at slight elevation angle, studio-quality photography, accurate color and real texture. Background: bright airy lifestyle scene consistent with ${aud}. Lighting: even natural-feeling key light, bright and inviting, warm color temperature. Key benefit visualized: ${ben[0] || 'core product benefit'}. No text generated in the image itself — text zone reserved for Amazon's module editor. ${COMPLIANCE}`,

    'image-dark-overlay': `Amazon A+ Content wide banner with dark text overlay zone for ${p}. Landscape banner — keep the right 45% as a rich darker area suitable for dark-colored headline text overlay. Left side: ${p} shown prominently, studio-quality photography, accurate color and texture. Background: rich dramatic lifestyle scene communicating premium quality. Lighting: directional cinematic key light, creating depth and drama. Key benefit: ${ben[1] || ben[0] || 'premium quality'}. Mood: ${emo[0] || 'premium and aspirational'}. No text generated in the image — text zone reserved for Amazon's module editor. ${COMPLIANCE}`,

    'single-image-highlights': `Amazon A+ Content square feature image for ${p}. Clean square composition — ${p} shown front-facing or at slight elevation angle, filling 75–85% of the frame. Studio-quality photography: accurate color, real material texture, crisp sharp edges. Soft directional key light from 45 degrees, subtle drop shadow beneath. Pure white or near-white background. Product in its most visually clear and appealing state. Highlight bullet callouts are added beside this image in Amazon's module editor — no text in the generated image. ${COMPLIANCE}`,

    'single-image-sidebar': `Amazon A+ Content portrait feature image for ${p}. Portrait composition — ${p} shown in aspirational lifestyle use context for ${aud}. Product prominently visible and actively in use. Natural or studio lifestyle lighting — warm, inviting, authentic. Shallow depth-of-field background: clean modern environment. Key benefit shown: ${ben[0] || 'primary benefit'}. Mood: ${emo[1] || emo[0] || 'confident satisfaction'}. The right side of the composition should have a lighter area to complement the sidebar text in Amazon's module editor. No text in the generated image. ${COMPLIANCE}`,

    'multiple-image-a': `Amazon A+ Content product gallery — 4 square studio images for ${p}. Consistent setup: same neutral background, same lighting, same shadow treatment. Image 1: product front-facing, straight-on angle. Image 2: 3/4 angle showing depth and side profile. Image 3: product in active use showing key functional state. Image 4: close-up detail of the most important quality signal — ${ben[0] || 'key feature'}. All images: crisp focus, accurate color, real texture, true proportions. No text in any image. ${COMPLIANCE}`,

    'four-image-text': `Amazon A+ Content — 4 feature images for ${p}, each visualizing one key benefit. Image 1: visualize "${ben[0] || 'benefit 1'}" — product in context demonstrating this benefit. Image 2: visualize "${ben[1] || ben[0] || 'benefit 2'}". Image 3: visualize "${ben[2] || ben[0] || 'benefit 3'}". Image 4: visualize "${ben[3] || ben[0] || 'benefit 4'}". All images: consistent studio or lifestyle lighting, accurate color, white or near-white background, crisp focus. Text descriptions are added below each image in Amazon's module editor — no text in generated images. ${COMPLIANCE}`,

    'single-image-specs': `Amazon A+ Content technical product image for ${p}. Square composition — product shown at slight elevation angle revealing key components, design features, and construction detail. Studio-quality photography with even diffused lighting, accurate color, real material texture. Multiple components or key features simultaneously visible. Product fills 80–85% of the frame. Clean white background, soft natural shadow beneath. This image supports specification callouts added in the Amazon module editor — no text in the generated image. ${COMPLIANCE}`,

    'single-left-image': `Amazon A+ Content left-side feature image for ${p}. Square composition — ${p} shown in aspirational use context for ${aud}. Product clearly visible and in active use. Warm lifestyle lighting, authentic scene. Emotional appeal: ${emo[1] || emo[0] || 'satisfaction and confidence'}. The right side of the frame should have a lighter area to complement the text column in Amazon's module editor. Shallow depth-of-field background. No text in generated image. Authentic feel — not stock-photo generic. ${COMPLIANCE}`,

    'single-right-image': `Amazon A+ Content right-side feature image for ${p}. Square composition — ${p} demonstrating its key advantage: ${adv[0] || ben[0] || 'key benefit'}. Warm lifestyle or studio lighting, authentic scene. The left side of the frame should have a lighter area to complement the text column in Amazon's module editor. Target emotional state: ${emo[2] || emo[0] || 'trust and confidence'}. Shallow depth-of-field background. No text in generated image. ${COMPLIANCE}`,

    'description-text': `TEXT MODULE — No image to generate. Write Amazon A+ Content copy for ${p} by ${b}. Tone: ${tone}. Target: ${aud}. Key benefits: ${ben.map(x => `• ${x}`).join(' ')}. ${pain.length ? `Pain points to address: ${pain.map(x => `• ${x}`).join(' ')}.` : ''} Rules: no pricing, no superlatives like "best" or "#1", no competitor brand mentions, no unverified claims, no customer reviews.`,

    'comparison-chart': `Amazon A+ Content comparison chart images for ${p}. Portrait format per product slot. ${p} as featured product: vivid studio photography, white background, accurate proportions, real texture, soft directional lighting, clean shadow, product centered filling 80% of frame. Secondary alternative product slots: same composition but muted, desaturated. ${p} should appear visually superior. Competitive advantages: ${adv.slice(0, 3).join('; ') || ben.slice(0, 3).join('; ')}. No pricing text in images. ${COMPLIANCE}`,

    'three-images-text': `Amazon A+ Content three-image Problem→Solution→Result series for ${p}. Three square images, consistent warm lifestyle lighting and color treatment. Image 1 (Challenge): visualize the pain point "${pain[0] || 'the problem this product solves'}" — authentic relatable scene. Image 2 (Solution): ${p} in active use solving the problem, studio-quality photography. Image 3 (Result): the outcome — ${emo[0] || ben[0] || 'satisfaction achieved'} — aspirational and authentic. No text in any generated image. Text descriptions are added below each image in Amazon's module editor. ${COMPLIANCE}`,

    'premium-header': `Amazon Premium A+ Content full-width hero banner for ${p} by ${b}. Ultra-wide landscape at 1464×600 px — cinematic production quality. Preserve the upper third as a clean zone for text overlay. ${p} as the undeniable hero: ultra-sharp studio photography, perfect color accuracy, dramatic studio lighting with deep shadows on one side and bright highlights on the other. Background: premium lifestyle environment consistent with ${aud}, shallow depth-of-field. Brand tone: ${tone}. Mood: ${emo[0] || 'premium aspirational'}. ${COMPLIANCE}`,

    'premium-full-bg-text': `Amazon Premium A+ Content immersive full-background image for ${p}. Wide landscape at 1464×625 px — the entire image is the backdrop for a text overlay. Cinematic lifestyle scene, rich and detailed. ${p} present in the scene but supporting the story rather than dominating. Leave a clean uncluttered center zone for headline text overlay. Rich color palette, emotional depth, atmospheric cinematic lighting. Key benefit story: ${ben[0] || 'core value proposition'}. Mood: ${emo[0] || 'aspirational premium'}. ${COMPLIANCE}`,

    'premium-light-overlay': `Amazon Premium A+ Content banner with light text zone for ${p}. Wide landscape at 1464×350 px — keep the left 50% as a bright clean area for light-colored headline text. Right side: ${p} in premium context, vivid studio quality. Background: bright premium lifestyle setting for ${aud}. Key message: ${ben[0] || 'primary benefit'}. Even bright inviting lighting. ${COMPLIANCE}`,

    'premium-dark-overlay': `Amazon Premium A+ Content banner with dark text zone for ${p}. Wide landscape at 1464×350 px — keep the right 50% as a rich dark area for dark-colored headline text. Left side: ${p} dramatically lit, premium quality. Background: rich moody premium scene. Key message: ${ben[1] || ben[0] || 'premium benefit'}. Mood: ${emo[0] || 'luxury confidence'}. ${COMPLIANCE}`,

    'premium-single-image': `Amazon Premium A+ Content large feature image for ${p}. Full-width landscape at 1464×600 px — ultra-premium single product showcase. ${p} at a dramatic three-quarter angle with cinema-grade studio lighting: deep rich shadows, brilliant highlights, every surface detail razor sharp. Premium neutral or contextual background. Key quality signal: ${adv[0] || ben[0] || 'signature feature'}. ${COMPLIANCE}`,

    'premium-two-image-text': `Amazon Premium A+ Content — 2 premium feature images for ${p}. Portrait format at 362×453 px each. Consistent premium studio or lifestyle aesthetic. Image 1: visualize "${ben[0] || 'key benefit 1'}" — product in context, studio-quality. Image 2: visualize "${ben[1] || ben[0] || 'key benefit 2'}" — complementary angle or use context. Both: warm premium lighting, accurate color, shallow depth-of-field. Space below each for text added in Amazon's module editor. ${COMPLIANCE}`,

    'premium-three-image-text': `Amazon Premium A+ Content — 3 cinematic storytelling images for ${p}. Portrait format at 362×453 px each. Premium consistent lighting and color. Image 1 (Challenge): "${pain[0] || 'the problem'}" — authentic relatable scene. Image 2 (Solution): ${p} in active use, studio-quality. Image 3 (Transformation): ${emo[0] || ben[0] || 'the positive outcome'} — aspirational, emotionally resonant. No text in images. ${COMPLIANCE}`,

    'premium-four-image-text': `Amazon Premium A+ Content — 4 premium feature images for ${p}. Portrait format at 362×453 px each. Consistent premium aesthetic, cinematic lighting. Image 1: "${ben[0] || 'benefit 1'}". Image 2: "${ben[1] || ben[0] || 'benefit 2'}". Image 3: "${ben[2] || ben[0] || 'benefit 3'}". Image 4: "${ben[3] || ben[0] || 'benefit 4'}". Each: lifestyle or studio context visually demonstrating the benefit. No text in images. ${COMPLIANCE}`,

    'premium-four-image-highlight': `Amazon Premium A+ Content — 4 square highlight images for ${p}. Square format at 362×362 px each. Gallery-quality studio production. Image 1: product hero shot — premium three-quarter angle, dramatic lighting. Image 2: close-up detail of key feature — ${ben[0] || 'signature feature'}, macro precision. Image 3: lifestyle context — ${p} in use for ${aud}. Image 4: material or craftsmanship proof shot. All: ultra-sharp, premium color, consistent treatment. ${COMPLIANCE}`,

    'premium-comparison-chart': `Amazon Premium A+ Content comparison chart for ${p}. Portrait format at 150×300 px per slot. ${p} as featured product: premium vivid studio photography, accurate color, white background, soft shadow. Competitive advantages: ${adv.slice(0, 3).join('; ') || ben.slice(0, 3).join('; ')}. Our product appears visually superior — vibrant vs muted/desaturated competitor slots. Up to 6 comparison slots. No pricing in images. ${COMPLIANCE}`,

    'premium-hotspot': `Amazon Premium A+ Content hotspot base image for ${p}. Full-width landscape at 1464×600 px — large detailed product shot for interactive hotspot overlays. ${p} at a revealing angle clearly exposing 4–6 distinct feature areas. Studio-quality ultra-sharp photography, accurate color, premium lighting. Features to expose: ${ben.slice(0, 5).join(', ') || 'key product features'}. White or near-white background. Product fills at least 70% of the frame. No text in generated image — callout text is added via hotspot overlays in Amazon's module editor. ${COMPLIANCE}`,

    'premium-carousel': `Amazon Premium A+ Content carousel — 5 images for ${p}. Portrait format at 362×453 px each. Premium consistent aesthetic across all 5. Slide 1: hero product shot, dramatic lighting. Slide 2: feature highlight — ${ben[0] || 'key feature'}, product in context. Slide 3: lifestyle usage — ${aud} using product authentically. Slide 4: detail close-up — quality craftsmanship or key material. Slide 5: packaging or brand story element. Consistent warm premium color grade across all slides. ${COMPLIANCE}`,

    'premium-video': `VIDEO THUMBNAIL — Generate a static cover image for the ${p} video module. Wide format at 1920×1080 px. Cinematic single frame: ${p} as hero with dramatic lighting, motion-suggesting composition. Brand tone: ${tone}. Emotional hook: ${emo[0] || 'compelling and watchable'}. The thumbnail must make a viewer want to press play. ${COMPLIANCE}`,

    'premium-nav-carousel': `Amazon Premium A+ Content navigation thumbnails — 6 square thumbnails for ${p}. Square format at 362×362 px each. Each thumbnail clearly represents a section: 1. Product overview. 2. Key features. 3. Benefits. 4. How to use. 5. Specifications. 6. Brand story. Consistent visual style, color, and lighting across all 6. Clearly distinct subject matter for intuitive navigation. ${COMPLIANCE}`,

    'premium-qa': `TEXT MODULE — No image to generate. Write Premium Q&A content for ${p} by ${b}. Write 5 helpful Q&A pairs covering: product use cases, key differentiators (${adv.slice(0, 2).join(', ') || ben.slice(0, 2).join(', ')}), target customer (${aud}), and common objections. Tone: ${tone}. Rules: no pricing, no superlatives, no competitor brand names, no unverified claims, no customer reviews.`,
  }

  return prompts[moduleType] || `Create a professional Amazon A+ Content image for ${p} by ${b}. Target: ${aud}. Key benefit: ${ben[0] || 'primary benefit'}. Tone: ${tone}. Style: premium, photorealistic, Amazon-compliant. ${COMPLIANCE}`
}

function APlusContent() {
  // Content type selection
  const [contentType, setContentType] = useState('standard') // 'standard' | 'premium'

  // ASIN input
  const [asinValue, setAsinValue] = useState('')
  const [marketplace, setMarketplace] = useState('US')
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
  const [generatingModules, setGeneratingModules] = useState({}) // instanceId → bool
  const [moduleErrors, setModuleErrors] = useState({})           // instanceId → string|null
  const [showGuidelines, setShowGuidelines] = useState(true)

  // Generate All state
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generateAllProgress, setGenerateAllProgress] = useState(null)
  const cancelAllRef = useRef(false)

  // Validation
  const isValidASIN = (asin) => /^[A-Z0-9]{10}$/i.test(asin)
  const canAddModule = selectedModules.length < 7

  // Product lookup for AI prompt personalisation
  const [product, setProduct] = useState(null)
  const [asinLoading, setAsinLoading] = useState(false)
  const [asinError, setAsinError] = useState(null)

  const buildCampaignData = (p) => {
    const bullets = p?.bullets || []
    return {
      productName: p?.title || 'the product',
      brandName: p?.brand || 'the brand',
      targetAudience: 'Amazon shoppers',
      keyBenefits: bullets.slice(0, 5),
      painPoints: [],
      emotionalTriggers: ['confidence', 'satisfaction', 'great value'],
      competitiveAdvantages: bullets.slice(0, 3),
      toneOfVoice: 'Professional, trustworthy, helpful',
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
        aiPrompt: generateModulePrompt(moduleType, product ? buildCampaignData(product) : undefined),
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

  // Map module dimensions to the nearest standard aspect ratio string
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

  // Generate AI images for a module — calls the existing /api/generate endpoint
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
        generated.push({
          url: result.url,
          preview: result.url,
          name: 'AI Generated',
          isGenerated: true,
          prompt,
        })
      }
      // Merge into existing images array preserving any manually uploaded slots
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

  const cloudDrafts = useDrafts('aplus_content')

  const handleLoadDraft = (draft) => {
    const d = draft.data
    if (d.asinValue) setAsinValue(d.asinValue)
    if (d.selectedModules?.length) setSelectedModules(d.selectedModules)
    if (d.moduleData) setModuleData(d.moduleData)
    if (d.productCategory) setProductCategory(d.productCategory)
    cloudDrafts.togglePanel()
  }

  // Generate AI text content for module via /api/content/generate
  const handleSave = () => {
    const saveData = { asinValue, productCategory, selectedModules, moduleData, savedAt: new Date().toISOString() }
    localStorage.setItem('aplus_draft', JSON.stringify(saveData))
    const name = asinValue || `A+ Content ${new Date().toLocaleDateString()}`
    cloudDrafts.save({ name, data: { asinValue, productCategory, selectedModules, moduleData } })
    const prev = document.title
    document.title = '✓ Saved — ' + prev
    setTimeout(() => { document.title = prev }, 1500)
  }

  const handleExport = () => {
    const modules = selectedModules.map(m => ({
      module_type: m.id,
      module_name: m.name,
      dimensions: m.dimensions,
      headline: moduleData[m.instanceId]?.headline || '',
      body: moduleData[m.instanceId]?.body || '',
      highlights: moduleData[m.instanceId]?.highlights || [],
      specs: moduleData[m.instanceId]?.specs || [],
      image_urls: (moduleData[m.instanceId]?.images || [])
        .filter(Boolean)
        .map(img => img.url || img.preview || null)
        .filter(Boolean),
    }))
    const blob = new Blob([JSON.stringify({ asin: asinValue, page_type: 'aplus', modules, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aplus-content-${asinValue || 'draft'}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
        pageType: 'aplus',
        moduleType: module.id,
        marketplace,
      })
      if (result.headline) updateModuleData(instanceId, 'headline', result.headline)
      if (result.body)     updateModuleData(instanceId, 'body',     result.body)
      if (module.textType === 'highlights' && result.highlights?.length)
        updateModuleData(instanceId, 'highlights', result.highlights)
      if (module.textType === 'specs' && result.specs?.length)
        updateModuleData(instanceId, 'specs', result.specs)
    } catch (err) {
      setModuleErrors(prev => ({ ...prev, [instanceId]: err.message || 'Content generation failed' }))
    } finally {
      setGeneratingModules(prev => ({ ...prev, [instanceId]: false }))
    }
  }

  // Regenerate AI prompt for module
  const regeneratePrompt = (instanceId, moduleType) => {
    const newPrompt = generateModulePrompt(moduleType, product ? buildCampaignData(product) : undefined)
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
            disabled={!!generatingModules[module.instanceId]}
            onClick={() => generateModuleImage(module.instanceId)}
          >
            {generatingModules[module.instanceId] ? (
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
          {moduleErrors[module.instanceId] && (
            <p className="ai-prompt-hint" style={{ color: 'var(--error)' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
              {moduleErrors[module.instanceId]}
            </p>
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
                          contentType="aplus_content"
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
              disabled={!!generatingModules[module.instanceId]}
            >
              {generatingModules[module.instanceId] ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
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
    const imageCount = module.imageCount || 1
    const images = data.images || []

    return (
      <div className={`module-preview preview-${module.id}`}>
        <div className="preview-module-label">{module.preview} {module.name} <span className="preview-dims">{module.dimensions}</span></div>

        {/* Images */}
        {!module.textOnly && (
          imageCount > 1 ? (
            <div className="preview-image-grid" style={{ gridTemplateColumns: `repeat(${Math.min(imageCount, 4)}, 1fr)` }}>
              {Array.from({ length: imageCount }).map((_, idx) => (
                <div key={idx} className="preview-image-slot">
                  {images[idx]?.preview
                    ? <img src={images[idx].preview} alt={`img-${idx + 1}`} />
                    : <div className="preview-placeholder-sm"><Image size={16} /><span>{idx + 1}</span></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="preview-image-single">
              {images[0]?.preview
                ? <img src={images[0].preview} alt="Module image" />
                : <div className="preview-placeholder"><Image size={24} /><span>{module.dimensions}</span></div>}
            </div>
          )
        )}

        {/* Text content */}
        {(data.headline || data.body || data.highlights?.length || data.specs?.length) && (
          <div className="preview-text-block">
            {data.headline && <h4 className="preview-headline">{data.headline}</h4>}
            {data.body && <p className="preview-body">{data.body}</p>}
            {data.highlights?.filter(Boolean).length > 0 && (
              <ul className="preview-highlights">
                {data.highlights.filter(Boolean).map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
            {data.specs?.filter(s => s?.label).length > 0 && (
              <table className="preview-specs-table">
                <tbody>
                  {data.specs.filter(s => s?.label).map((s, i) => (
                    <tr key={i}><td className="spec-label">{s.label}</td><td>{s.value}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!data.headline && !data.body && !images[0]?.preview && (
          <div className="preview-empty-hint">No content yet — expand module to generate</div>
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
              {selectedModules.length}/7 modules
            </span>
          </div>
          <div className="toolbar-right">
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
            <button
              className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>
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
