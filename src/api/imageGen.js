/**
 * Image Generation API Layer
 *
 * Supports multiple providers:
 * - Replicate (Flux, SDXL models)
 * - OpenAI (DALL-E 3)
 * - Stability AI
 * - Demo mode (placeholder images for testing)
 *
 * Features:
 * - Text-to-image generation
 * - Image-to-image with reference images
 * - Multiple reference image support with strength/influence control
 */

const API_PROVIDER = import.meta.env.VITE_API_PROVIDER || 'demo'
const API_KEY = import.meta.env.VITE_API_KEY
const REPLICATE_MODEL = import.meta.env.VITE_REPLICATE_MODEL || 'black-forest-labs/flux-schnell'

// Available models for each provider
export const AVAILABLE_MODELS = {
  replicate: [
    { id: 'black-forest-labs/flux-schnell', name: 'Flux Schnell', description: 'Fast, high quality', supportsImg2Img: false },
    { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', description: 'Best quality, slower', supportsImg2Img: true },
    { id: 'black-forest-labs/flux-redux-schnell', name: 'Flux Redux', description: 'Image variation/remix', supportsImg2Img: true },
    { id: 'stability-ai/sdxl', name: 'SDXL', description: 'Stable Diffusion XL', supportsImg2Img: true }
  ],
  openai: [
    { id: 'dall-e-3', name: 'DALL-E 3', description: 'Latest model', supportsImg2Img: false },
    { id: 'dall-e-2', name: 'DALL-E 2', description: 'Supports variations', supportsImg2Img: true }
  ],
  stability: [
    { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', description: 'High quality', supportsImg2Img: true },
    { id: 'stable-image-core', name: 'Stable Image Core', description: 'Fast, good quality', supportsImg2Img: true }
  ]
}

// Reference image type definitions
export const REFERENCE_TYPES = {
  style: { weight: 0.8, description: 'Copy artistic style and rendering' },
  composition: { weight: 0.7, description: 'Match layout and arrangement' },
  color: { weight: 0.6, description: 'Use color palette' },
  subject: { weight: 0.9, description: 'Reference subject/product appearance' }
}

/**
 * Convert base64 data URL to raw base64 string
 */
function stripBase64Prefix(base64DataUrl) {
  if (base64DataUrl.includes(',')) {
    return base64DataUrl.split(',')[1]
  }
  return base64DataUrl
}

/**
 * Build reference image payload for API requests
 */
function buildReferencePayload(referenceImages) {
  if (!referenceImages || referenceImages.length === 0) {
    return null
  }

  return referenceImages
    .sort((a, b) => a.order - b.order)
    .map(ref => ({
      base64: stripBase64Prefix(ref.base64),
      strength: ref.strength / 100, // Convert to 0-1 range
      type: ref.tag,
      typeWeight: REFERENCE_TYPES[ref.tag]?.weight || 0.7
    }))
}

// Demo mode - generates placeholder images
async function generateDemo(prompt, options = {}, onProgress) {
  const { referenceImages } = options
  const hasReferences = referenceImages && referenceImages.length > 0

  onProgress?.({ status: 'starting', message: hasReferences ? 'Processing reference images...' : 'Initializing demo mode...' })

  // Simulate API delay with progress updates
  const steps = hasReferences ? 8 : 5 // More steps when processing references
  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const message = hasReferences && i < 3
      ? `Analyzing reference ${Math.min(i + 1, referenceImages.length)} of ${referenceImages.length}...`
      : 'Generating image...'
    onProgress?.({ status: 'processing', progress: ((i + 1) / steps) * 100, message })
  }

  // Use picsum.photos for random placeholder images
  const seed = Math.random().toString(36).substring(7)
  onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

  return {
    url: `https://picsum.photos/seed/${seed}/1024/1024`,
    provider: 'demo',
    model: 'placeholder',
    usedReferences: hasReferences ? referenceImages.length : 0
  }
}

// Replicate API with progress tracking
async function generateReplicate(prompt, options = {}, onProgress) {
  const { model = REPLICATE_MODEL, aspectRatio = '1:1', referenceImages } = options
  const refPayload = buildReferencePayload(referenceImages)
  const hasReferences = refPayload && refPayload.length > 0

  onProgress?.({ status: 'starting', message: hasReferences ? 'Uploading reference images...' : 'Connecting to Replicate...' })

  // Determine the correct API format based on model
  let requestBody

  if (model.includes('flux-redux') && hasReferences) {
    // Flux Redux - image variation/remix model
    requestBody = {
      version: model,
      input: {
        image: refPayload[0].base64, // Primary reference
        prompt,
        num_outputs: 1,
        aspect_ratio: aspectRatio,
        output_format: 'webp',
        output_quality: 90,
        prompt_strength: 1 - refPayload[0].strength // Inverse for Flux Redux
      }
    }
  } else if (model.includes('flux')) {
    // Flux models with optional image guidance
    const input = {
      prompt,
      num_outputs: 1,
      aspect_ratio: aspectRatio,
      output_format: 'webp',
      output_quality: 90
    }

    // Add image guidance if references provided (for Flux Pro)
    if (hasReferences && model.includes('pro')) {
      input.image = `data:image/png;base64,${refPayload[0].base64}`
      input.prompt_strength = 1 - refPayload[0].strength
    }

    requestBody = {
      version: model,
      input
    }
  } else if (model.includes('sdxl') && hasReferences) {
    // SDXL img2img
    requestBody = {
      version: model,
      input: {
        prompt,
        image: `data:image/png;base64,${refPayload[0].base64}`,
        strength: refPayload[0].strength,
        width: 1024,
        height: 1024,
        num_outputs: 1
      }
    }
  } else {
    // SDXL and other models - text to image
    requestBody = {
      version: model,
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1
      }
    }
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || `Replicate API error: ${response.status}`)
  }

  const prediction = await response.json()
  onProgress?.({ status: 'processing', progress: 20, message: 'Generation started...' })

  // Poll for completion with progress updates
  let result = prediction
  let pollCount = 0
  const maxPolls = 120 // 2 minutes max

  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled') {
    if (pollCount >= maxPolls) {
      throw new Error('Generation timed out')
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
    pollCount++

    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${API_KEY}` }
    })

    if (!pollResponse.ok) {
      throw new Error(`Failed to check generation status: ${pollResponse.status}`)
    }

    result = await pollResponse.json()

    // Update progress based on status
    const progress = Math.min(20 + pollCount * 2, 90)
    onProgress?.({
      status: 'processing',
      progress,
      message: `Generating... (${result.status})`
    })
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Image generation failed')
  }

  if (result.status === 'canceled') {
    throw new Error('Generation was canceled')
  }

  onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

  const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output

  return {
    url: imageUrl,
    provider: 'replicate',
    model,
    predictionId: result.id,
    metrics: result.metrics,
    usedReferences: hasReferences ? refPayload.length : 0
  }
}

// OpenAI DALL-E API
async function generateOpenAI(prompt, options = {}, onProgress) {
  const { model = 'dall-e-3', quality = 'standard', size = '1024x1024', referenceImages } = options
  const refPayload = buildReferencePayload(referenceImages)
  const hasReferences = refPayload && refPayload.length > 0

  onProgress?.({ status: 'starting', message: hasReferences ? 'Processing reference image...' : 'Connecting to OpenAI...' })

  let response
  let usedVariation = false

  // Use variations endpoint for DALL-E 2 with reference images
  if (hasReferences && model === 'dall-e-2') {
    // Convert base64 to blob for FormData
    const base64Data = refPayload[0].base64
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/png' })

    const formData = new FormData()
    formData.append('image', blob, 'reference.png')
    formData.append('n', '1')
    formData.append('size', size)
    formData.append('response_format', 'url')

    response = await fetch('https://api.openai.com/v1/images/variations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    })
    usedVariation = true
  } else {
    // Standard text-to-image generation
    response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality,
        response_format: 'url'
      })
    })
  }

  onProgress?.({ status: 'processing', progress: 50, message: 'Generating image...' })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

  return {
    url: data.data[0].url,
    revisedPrompt: data.data[0].revised_prompt,
    provider: 'openai',
    model,
    usedReferences: usedVariation ? 1 : 0,
    mode: usedVariation ? 'variation' : 'generation'
  }
}

// Stability AI API
async function generateStability(prompt, options = {}, onProgress) {
  const { model = 'stable-diffusion-xl-1024-v1-0', steps = 30, referenceImages } = options
  const refPayload = buildReferencePayload(referenceImages)
  const hasReferences = refPayload && refPayload.length > 0

  onProgress?.({ status: 'starting', message: hasReferences ? 'Processing reference image...' : 'Connecting to Stability AI...' })

  let response
  let usedImg2Img = false

  if (hasReferences) {
    // Image-to-image generation
    usedImg2Img = true
    const imageStrength = refPayload[0].strength

    response = await fetch(
      `https://api.stability.ai/v1/generation/${model}/image-to-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt, weight: 1 }],
          init_image: refPayload[0].base64,
          init_image_mode: 'IMAGE_STRENGTH',
          image_strength: imageStrength,
          cfg_scale: 7,
          steps,
          samples: 1
        })
      }
    )
  } else {
    // Text-to-image generation
    response = await fetch(
      `https://api.stability.ai/v1/generation/${model}/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps,
          samples: 1
        })
      }
    )
  }

  onProgress?.({ status: 'processing', progress: 50, message: 'Generating image...' })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Stability AI error: ${response.status}`)
  }

  const data = await response.json()
  onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

  const base64 = data.artifacts[0].base64
  return {
    url: `data:image/png;base64,${base64}`,
    provider: 'stability',
    model,
    finishReason: data.artifacts[0].finishReason,
    usedReferences: usedImg2Img ? 1 : 0,
    mode: usedImg2Img ? 'img2img' : 'txt2img'
  }
}

