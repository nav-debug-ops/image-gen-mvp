/**
 * Research-backed image prompt strategies for all 20 Amazon product categories.
 * Derived from analysis of 400 top-performing and high-CTR product main images.
 *
 * Each category defines:
 *  - topPerforming: proven safe approach used by bestsellers (high BSR, high review count)
 *  - highCtr:       visually distinctive approach to maximize click-through in search results
 *  - recommendedTemplates: template IDs that work best for this category
 *  - insight: one-line tip from research data
 *  - ctrDifferentiator: what visually separates High-CTR from Top-Performing in this category
 */

export const CATEGORY_PROMPTS = {
  'Electronics': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: '45-degree three-quarter front angle showing controls and depth',
      lighting: 'even diffused studio lighting with subtle fill shadows, highlight metallic and glossy surfaces without blown-out glare',
      scale: 'product fills 85-90% of frame',
      extras: 'show all included accessories and components organized cleanly, no text overlays, sharp edges',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'dynamic perspective with slight elevation, emphasizing ports and premium design details',
      lighting: 'dramatic studio lighting with deep shadow on one side creating depth, screen showing vivid UI if applicable, LED indicators glowing',
      scale: 'product fills 90% of frame with commanding presence',
      extras: 'bold product color as primary visual hook, glowing display or LED elements if present, deep blacks and bright accent colors, crisp reflective highlights on surfaces',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'angles', 'accessories', 'multi-angle', 'bundle'],
    insight: '90%+ of top sellers use pure white with product-only shots. High-CTR adds glowing screens and bold color pops.',
    ctrDifferentiator: 'Bold product color or glowing display UI visible at thumbnail size',
  },

  'Home & Kitchen': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on or slight elevation angle showing full product form',
      lighting: 'even soft studio lighting revealing material textures — stainless steel sheen, fabric texture, silicone softness',
      scale: 'product fills 75-85% of frame, slightly more generous padding than electronics',
      extras: 'show product in ready-to-use state where applicable (filled bottle, assembled appliance), no text overlays',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'slight elevation or 3/4 angle with product shown in active state',
      lighting: 'warm inviting lighting enhancing product color saturation, strategic highlight on vibrant product color (teal, rose gold, pink)',
      scale: 'product fills 85% of frame, color or texture as focal point',
      extras: 'vibrant product color as primary differentiator, product in use context (water droplet on bottle, food in bowl), subtle lifestyle prop if naturally occurring',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'in-use', 'complementary', 'premium-lighting', 'angles'],
    insight: 'Color is the #1 differentiator. Vibrant colors (teal, pink, rose gold) drive CTR. Show product in ready-to-use state.',
    ctrDifferentiator: 'Product in use (filled bottle, deployed tool) or vibrant signature color',
  },

  'Beauty & Personal Care': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on for tubes and bottles, slight 3/4 angle for jars to show depth and cap',
      lighting: 'clean clinical lighting with soft diffusion, accurate color rendering, no warm color shift',
      scale: 'product fills 80-90% of frame, single product focus',
      extras: 'cap removed for pumps/droppers showing nozzle, label fully legible, no text overlays, packaging colors true-to-product',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on or slight tilt showing dropper or pump detail',
      lighting: 'backlit or side-lit to create halo effect around serum/liquid if applicable, texture swatch visible, vibrant K-beauty packaging colors saturated',
      scale: 'product fills 85% of frame, close crop on key feature',
      extras: 'product texture swatch alongside container, droplet of serum or cream visible, applicator tool shown separately, vibrant packaging color as visual hook (pink, purple, blue)',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'ingredients', 'element-tag', 'premium-lighting', 'floating'],
    insight: 'Skincare texture swatches and dropper/pump details drive CTR. Vibrant K-beauty packaging colors outperform clinical white packaging.',
    ctrDifferentiator: 'Texture swatch or product droplet/serum shot visible at thumbnail',
  },

  'Sports & Outdoors': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'front-facing or slight dynamic angle suggesting readiness for activity',
      lighting: 'bright even lighting emphasizing neon and bold colors, clean product definition',
      scale: 'product fills 80-85% of frame',
      extras: 'equipment shown fully assembled and ready to use, all included accessories visible for kits',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'dynamic angle suggesting motion or athletic use, slight action-ready perspective',
      lighting: 'high-contrast lighting emphasizing neon yellow, electric blue, or bright orange colorways, bold shadows for dimensionality',
      scale: 'product fills 88% of frame with energetic presence',
      extras: 'bold neon or bright product color as primary hook, motion-suggesting angle, key feature visible (stitching on ball, grip pattern on handle), ergonomic design highlighted',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'in-use', 'with-hand', 'angles', 'bundle'],
    insight: 'Bold neon and bright colors (neon yellow, electric blue, orange) significantly outperform neutral colorways in CTR. Action angles beat static.',
    ctrDifferentiator: 'Bold neon/bright color with motion-implying angle',
  },

  'Toys & Games': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'front-facing showing complete assembled product or full set',
      lighting: 'bright even studio lighting making primary colors (red, blue, yellow) vibrant and appealing',
      scale: 'product fills 80-90% of frame, all main pieces visible',
      extras: 'toy shown fully assembled or in play-ready state, multiple components shown together demonstrating play value, not in packaging',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'slight 3/4 angle or front-facing with key play feature visible',
      lighting: 'vibrant saturated lighting making primary colors pop, licensed character prominently lit',
      scale: 'product fills 88% of frame',
      extras: 'bright primary colors (red, blue, yellow) as visual anchor, licensed character face prominently shown if applicable, multiple pieces arranged to show scope and play value, building toys show completed masterpiece build',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'angles', 'bundle', 'multi-angle', 'accessories'],
    insight: 'Bright primary colors and licensed character faces drive clicks. Show all pieces — visual abundance signals value to parents.',
    ctrDifferentiator: 'Licensed character face or bright primary color pop with full set displayed',
  },

  'Clothing & Apparel': {
    topPerforming: {
      background: 'pure white background #FFFFFF (Amazon policy mandatory)',
      angle: 'flat-lay front-facing for casual wear, ghost mannequin for structured garments',
      lighting: 'even diffused lighting with accurate color rendering, fabric texture visible',
      scale: 'garment fills 85% of frame, full item visible',
      extras: 'product-ready state (no packaging), tags may be visible for authenticity, color true-to-product, single garment focus',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'ghost mannequin creating 3D shape visualization, or on-model shot if Amazon compliant',
      lighting: 'lighting emphasizing fabric texture (ribbed knit, fleece, denim) and garment shape',
      scale: 'garment fills 88% of frame with full silhouette visible',
      extras: 'ghost mannequin for 3D shape vs flat competitors, fabric texture clearly visible at thumbnail (ribbing, weave, fleece), color accuracy as trust signal, clear garment shape communicating fit',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'angles', 'size-compare', 'with-hand', 'premium-lighting'],
    insight: 'Ghost mannequin showing 3D shape dramatically outperforms flat-lay for CTR. Fabric texture visible at thumbnail is key trust signal.',
    ctrDifferentiator: 'Ghost mannequin 3D shape and visible fabric texture vs flat competitor images',
  },

  'Food & Grocery': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on packaging front showing label and branding clearly',
      lighting: 'even neutral lighting, accurate color rendering of packaging, bright and clean',
      scale: 'packaging fills 80-85% of frame, label fully readable',
      extras: 'retail packaging shown prominently with branding clear, multi-pack arrangement if applicable, variety flavors visible for variety packs',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'slight angle for cans/bottles showing depth, straight-on for boxes and bags',
      lighting: 'warm lighting enhancing appetite appeal for food products, packaging colors saturated',
      scale: 'packaging fills 85% of frame, flavor/variety names readable at thumbnail',
      extras: 'bold packaging color as primary attention hook (neon green Monster, Tide orange), flavor variety array showing all options, brand logo readable at small sizes, quantity count visible (12-pack, 30-count)',
    },
    recommendedTemplates: ['white-bg', 'pack-front', 'pack-left', 'bundle', 'quantity', 'angles'],
    insight: 'Bold packaging colors (Celsius teal, Monster neon green) drive CTR. Show flavor variety and pack count clearly — buyers scan value before clicking.',
    ctrDifferentiator: 'Bold packaging color + flavor/variety readable at thumbnail size',
  },

  'Pet Supplies': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'front-facing for packaging, use-angle for accessories and harnesses',
      lighting: 'clean even studio lighting, bright packaging colors accurate',
      scale: 'product fills 80-85% of frame',
      extras: 'packaging front-facing for consumables (treats, food, litter), product-only for accessories (beds, harnesses, toys), no pet models in main image per Amazon TOS',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'use-angle showing product in functional position (harness spread, bed viewed from above)',
      lighting: 'lighting emphasizing plush textures (pet beds), packaging colors vibrant',
      scale: 'product fills 85-90% of frame, size immediately apparent',
      extras: 'scale indicator visible for beds and carriers (size chart or dimensional reference), quantity clearly shown for bulk consumables, unique product shape highlighted (harness structure, feeder mechanism), bold product colors (Earth Rated green, KONG red)',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'pack-front', 'size-compare', 'bundle', 'angles'],
    insight: 'Scale indicators and quantity visible at thumbnail are critical for pet supply CTR. No pet models in main images per Amazon policy.',
    ctrDifferentiator: 'Scale indicator + quantity visible, or unique product structure clearly shown',
  },

  'Health & Household': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'packaging front-facing for household consumables, label-facing for supplements',
      lighting: 'bright neutral studio lighting, packaging colors true-to-product',
      scale: 'packaging fills 75-85% of frame',
      extras: 'retail packaging shown prominently, multi-pack quantities arranged to show value (stacked rolls, organized pack), brand logo readable, quantity count visible',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on or slight angle for bottles, stacked arrangement for multi-packs',
      lighting: 'lighting enhancing packaging color saturation (Bounty yellow, Tide orange, Energizer gold)',
      scale: 'packaging fills 85% of frame, pack count readable at thumbnail',
      extras: 'bold packaging color as instant brand recognition hook (Bounty yellow, Tide orange, Charmin blue, Energizer gold), multi-pack arrangement showing abundance, dosage or count prominently displayed, brand logo readable at small sizes',
    },
    recommendedTemplates: ['white-bg', 'pack-front', 'bundle', 'quantity', 'quality-cert', 'shadow'],
    insight: 'Bold packaging colors (Tide orange, Bounty yellow) are the strongest CTR drivers. Multi-pack count visible at thumbnail is critical for value communication.',
    ctrDifferentiator: 'Bold iconic packaging color (yellow, orange, blue) + multi-pack count readable at thumbnail',
  },

  'Baby Products': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'front-facing packaging for consumables (diapers, wipes), 3/4 view for gear',
      lighting: 'soft warm lighting tone, pastel packaging colors accurate, gentle feel',
      scale: 'product fills 75-85% of frame',
      extras: 'trust signals visible on packaging (hypoallergenic, pediatrician-recommended, dermatologist-tested), multi-pack count visible for wipes and diapers, safety certifications visible',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: '3/4 angle for gear showing all features, front-facing for packaging with count prominent',
      lighting: 'soft pastel-complementing lighting, warmth suggesting safety and gentleness',
      scale: 'product fills 85% of frame',
      extras: 'safety certification badges visible (pediatrician-recommended, hypoallergenic), pack count or wipe count readable at thumbnail, pastel packaging colors communicating baby-specific product, trust signals leading the visual hierarchy',
    },
    recommendedTemplates: ['white-bg', 'pack-front', 'bundle', 'quantity', 'quality-cert', 'shadow'],
    insight: 'Safety trust signals (pediatrician-recommended) visible in thumbnail drive CTR. Pack count must be readable — parents scan value immediately.',
    ctrDifferentiator: 'Safety certification signal + clear count visible at thumbnail size',
  },

  'Automotive': {
    topPerforming: {
      background: 'pure white background #FFFFFF or light neutral gray',
      angle: '45-degree angle or straight-on showing product functionality and design',
      lighting: 'even cool-white studio lighting, eliminating harsh shadows, accurate product color',
      scale: 'product fills 65-80% of frame with slight padding for context',
      extras: 'product shown fully assembled and functional, scale reference if needed, all parts included organized, no lifestyle context except subtle car interior hint for interior products',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: '3/4 angle showing product features, controls, and key design details',
      lighting: 'high-contrast lighting emphasizing bold brand colors (red, blue, safety yellow), LED indicator lights glowing if present',
      scale: 'product fills 80% of frame with bold color presence',
      extras: 'bold brand color (red, safety blue) as visual anchor, LED or digital display showing active state, scale indicator showing product size, key feature (PSI rating, magnetic strength) implied visually',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'angles', 'size-compare', 'accessories', 'feature-callout'],
    insight: 'Bold colors (red, blue, safety yellow) and glowing LED displays drive CTR in automotive. Scale references are crucial for buyer confidence.',
    ctrDifferentiator: 'Bold brand color (red/blue) + visible LED/digital display in active state',
  },

  'Tools & Home Improvement': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: '3/4 view for power tools showing battery, trigger, and chuck simultaneously',
      lighting: 'even studio lighting, brand colors accurately rendered (DeWalt yellow, Milwaukee red, Makita teal)',
      scale: 'tool fills 75-85% of frame, full tool visible including battery and accessories',
      extras: 'all included accessories and bits organized around tool, battery inserted and visible, safety guards in place, brand logo prominent',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: '3/4 dynamic angle implying power and readiness to work',
      lighting: 'bold lighting saturating brand colors (DeWalt yellow, Milwaukee red), subtle shadow giving weight and solidity',
      scale: 'tool fills 85% of frame with commanding presence',
      extras: 'brand color (DeWalt yellow, Milwaukee red, Klein orange) as immediate recognition signal, kit contents arranged to show full value scope, battery and charger included if applicable, brushless or key spec badge visible',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'angles', 'accessories', 'bundle', 'multi-angle'],
    insight: 'Brand colors (DeWalt yellow, Milwaukee red) are the #1 CTR driver. Kit contents shown completely signals superior value over single-item listings.',
    ctrDifferentiator: 'Iconic brand color (yellow/red/orange) + complete kit contents visible',
  },

  'Office Products': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'flat-lay or slight elevation for stationery, straight-on for paper and supplies',
      lighting: 'clean even lighting, accurate product color for planners and notebooks',
      scale: 'product fills 70-80% of frame',
      extras: 'paper products show packaging with count visible, planners shown closed with cover clearly visible, marker sets shown all colors together',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'planners open at 45-degree angle showing interior layout, markers fanned or fanned-rainbow arrangement',
      lighting: 'vibrant lighting enhancing colorful cover art, marker colors fully saturated',
      scale: 'product fills 80-85% of frame with color as anchor',
      extras: 'planners open showing sample spreads with visible organization features (tabs, monthly/weekly layout), marker sets fanned to display full color range as rainbow, bold cover color for planners/journals, colorful product as primary differentiator against neutral competitors',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'pack-open', 'bundle', 'angles', 'premium-lighting'],
    insight: 'Open planners showing interior organization and fanned marker sets displaying all colors consistently outperform closed/single-item shots in CTR.',
    ctrDifferentiator: 'Open interior showing organization features, or color array fanned as rainbow display',
  },

  'Garden & Outdoor': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on for tools and gloves, slight elevation for hoses and planters',
      lighting: 'bright natural-feeling lighting, accurate greens and earth tones',
      scale: 'product fills 70-80% of frame',
      extras: 'tools shown fully assembled with all attachments, seed packets show front label with variety details, gloves shown as pair',
    },
    highCtr: {
      background: 'pure white background #FFFFFF with glow effect for solar products',
      angle: 'straight-on or slight elevation with glowing effect for solar lights',
      lighting: 'solar lights shown with LED glow effect illuminated, plant-related products with warm natural-feeling light, vibrant seed packet colors saturated',
      scale: 'product fills 80% of frame',
      extras: 'solar LED glow effect creating warm light halo (unique vs all-off competitors), seed packets showing photo of mature plant alongside packet, bright product colors (colored planters, gloves), multi-pack quantity of solar lights arranged showing collection',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'bundle', 'size-compare', 'pack-front', 'premium-lighting'],
    insight: 'Solar lights with glowing LED effect and seed packets showing mature plant photos dramatically outperform plain off-state products in CTR.',
    ctrDifferentiator: 'Solar light glow effect or vibrant plant/flower color showing expected result',
  },

  'Arts, Crafts & Sewing': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'flat-lay for markers and supplies, slight angle for 3D kits showing contents',
      lighting: 'bright even lighting making colors vibrant and accurate',
      scale: 'product fills 75-85% of frame, all pieces visible for kits',
      extras: 'marker sets shown all colors together, kits shown with all components organized, color accuracy critical for craft supplies',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'markers/picks fanned in rainbow arc showing all colors, beads shown in open compartment kit',
      lighting: 'vibrant saturated lighting maximizing color impact of rainbow arrays',
      scale: 'product fills 85% of frame with color as dominant visual',
      extras: 'marker set fanned as rainbow gradient showing all colors at once, guitar picks or beads arranged in rainbow color array, open compartment kits showing colorful bead inventory, completed sample project alongside supplies to demonstrate creative potential',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'pack-open', 'bundle', 'before-after', 'complementary'],
    insight: 'Rainbow color arrays (fanned markers, sorted beads) are the single biggest CTR driver in arts and crafts. Show completed project alongside supplies.',
    ctrDifferentiator: 'Rainbow color array (fanned markers/picks/beads) as dominant visual element',
  },

  'Industrial & Scientific': {
    topPerforming: {
      background: 'pure white or light neutral gray background',
      angle: 'straight-on or 3/4 view showing functional design clearly',
      lighting: 'clean industrial studio lighting, no-nonsense product focus',
      scale: 'product fills 70-80% of frame',
      extras: 'single product or organized multi-pack, quantity clearly visible for bulk items, scale reference for size-critical products (gloves on white background, cable ties in bundle)',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: '3/4 angle showing key functional details and brand markings',
      lighting: 'high-contrast lighting emphasizing safety color coatings (orange, yellow, ANSI green) and LED indicators',
      scale: 'product fills 80% of frame',
      extras: 'safety color (ANSI orange, safety yellow) as primary attention hook, LED indicator lights glowing on label printers and electronic equipment, organized grid of magnets or cable tie quantity showing abundant value, brand identity marks visible',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'bundle', 'quantity', 'size-compare', 'angles'],
    insight: 'Safety colors (orange, yellow) and organized quantity grids drive CTR. Scale indicators critical — industrial buyers need size confidence before clicking.',
    ctrDifferentiator: 'Safety color (orange/yellow) or LED glow + organized quantity grid showing value',
  },

  'Musical Instruments': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on from front for instruments, 3/4 angle for gear and microphones',
      lighting: 'even warm studio lighting enhancing wood grain on acoustic instruments, accurate color for guitars',
      scale: 'instrument fills 80-90% of frame, full body visible for guitars/ukuleles',
      extras: 'all included accessories visible (picks, strap, gig bag for beginner kits), brand headstock visible on instruments, electronics shown with cable and power supply',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on or dynamic 3/4 angle highlighting instrument color and finish',
      lighting: 'lighting emphasizing sunburst finish gradients, metallic shimmer on cymbals, bold instrument color saturation',
      scale: 'instrument fills 88% of frame',
      extras: 'bold instrument color as primary hook (red electric guitar, natural wood acoustic), sunburst finish or metallic sheen visible, complete beginner kit layout showing full value (guitar + picks + strap + tuner + gig bag), cymbal sheen and bronze color highlighted',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'angles', 'accessories', 'bundle', 'premium-lighting'],
    insight: 'Instrument color and finish (sunburst gradients, metallic cymbal sheen) drive CTR. Beginner kits showing all included items outperform single-instrument listings.',
    ctrDifferentiator: 'Bold instrument color/finish or complete starter kit layout showing all included items',
  },

  'Books & Media': {
    topPerforming: {
      background: 'pure white background #FFFFFF',
      angle: 'straight-on front cover, full book visible',
      lighting: 'clean even lighting, cover artwork colors accurate',
      scale: 'cover fills 80-88% of frame',
      extras: 'cover art is the product — show it fully and clearly, author name and title readable, series number visible for series books',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: 'slight 3/4 tilt showing cover depth, or open-flat showing interior for planners and journals',
      lighting: 'dramatic lighting for bold cover art (high contrast), warm lighting for journals and planners showing interior spread',
      scale: 'cover fills 85% of frame, title and key art bold',
      extras: 'bold cover art colors (red, navy, gold, black) as primary visual hook, title large and readable at thumbnail, journal open to sample spread showing organization features, coloring book open showing detailed artwork quality, series displayed as stack showing scope',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'pack-open', 'angles', 'bundle', 'size-compare'],
    insight: 'Bold cover art colors (red, navy, gold) drive CTR for books. Open journals showing sample interior spreads dramatically outperform closed-cover shots.',
    ctrDifferentiator: 'Bold cover art color with readable title, or open interior showing quality content',
  },

  'Jewelry & Watches': {
    topPerforming: {
      background: 'pure white or clean gradient background',
      angle: '3/4 angle for watches showing face, case, and band; flat-lay or neck bust for jewelry',
      lighting: 'jewelry-specific bright directional lighting creating sparkle and brilliance on stones',
      scale: 'jewelry fills 80-90% of frame, detail visible',
      extras: 'single piece focus, maximum sparkle from strategic lighting, watch face showing readable dial, necklace on white neck bust or floating showing drape',
    },
    highCtr: {
      background: 'pure white or soft gradient background',
      angle: '3/4 angle for watches showing complete face and band, necklace on neck bust for context',
      lighting: 'dramatic sparkle lighting creating visible brilliance on gemstones, strategic highlight on rose gold or gold tones, Apple Watch showing vivid screen UI',
      scale: 'jewelry fills 88% of frame with maximum brilliance',
      extras: 'sparkle and shimmer effects from strategic multi-point lighting on diamonds/crystals, rose gold tone highlighted as premium modern signal, smartwatch screen showing active health data UI, gifting packaging (velvet box) subtly included for gifting signal, lifestyle context (wrist shot) minimal but present',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'floating', 'premium-lighting', 'with-hand', 'platform'],
    insight: 'Strategic sparkle lighting creating brilliance on stones is the #1 CTR driver. Rose gold finish and smartwatch screen UI are strong secondary hooks.',
    ctrDifferentiator: 'Visible sparkle/shimmer from strategic lighting + rose gold tone or smartwatch UI',
  },

  'Shoes & Handbags': {
    topPerforming: {
      background: 'pure white background #FFFFFF (Amazon policy)',
      angle: '3/4 front-facing angle showing toe box, profile, side panel, and partial sole simultaneously',
      lighting: 'even diffused lighting, accurate color rendering, material texture visible',
      scale: 'pair of shoes fills 80-88% of frame, both shoes shown',
      extras: 'shoes shown as pair at complementary angles, no model or foot, bags shown stuffed and shaped showing true form with strap and hardware visible',
    },
    highCtr: {
      background: 'pure white background #FFFFFF',
      angle: '3/4 front angle for shoes showing distinctive design element, overhead or front for bags',
      lighting: 'lighting emphasizing material texture (leather grain, canvas weave, shearling fluff) at thumbnail size, color accuracy for fashion-critical purchases',
      scale: 'shoes fill 88% of frame with color as dominant element',
      extras: 'bold distinctive colorway as primary hook (neon Crocs, tie-dye patterns, candy colors), material texture visible at small size (pebbled leather, shearling, suede), hardware details on bags (golden clasps, logo hardware) highlighted, unique design feature visible (distinctive toe box shape, signature strap)',
    },
    recommendedTemplates: ['white-bg', 'shadow', 'angles', 'premium-lighting', 'multi-angle', 'size-compare'],
    insight: 'Bold distinctive colorways (neon Crocs, tie-dye) drive CTR over neutral tones. Material texture (leather grain, shearling) must be visible at thumbnail size.',
    ctrDifferentiator: 'Bold distinctive colorway or material texture (shearling/leather) visible at thumbnail',
  },
}

