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

/**
 * Builds a research-backed prompt for Amazon main image generation.
 *
 * @param {string} templateName - Name of the selected template (e.g. "Plain White Background")
 * @param {string} category     - Product category (must match PRODUCT_CATEGORIES keys)
 * @param {string} strategy     - 'top-performing' or 'high-ctr'
 * @param {string} productDesc  - Optional brief product description to include
 * @returns {string} Full prompt string for AI image generation
 */
export function buildImagePrompt(templateName, category, strategy = 'top-performing', productDesc = '') {
  const catData = CATEGORY_PROMPTS[category]

  // Fallback to generic if category not found
  if (!catData) {
    const productPart = productDesc ? `${productDesc}, ` : ''
    return `Amazon product listing main image, ${productPart}${templateName} composition, pure white background #FFFFFF, professional commercial product photography, even studio lighting, sharp focus, product fills 85% of frame, Amazon-compliant main image`
  }

  const strat = strategy === 'high-ctr' ? catData.highCtr : catData.topPerforming
  const productPart = productDesc ? `${productDesc}, ` : 'product, '

  return [
    `Amazon product listing main image`,
    productPart.trim(),
    `${templateName} composition`,
    strat.background,
    strat.angle,
    strat.lighting,
    strat.scale,
    `professional commercial product photography`,
    `sharp focus`,
    `no text overlays`,
    `no watermarks`,
    `Amazon-compliant main image`,
    strat.extras,
  ].filter(Boolean).join(', ')
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