/**
 * Main image generation function
 * @param {string} prompt - The image generation prompt
 * @param {object} options - Provider-specific options
 * @param {object} options.referenceImages - Array of reference images for img2img
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Generated image data
 */
export async function generateImage(prompt, options = {}, onProgress = null) {
  const provider = options.provider || API_PROVIDER

  try {
    switch (provider.toLowerCase()) {
      case 'replicate':
        return await generateReplicate(prompt, options, onProgress)
      case 'openai':
        return await generateOpenAI(prompt, options, onProgress)
      case 'stability':
        return await generateStability(prompt, options, onProgress)
      case 'demo':
      default:
        return await generateDemo(prompt, options, onProgress)
    }
  } catch (error) {
    onProgress?.({ status: 'error', message: error.message })
    throw error
  }
}

/**
 * Generate image with reference images
 * Convenience wrapper that ensures proper reference handling
 * @param {string} prompt - Text prompt
 * @param {Array} referenceImages - Array of reference image objects
 * @param {object} options - Additional options
 * @param {function} onProgress - Progress callback
 */
export async function generateImageWithReferences(prompt, referenceImages, options = {}, onProgress = null) {
  return generateImage(prompt, { ...options, referenceImages }, onProgress)
}

/**
 * Check if the current provider/model supports image-to-image
 */