// ─── Shared base requirements (Amazon-compliant, always appended) ────────────
const BASE = 'Pure white background #FFFFFF — no texture, gradient, or vignette. Product stays fully within the frame with generous white margin on all four sides — nothing cropped or touching any edge. Entire product in crisp focus front-to-back, resolution sufficient for Amazon zoom. Real photorealistic render — NOT illustration, NOT 3D render, NOT digital art, NOT sketch.'

/**
 * Builds a per-template, category-aware, strategy-sensitive prompt for
 * Amazon main image generation. Each of the 35 templates gets its own
 * precise composition instructions layered with category strategy.
 *
 * @param {string} templateName - Template name from TEMPLATES array
 * @param {string} category     - Product category (must match CATEGORY_PROMPTS keys)
 * @param {string} strategy     - 'top-performing' | 'high-ctr'
 * @param {string} productDesc  - Optional product description / ASIN title
 * @returns {string} Full prompt string ready for image generation
 */
export function buildImagePrompt(templateName, category, strategy = 'top-performing', productDesc = '') {
  const n         = templateName.toLowerCase()
  const catData   = CATEGORY_PROMPTS[category]
  const isHiCtr   = strategy === 'high-ctr'
  const cat       = catData ? (isHiCtr ? catData.highCtr : catData.topPerforming) : null
  const p         = productDesc || 'the product'

  // Category-resolved defaults (fallback when no category selected)
  const catAngle    = cat?.angle    || (isHiCtr ? 'dynamic three-quarter front angle revealing depth and premium design details' : 'clean straight frontal angle for maximum product clarity')
  const catLight    = cat?.lighting || (isHiCtr ? 'high-contrast studio lighting with deep shadows on one side creating drama and depth' : 'bright even diffused studio lighting with no harsh shadows, accurate color and texture')
  const catExtras   = cat?.extras   || ''
  const catScale    = cat?.scale    || 'product fills 85–90% of the square frame'

  const drama = isHiCtr
    ? 'Composition and lighting are calibrated to stop the scroll and stand out on a crowded Amazon search page.'
    : 'Even lighting and honest angle ensure immediate product recognition and buyer trust at thumbnail size.'

  // ─── BASIC ──────────────────────────────────────────────────────────────────

  // Plain White Background
  if (/plain white|white.?bg|white background/.test(n)) {
    return `Amazon main product image — pure product shot, fully Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. No shadow, no props, no tags, no packaging, no text of any kind. ${catLight}. Every surface detail, color, and texture is rendered with perfect fidelity. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Product with Shadow
  if (/shadow/.test(n)) {
    const shadow = isHiCtr
      ? 'a bold directional shadow cast to one side, adding dramatic depth and three-dimensionality'
      : 'a soft natural drop shadow directly beneath the product, grounding it on the white surface without distraction'
    return `Amazon main product image — product with natural shadow, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. ${catLight}. ${shadow}. No text, tags, packaging or overlays of any kind — only the product and its shadow. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // On Platform / Pedestal
  if (/platform|pedestal/.test(n)) {
    const platform = isHiCtr
      ? 'a sleek minimal geometric platform or pedestal in matte white or light grey — the platform elevates the product and adds a premium luxury retail feel'
      : 'a clean simple white platform or block raising the product slightly, creating a subtle sense of elevation and quality'
    return `Amazon main product image — product on platform, Amazon-compliant. ${p} is displayed on ${platform}, shot from a slightly low three-quarter angle looking up, giving the product a commanding presence. ${catScale}. ${catLight}. Soft shadow beneath the platform base. No text, tags or overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Different Angles
  if (/^different angle|angles$/.test(n)) {
    return `Amazon main product image — three-quarter angle shot, Amazon-compliant. ${p} is shown at a deliberate three-quarter front angle revealing both the primary face and the side profile simultaneously, ${catScale}. This angle communicates depth, construction quality, and premium design in a single frame. ${catLight}. A clean soft shadow beneath the product. No text, tags or overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Floating
  if (/floating/.test(n)) {
    const glow = isHiCtr
      ? 'with a very subtle, barely-there ambient glow around the product suggesting lightness and premium energy'
      : 'appearing weightless and pristine — no shadow, no ground plane, clean infinite white'
    return `Amazon main product image — floating product, Amazon-compliant. ${p} floats at mid-height in the center of the frame, ${catScale}, ${glow}. No shadow beneath the product — it hovers in pure clean white space. ${catLight}. No text, tags, packaging or overlays. The weightless float communicates lightness, precision engineering, or premium quality. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // ─── PACKAGING ──────────────────────────────────────────────────────────────

  // Product + Packaging Left
  if (/pack.*left|packaging.*left/.test(n)) {
    return `Amazon main product image — product with packaging (packaging left), Amazon-compliant. ${p} is positioned in the right two-thirds of the frame at ${catAngle}. Its retail packaging box or sleeve is positioned to the left, slightly behind, front panel clearly visible and readable. Both elements together fill 85% of the square frame. ${catLight}. Soft grounded shadow beneath each element. The packaging shows the brand name and product keyword as printed physical text — never a digital text overlay. No unrelated props or accessories. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Product + Packaging Right
  if (/pack.*right|packaging.*right/.test(n)) {
    return `Amazon main product image — product with packaging (packaging right), Amazon-compliant. ${p} is positioned in the left two-thirds of the frame at ${catAngle}. Its retail packaging is positioned to the right, slightly behind, front panel clearly visible. Both elements together fill 85% of the frame. ${catLight}. Soft grounded shadow beneath each element. Packaging shows brand name and product keyword as printed physical text — never a digital overlay. No unrelated props. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Packaging Front
  if (/pack.*front|packaging.*front/.test(n)) {
    return `Amazon main product image — packaging front-facing shot, Amazon-compliant. The retail packaging of ${p} faces the camera directly, front panel fully readable and centered in the frame, filling 85–90% of the square. ${catLight}. Slight depth shadow on sides of the box to give three-dimensionality. Brand logo, product name, and key product benefits are visible as printed physical text on the packaging — never a digital overlay. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Emerging from Box
  if (/emerg|from.?box/.test(n)) {
    return `Amazon main product image — product emerging from packaging, Amazon-compliant. The retail box or packaging is shown open, with ${p} in the act of being removed from or rising out of the box — creating a dramatic reveal composition. The product is the clear hero: crisp, fully visible, and occupying the upper two-thirds of the frame. The open packaging is in the lower portion, showing its branded front panel. ${catLight}. The scene communicates premium unboxing quality and gift-readiness. No digital text overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Open Display
  if (/open.?display|pack.*open/.test(n)) {
    return `Amazon main product image — open display arrangement, Amazon-compliant. ${p} is shown removed from and displayed alongside its open packaging — the product takes center stage while the open packaging sits beside or behind it, showing interior structure and brand print. All elements fill 85% of the frame. ${catLight}. Clean soft shadows. The arrangement communicates completeness, quality inspection, and gifting readiness. No digital text overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // ─── ELEMENTS ───────────────────────────────────────────────────────────────

  // Product + Ingredients
  if (/ingredient/.test(n)) {
    return `Amazon main product image — product with key ingredients or materials, Amazon-compliant. ${p} is centered and occupies 60% of the frame at ${catAngle}. Arranged naturally around it are 3–5 of its key physical ingredients, raw materials, or component elements — each clearly identifiable, real, and three-dimensional. ${isHiCtr ? 'The arrangement is visually bold and abundant, communicating richness of ingredients.' : 'The arrangement is clean and organized, each ingredient clearly separated from the next.'} ${catLight}. Soft shadow beneath the central product. No text overlays, no digital labels. The ingredients exist as real physical objects only. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // With Accessories
  if (/accessor/.test(n)) {
    return `Amazon main product image — product with included accessories, Amazon-compliant. ${p} is the clear hero, centered and occupying 55–60% of the frame at a slightly elevated three-quarter view. All accessories and included items that come in the box are laid out cleanly around the product — organized, non-overlapping, and clearly subordinate to the main product. ${isHiCtr ? 'Bold organized grid of items communicates high perceived value.' : 'Clean organized arrangement communicates completeness and value.'} ${catLight}. Soft shadows beneath all elements. Only real included accessories — no lifestyle props or digital overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Element + Tag
  if (/element.*tag/.test(n)) {
    return `Amazon main product image — product with element and tag, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. One key visual element (ingredient, material, or defining feature) is placed naturally beside or beneath the product. A single clean physical hang tag is attached to the product, displaying the primary keyword in neat readable typography — this is a real printed tag, never a digital overlay. ${catLight}. Clean soft shadow. No additional props. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Before / After
  if (/before.?after/.test(n)) {
    return `Amazon main product image — before and after split composition, Amazon-compliant. The frame is divided into two equal halves by a clean thin vertical line or subtle spatial separation. The left half shows the "before" state: the problem the product solves, rendered with honest neutral photography. The right half shows the "after" state: the clear benefit result delivered by ${p}, shown powerfully. ${p} itself appears prominently in the "after" half. ${isHiCtr ? 'The contrast is dramatic and immediately legible at thumbnail size.' : 'The contrast is clear and honest.'} ${catLight}. No digital text overlays — the visual contrast tells the story. ${BASE}`
  }

  // Size Comparison
  if (/size.?comp/.test(n)) {
    return `Amazon main product image — size comparison shot, Amazon-compliant. ${p} is shown at ${catAngle} in the center of the frame, filling 60% of the square. Beside it sits a universally familiar neutral scale reference object — such as a standard coin, a common household object, or a ruler — that makes the product's true dimensions immediately clear to the buyer. ${isHiCtr ? 'Bold lighting creates strong product presence while the scale reference remains clearly visible.' : 'Even lighting shows both the product and scale reference with equal clarity.'} ${catLight}. Soft shadows beneath all elements. No text or digital overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // ─── TAGS ───────────────────────────────────────────────────────────────────

  // Corner Tag
  if (/corner.?tag/.test(n)) {
    return `Amazon main product image — product with corner tag, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. A small refined hang tag is attached at the upper or lower corner of the product — clean white tag with a single short ribbon or string, displaying the primary keyword in a minimal dark sans-serif font. The tag is a real physical object, not a digital overlay, and does not cover any key product feature. ${catLight}. Soft natural shadow beneath the product. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Ribbon Badge
  if (/ribbon/.test(n)) {
    return `Amazon main product image — product with ribbon badge, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. An elegant triangular corner ribbon or a classic rosette badge is physically attached to or draped across the upper corner of the product — premium fabric or satin material in white, gold, or black with the primary keyword embossed or printed in clean typography. The ribbon badge is a physical object, not a digital overlay. ${catLight}. Soft natural shadow. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Quantity Indicator
  if (/quantity/.test(n)) {
    return `Amazon main product image — product with quantity indicator, Amazon-compliant. ${p} is shown at ${catAngle}, filling 75% of the frame. A bold physical count tag or sticker is attached to or displayed prominently near the product, clearly showing the pack count, quantity, or piece number in large clean bold typography — this is a printed physical label, not a digital overlay. ${isHiCtr ? 'The count indicator is visually prominent and readable at thumbnail size.' : 'The count indicator is clean and clear without dominating the product itself.'} ${catLight}. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Quality Certification
  if (/quality|certif/.test(n)) {
    return `Amazon main product image — product with quality certification badge, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. A single professional certification or quality badge is displayed as a physical embossed medallion, seal, or label attached to or positioned directly beside the product — clean, official-looking, with minimal text. This is a physical object, not a digital graphic overlay. ${catLight}. The badge communicates trust, safety, and verified quality. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Feature Callout
  if (/feature.?callout/.test(n)) {
    return `Amazon main product image — product with feature callout tag, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. A single thin physical callout tag — clean white card with a fine arrow or line pointing to the product's #1 key feature — is physically attached to the product. The tag displays only the single most important feature benefit in clean readable sans-serif typography. This is a physical tag object, not a digital text overlay. ${catLight}. The callout does not obscure any key product element. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Award Badge
  if (/award/.test(n)) {
    return `Amazon main product image — product with award badge, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. A clean award medallion or badge — circular, gold or silver, with a ribbon beneath — is displayed as a physical object attached to or positioned directly beside the product, communicating recognition and achievement. Minimal clean typography on the badge. Physical object only — not a digital overlay. ${catLight}. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Sale Tag
  if (/sale.?tag/.test(n)) {
    return `Amazon main product image — product with sale/value tag, Amazon-compliant. ${p} is shown at ${catAngle}, filling 75% of the frame. A bold modern pricing or value tag — clean geometric shape in a bold accent color — is physically attached to the product by a short ribbon, displaying a value statement in clean bold typography. Physical tag only, not a digital overlay, and positioned so it does not cover any key product feature. ${catLight}. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // ─── LIFESTYLE ──────────────────────────────────────────────────────────────

  // With Hand / Avatar
  if (/with.?hand|hand.*avatar|avatar/.test(n)) {
    const hand = isHiCtr
      ? 'a stylish, well-groomed hand — naturally manicured, neither studio-perfect nor casual — gripping or actively using the product with intention and confidence'
      : 'a clean natural human hand holding or gently using the product in a relaxed, authentic grip'
    return `Amazon main product image — product in hand, Amazon-compliant. ${p} is held or actively used by ${hand}. Only the hand and wrist are visible — no body, no face, no person beyond the hand. The product is the primary subject, fully visible and sharp. ${catScale}. ${catLight}. Pure white background — no lifestyle environment, no props beyond the hand and product. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // In Use
  if (/in.?use/.test(n)) {
    return `Amazon main product image — product in active use, Amazon-compliant. ${p} is shown in the natural act of being used — demonstrating its core function in real time. ${isHiCtr ? 'The use context is bold and visually immediate — the viewer instantly understands what the product does and why they need it.' : 'The use context is clear, clean, and honest — the viewer immediately understands the product\'s primary function.'} Only a hand or minimal body part (no face, no full person) interacts with the product. Pure white background — no lifestyle environment or props beyond the interaction. ${catLight}. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // With Complementary Items
  if (/complementary/.test(n)) {
    return `Amazon main product image — product with complementary lifestyle item, Amazon-compliant. ${p} is the clear dominant hero, centered and occupying 65% of the frame. One single complementary lifestyle object — directly relevant to the product's primary use case — is placed naturally and secondarily in the frame. ${isHiCtr ? 'The complementary item is carefully chosen to be visually interesting and reinforce the product\'s value proposition at thumbnail size.' : 'The complementary item is minimal, clearly secondary, and reinforces product use without distracting from it.'} Pure white background. ${catLight}. No text overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Splash Effect
  if (/splash/.test(n)) {
    return `Amazon main product image — product with dynamic splash effect, Amazon-compliant. ${p} is shown at the center of a dramatic water or liquid splash — clean, transparent water splashing outward and upward from the product in a high-speed photography style. ${isHiCtr ? 'The splash is large, dynamic, and energetic — communicating water-resistance, freshness, and vitality with maximum visual impact.' : 'The splash is clean and precise — communicating water-resistance or freshness in a controlled, high-quality photography aesthetic.'} The product itself remains perfectly sharp, fully visible, and dominates the frame. Pure white background — the white space and water contrast create a striking clean look. ${catLight}. No text overlays. ${BASE}`
  }

  // Premium Lighting
  if (/premium.?light|lighting/.test(n)) {
    const lightStyle = isHiCtr
      ? 'a dramatic cinematic key light positioned at 45 degrees, casting a deep rich shadow on one side and an intense highlight on the other — creating high-contrast studio lighting that makes the product look powerful and premium on a search page'
      : 'a warm, soft premium studio key light with gentle fill creating depth through subtle shadow gradients — the product appears inviting, high-quality, and trustworthy'
    return `Amazon main product image — premium lighting treatment, Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}, under ${lightStyle}. The lighting is the hero of this composition — every surface detail, texture, material finish and color nuance is revealed by the precise light direction. Pure white background. No text, tags, or props. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // ─── ADVANCED ───────────────────────────────────────────────────────────────

  // Multi-angle Composite
  if (/multi.?angle/.test(n)) {
    return `Amazon main product image — multi-angle composite, Amazon-compliant. Three or four views of ${p} are arranged cleanly within the square frame — one primary large view (front, 50% of frame) accompanied by two or three smaller satellite views (back, side, top) positioned around it in an organized grid or arc composition. All views share consistent ${catLight} and shadow treatment. Every angle is crisp and equally sharp. The composite communicates the full physical form of the product from every relevant direction. Pure white background with clean spacing between views. No text overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Bundle Display
  if (/bundle/.test(n)) {
    return `Amazon main product image — bundle display, Amazon-compliant. All items included in the bundle or set — ${p} and every included accessory, component, or companion product — are arranged together in a clean, organized composition that communicates the total value of the purchase. ${isHiCtr ? 'Items are arranged in a visually abundant grid or arc — the sheer number of included items creates immediate perceived value at thumbnail size.' : 'Items are neatly organized with the main product centered and accessories arranged around it — professional, complete, and trust-building.'} ${catScale} of the combined arrangement. ${catLight}. Soft uniform shadows. No text overlays. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Exploded View
  if (/exploded/.test(n)) {
    return `Amazon main product image — exploded component view, Amazon-compliant. ${p} is shown as a clean exploded diagram: each major component or layer is separated from the others in three-dimensional space, floating along the product's central axis in natural build order — top component at the top, base component at the bottom, all aligned and centered. The components are clean, sharp, and evenly spaced to show construction quality and material layers. ${isHiCtr ? 'The explosion offset is dramatic and clearly readable at thumbnail size.' : 'The explosion offset is measured and precise — communicating engineering and build quality.'} ${catLight}. Pure white background. No text labels or digital overlays. ${drama} ${BASE}`
  }

  // Infographic Style
  if (/infographic/.test(n)) {
    return `Amazon main product image — infographic style with minimal callouts, Amazon-compliant. ${p} is shown at ${catAngle}, centered and filling 70% of the frame. Attached to the product via thin physical lines or arrows are one or two ultra-minimal callout tags — real physical printed tags, not digital overlays — each pointing precisely at a key feature and displaying a single short label in clean sans-serif typography. The callouts are subordinate to the product, not decorative. ${catLight}. The composition is clean, editorial, and instantly scannable. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
  }

  // Comparison Layout
  if (/comparison/.test(n)) {
    return `Amazon main product image — comparison layout, Amazon-compliant. The frame is split into two halves by a clean thin dividing line. The left half shows a generic or inferior alternative product in muted, desaturated tones. The right half shows ${p} in full color, sharp, premium — visually superior in presentation. ${p} is the obvious winner: better lit, more vibrant, and more detailed. ${isHiCtr ? 'The contrast is immediately striking at thumbnail size.' : 'The comparison is honest and clear.'} No text labels or digital overlays. Both products remain on pure white. ${drama} ${BASE}`
  }

  // ─── FALLBACK (unknown template) ────────────────────────────────────────────
  return `Amazon main product image, fully Amazon-compliant. ${p} is shown at ${catAngle}, ${catScale}. ${catLight}. A soft natural shadow beneath the product. No text, tags, packaging or overlays of any kind. ${drama} ${catExtras ? catExtras + '.' : ''} ${BASE}`
}

/**
 * Returns recommended template IDs for a given category.
 */
export function getRecommendedTemplates(category) {
  return CATEGORY_PROMPTS[category]?.recommendedTemplates || []
}

/**
 * Returns the one-line research insight for a given category.
 */
export function getCategoryInsight(category) {
  return CATEGORY_PROMPTS[category]?.insight || null
}

/**
 * Returns the CTR differentiator tip for a given category.
 */
export function getCtrDifferentiator(category) {
  return CATEGORY_PROMPTS[category]?.ctrDifferentiator || null
}
