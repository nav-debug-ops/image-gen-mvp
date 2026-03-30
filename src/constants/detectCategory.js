/**
 * Client-side product category detection.
 * Uses backend's detected_category first, then falls back to local
 * direct-name matching and keyword signal scoring.
 *
 * Shared across MainImageGenerator and SecondaryImageGenerator.
 */

const _BREADCRUMB_DIRECT_MAP = [
  ['sports & outdoors', 'Sports & Outdoors'],
  ['beauty & personal care', 'Beauty & Personal Care'],
  ['health & household', 'Health & Household'],
  ['home & kitchen', 'Home & Kitchen'],
  ['kitchen & dining', 'Home & Kitchen'],
  ['toys & games', 'Toys & Games'],
  ['clothing, shoes & jewelry', 'Clothing & Apparel'],
  ['clothing & apparel', 'Clothing & Apparel'],
  ['baby products', 'Baby Products'],
  ['baby & toddler', 'Baby Products'],
  ['electronics', 'Electronics'],
  ['automotive', 'Automotive'],
  ['tools & home improvement', 'Tools & Home Improvement'],
  ['patio, lawn & garden', 'Garden & Outdoor'],
  ['garden & outdoor', 'Garden & Outdoor'],
  ['office products', 'Office Products'],
  ['arts, crafts & sewing', 'Arts, Crafts & Sewing'],
  ['industrial & scientific', 'Industrial & Scientific'],
  ['musical instruments', 'Musical Instruments'],
  ['books', 'Books & Media'],
  ['movies & tv', 'Books & Media'],
  ['video games', 'Books & Media'],
  ['grocery & gourmet food', 'Food & Grocery'],
  ['grocery', 'Food & Grocery'],
  ['jewelry', 'Jewelry & Watches'],
  ['watches', 'Jewelry & Watches'],
  ['shoes', 'Shoes & Handbags'],
  ['handbags & wallets', 'Shoes & Handbags'],
  ['luggage & travel gear', 'Shoes & Handbags'],
  ['pet supplies', 'Pet Supplies'],
]