export function supportsImg2Img(provider = API_PROVIDER, modelId = null) {
  const providerModels = AVAILABLE_MODELS[provider.toLowerCase()]
  if (!providerModels) return false

  if (modelId) {
    const model = providerModels.find(m => m.id === modelId)
    return model?.supportsImg2Img || false
  }

  // Check if any model supports it
  return providerModels.some(m => m.supportsImg2Img)
}

/**
 * Legacy function for backward compatibility
 */
export async function generateImageLegacy(prompt) {
  const result = await generateImage(prompt)
  return result.url
}

// Export provider info for UI
export function getProviderInfo() {
  return {
    provider: API_PROVIDER,
    isDemo: API_PROVIDER === 'demo' || !API_KEY,
    hasKey: !!API_KEY,
    model: REPLICATE_MODEL,
    availableModels: AVAILABLE_MODELS[API_PROVIDER] || []
  }
}

// Validate API credentials
export async function validateCredentials() {
  if (API_PROVIDER === 'demo' || !API_KEY) {
    return { valid: false, message: 'No API key configured' }
  }

  try {
    switch (API_PROVIDER) {
      case 'replicate':
        const repResponse = await fetch('https://api.replicate.com/v1/account', {
          headers: { 'Authorization': `Token ${API_KEY}` }
        })
        return {
          valid: repResponse.ok,
          message: repResponse.ok ? 'Replicate API connected' : 'Invalid Replicate token'
        }

      case 'openai':
        const oaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        })
        return {
          valid: oaiResponse.ok,
          message: oaiResponse.ok ? 'OpenAI API connected' : 'Invalid OpenAI key'
        }

      case 'stability':
        const stabResponse = await fetch('https://api.stability.ai/v1/user/account', {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        })
        return {
          valid: stabResponse.ok,
          message: stabResponse.ok ? 'Stability AI connected' : 'Invalid Stability key'
        }

      default:
        return { valid: false, message: 'Unknown provider' }
    }
  } catch (error) {
    return { valid: false, message: `Connection error: ${error.message}` }
  }
}
