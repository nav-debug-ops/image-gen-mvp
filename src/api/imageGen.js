/**
 * Image Generation API Layer
 *
 * Supports multiple providers:
 * - Replicate (Flux, SDXL models)
 * - OpenAI (DALL-E 3)
 * - Stability AI
 * - Demo mode (placeholder images for testing)
 */

const API_PROVIDER = import.meta.env.VITE_API_PROVIDER || 'demo'
const API_KEY = import.meta.env.VITE_API_KEY
const REPLICATE_MODEL = import.meta.env.VITE_REPLICATE_MODEL || 'black-forest-labs/flux-schnell'

// Available models for each provider
export const AVAILABLE_MODELS = {
  replicate: [
    { id: 'black-forest-labs/flux-schnell', name: 'Flux Schnell', description: 'Fast, high quality' },
    { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', description: 'Best quality, slower' },
    { id: 'stability-ai/sdxl', name: 'SDXL', description: 'Stable Diffusion XL' }
  ],
  openai: [
    { id: 'dall-e-3', name: 'DALL-E 3', description: 'Latest model' },
    { id: 'dall-e-2', name: 'DALL-E 2', description: 'Faster, lower cost' }
  ],
  stability: [
    { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', description: 'High quality' }
  ]
}

// Demo mode - generates placeholder images
async function generateDemo(prompt, onProgress) {
  onProgress?.({ status: 'starting', message: 'Initializing demo mode...' })

  // Simulate API delay with progress updates
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 400))
    onProgress?.({ status: 'processing', progress: (i + 1) * 20, message: 'Generating image...' })
  }

  // Use picsum.photos for random placeholder images
  const seed = Math.random().toString(36).substring(7)
  onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

  return {
    url: `https://picsum.photos/seed/${seed}/1024/1024`,
    provider: 'demo',
    model: 'placeholder'
  }
}

// Replicate API with progress tracking
async function generateReplicate(prompt, options = {}, onProgress) {
  const { model = REPLICATE_MODEL, aspectRatio = '1:1' } = options

  onProgress?.({ status: 'starting', message: 'Connecting to Replicate...' })

  // Determine the correct API format based on model
  let requestBody

  if (model.includes('flux')) {
    requestBody = {
      version: model,
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: aspectRatio,
        output_format: 'webp',
        output_quality: 90
      }
    }
  } else {
    // SDXL and other models
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
    metrics: result.metrics
  }
}

// OpenAI DALL-E API
async function generateOpenAI(prompt, options = {}, onProgress) {
  const { model = 'dall-e-3', quality = 'standard', size = '1024x1024' } = options

  onProgress?.({ status: 'starting', message: 'Connecting to OpenAI...' })

  const response = await fetch('https://api.openai.com/v1/images/generations', {
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
    model
  }
}

// Stability AI API
async function generateStability(prompt, options = {}, onProgress) {
  const { model = 'stable-diffusion-xl-1024-v1-0', steps = 30 } = options

  onProgress?.({ status: 'starting', message: 'Connecting to Stability AI...' })

  const response = await fetch(
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
    finishReason: data.artifacts[0].finishReason
  }
}

/**
 * Main image generation function
 * @param {string} prompt - The image generation prompt
 * @param {object} options - Provider-specific options
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
        return await generateDemo(prompt, onProgress)
    }
  } catch (error) {
    onProgress?.({ status: 'error', message: error.message })
    throw error
  }
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