const _CLIENT_CATEGORY_SIGNALS = [
  { patterns: ['baby', 'infant', 'toddler', 'diaper', 'nappy', 'stroller', 'pacifier', 'crib', 'swaddle', 'nursery', 'bassinet'], category: 'Baby Products' },
  { patterns: ['toy', 'puzzle', 'lego', 'doll', 'playset', 'action figure', 'board game', 'rc car', 'kids game', 'building toy'], category: 'Toys & Games' },
  { patterns: ['guitar', 'piano', 'drum', 'violin', 'ukulele', 'saxophone', 'trumpet', 'flute', 'bass guitar', 'musical instrument', 'amplifier', 'midi', 'dj equipment'], category: 'Musical Instruments' },
  { patterns: ['ring', 'necklace', 'bracelet', 'earring', 'pendant', 'wristwatch', 'smartwatch', 'jewelry', 'jewellery', 'timepiece', 'brooch', 'anklet'], category: 'Jewelry & Watches' },
  { patterns: ['shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer', 'footwear', 'handbag', 'purse', 'wallet', 'clutch', 'tote bag', 'satchel', 'luggage', 'suitcase'], category: 'Shoes & Handbags' },
  { patterns: ['skin care', 'skincare', 'makeup', 'cosmetic', 'fragrance', 'perfume', 'cologne', 'shampoo', 'conditioner', 'serum', 'moisturizer', 'sunscreen', 'lipstick', 'mascara', 'foundation', 'hair care', 'haircare', 'nail', 'oral care', 'lotion', 'deodorant'], category: 'Beauty & Personal Care' },
  { patterns: ['laptop', 'computer', 'tablet', 'monitor', 'headphone', 'earbud', 'earphone', 'speaker', 'camera', 'printer', 'router', 'charger', 'usb hub', 'bluetooth', 'smartphone', 'smart home', 'drone', 'projector', 'power bank', 'television', 'networking'], category: 'Electronics' },
  { patterns: ['cookware', 'bakeware', 'blender', 'coffee maker', 'air fryer', 'instant pot', 'toaster', 'vacuum', 'bedding', 'pillow', 'mattress', 'furniture', 'lamp', 'rug', 'curtain', 'home decor', 'storage bin', 'organizer', 'candle', 'bath towel', 'shower curtain', 'mop', 'broom'], category: 'Home & Kitchen' },
  { patterns: ['grocery', 'gourmet food', 'snack', 'protein powder', 'candy', 'chocolate', 'cereal', 'sauce', 'spice', 'condiment', 'energy drink', 'coffee bean', 'dried fruit', 'pasta', 'baking mix', 'meal kit', 'organic food'], category: 'Food & Grocery' },
  { patterns: ['vitamin', 'supplement', 'probiotic', 'omega', 'first aid', 'bandage', 'thermometer', 'blood pressure', 'detergent', 'paper towel', 'toilet paper', 'cleaning supply', 'laundry', 'wellness', 'weight loss'], category: 'Health & Household' },
  { patterns: ['dog', 'cat', 'pet', 'puppy', 'kitten', 'aquarium', 'fish tank', 'bird cage', 'hamster', 'rabbit', 'leash', 'collar', 'litter box', 'kibble', 'pet food', 'pet toy', 'pet grooming', 'flea'], category: 'Pet Supplies' },
  { patterns: ['yoga', 'gym', 'dumbbell', 'resistance band', 'treadmill', 'bicycle', 'cycling', 'camping', 'hiking', 'tent', 'sleeping bag', 'fishing', 'golf', 'tennis', 'swimming', 'running shoe', 'athletic', 'soccer', 'basketball', 'football'], category: 'Sports & Outdoors' },
  { patterns: ['shirt', 't-shirt', 'pants', 'jeans', 'dress', 'jacket', 'coat', 'hoodie', 'sweater', 'sweatshirt', 'sock', 'underwear', 'swimwear', 'hat', 'beanie', 'cap', 'scarf', 'legging', 'shorts', 'uniform', 'activewear'], category: 'Clothing & Apparel' },
  { patterns: ['car', 'truck', 'motorcycle', 'auto part', 'tire', 'wheel', 'motor oil', 'brake', 'engine', 'seat cover', 'dash cam', 'floor mat', 'jump starter', 'car wash', 'car mount'], category: 'Automotive' },
  { patterns: ['drill', 'saw', 'screwdriver', 'wrench', 'hammer', 'power tool', 'hand tool', 'electrical', 'plumbing', 'paint', 'ladder', 'fastener', 'screw', 'hardware', 'measuring tape', 'workbench'], category: 'Tools & Home Improvement' },
  { patterns: ['garden', 'lawn', 'plant', 'seed', 'soil', 'fertilizer', 'watering can', 'hose', 'sprinkler', 'grill', 'bbq', 'fire pit', 'planter', 'rake', 'shovel', 'greenhouse', 'outdoor furniture', 'patio'], category: 'Garden & Outdoor' },
  { patterns: ['office supply', 'stationery', 'pen', 'pencil', 'notebook', 'binder', 'stapler', 'ink cartridge', 'whiteboard', 'sticky note', 'shredder', 'calculator', 'desk organizer', 'label maker', 'filing'], category: 'Office Products' },
  { patterns: ['knitting', 'crochet', 'embroidery', 'cross stitch', 'watercolor', 'acrylic paint', 'canvas', 'sculpting', 'clay', 'yarn', 'thread', 'fabric', 'scrapbooking', 'beading', 'marker set', 'colored pencil'], category: 'Arts, Crafts & Sewing' },
  { patterns: ['industrial', 'laboratory', 'lab equipment', 'safety equipment', 'ppe', 'safety glasses', 'hard hat', 'janitorial', 'microscope', 'testing equipment'], category: 'Industrial & Scientific' },
  { patterns: ['book', 'kindle edition', 'magazine', 'dvd', 'blu-ray', 'vinyl', 'software', 'video game', 'movie', 'ebook', 'audiobook'], category: 'Books & Media' },
]

/**
 * Detect the canonical product category from ASIN lookup result.
 * Priority: backend detected_category → direct department name match → keyword scoring.
 * @param {object} product - the product object returned by lookupASIN()
 * @returns {string|null} canonical category name or null
 */
export function detectCategoryFromProduct(product) {
  if (!product) return null

  // 1. Trust backend result
  if (product.detected_category) return product.detected_category

  // 2. Build corpus from all available text
  const corpus = [
    product.category || '',
    product.title || '',
    ...(product.bullets || []).slice(0, 3),
  ].join(' ').toLowerCase()

  // 3. Direct Amazon department name match
  for (const [fragment, category] of _BREADCRUMB_DIRECT_MAP) {
    if (corpus.includes(fragment)) return category
  }

  // 4. Keyword signal scoring
  let bestCategory = null
  let bestScore = 0
  for (const { patterns, category } of _CLIENT_CATEGORY_SIGNALS) {
    const score = patterns.filter(p => corpus.includes(p)).length
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }
  return bestScore >= 1 ? bestCategory : null
}
