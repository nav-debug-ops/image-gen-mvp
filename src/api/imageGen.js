/**
 * Image Generation API Layer — Backend Proxy
 *
 * All AI provider calls go through the backend.
 * No API keys are exposed in the frontend.
 */

import { fetchAPI } from './client'

// Reference image type definitions (kept for UI components)
export const REFERENCE_TYPES = {
  style: { weight: 0.8, description: 'Copy artistic style and rendering' },
  composition: { weight: 0.7, description: 'Match layout and arrangement' },
  color: { weight: 0.6, description: 'Use color palette' },
  subject: { weight: 0.9, description: 'Reference subject/product appearance' }
}

// Available models — fetched from backend, but kept as fallback for UI
export const AVAILABLE_MODELS = {
  replicate: [
    { id: 'black-forest-labs/flux-schnell', name: 'Flux Schnell', description: 'Fast, high quality', supportsImg2Img: false },
    { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', description: 'Best quality, slower', supportsImg2Img: true },
    { id: 'stability-ai/sdxl', name: 'SDXL', description: 'Stable Diffusion XL', supportsImg2Img: true }
  ],
  openai: [
    { id: 'dall-e-3', name: 'DALL-E 3', description: 'Latest model', supportsImg2Img: false },
    { id: 'dall-e-2', name: 'DALL-E 2', description: 'Supports variations', supportsImg2Img: true }
  ],
  gemini: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Native image generation', supportsImg2Img: false },
    { id: 'imagen-3.0-generate-002', name: 'Imagen 3', description: 'High quality Google model', supportsImg2Img: false }
  ]
}

/**
 * Main image generation function — calls backend proxy.
 * Preserves the same signature as before for backward compatibility.
 *
 * @param {string} prompt - The image generation prompt
 * @param {object} options - Generation options
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Generated image data
 */
export async function generateImage(prompt, options = {}, onProgress = null) {
  onProgress?.({ status: 'starting', progress: 0, message: 'Sending to server...' })

  const body = {
    prompt,
    provider: options.provider || undefined,
    model: options.model || undefined,
    aspect_ratio: options.aspectRatio || '1:1',
    width: options.width || 1024,
    height: options.height || 1024,
    style: options.style || undefined,
    failover: true,
  }

  onProgress?.({ status: 'processing', progress: 20, message: 'Generating image...' })

  try {
    const response = await fetchAPI('/api/generate/', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (response.status === 429) {
      const err = await response.json()
      throw new Error(err.detail?.message || 'Rate limit exceeded. Try again later.')
    }

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Image generation failed')
    }

    onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

    const data = await response.json()
    return {
      url: data.image_url,
      provider: data.provider,
      model: data.model,
      generationId: data.generation_id,
      costEstimate: data.cost_estimate,
      usedReferences: 0,
    }
  } catch (error) {
    onProgress?.({ status: 'error', message: error.message })
    throw error
  }
}

/**
 * Generate image with reference images (convenience wrapper).
 */
export async function generateImageWithReferences(prompt, referenceImages, options = {}, onProgress = null) {
  return generateImage(prompt, { ...options, referenceImages }, onProgress)
}

/**
 * Legacy function for backward compatibility.
 */
export async function generateImageLegacy(prompt) {
  const result = await generateImage(prompt)
  return result.url
}

/**
 * Check if a provider/model supports img2img.
 */
export function supportsImg2Img(provider = 'replicate', modelId = null) {
  const providerModels = AVAILABLE_MODELS[provider?.toLowerCase()]
  if (!providerModels) return false

  if (modelId) {
    const model = providerModels.find(m => m.id === modelId)
    return model?.supportsImg2Img || false
  }

  return providerModels.some(m => m.supportsImg2Img)
}

/**
 * Get provider info from backend.
 */
export async function getProviderInfo() {
  try {
    const res = await fetchAPI('/api/generate/providers')
    if (!res.ok) return { provider: 'unknown', isDemo: true, hasKey: false, availableModels: [] }
    const data = await res.json()
    return {
      provider: data.default_provider,
      isDemo: data.providers.length === 0,
      hasKey: data.providers.length > 0,
      availableModels: data.providers,
    }
  } catch {
    return { provider: 'unknown', isDemo: true, hasKey: false, availableModels: [] }
  }
}

/**
 * Validate backend connection.
 */
export async function validateCredentials() {
  try {
    const res = await fetchAPI('/api/generate/providers')
    return {
      valid: res.ok,
      message: res.ok ? 'Backend connected' : 'Backend unavailable',
    }
  } catch {
    return { valid: false, message: 'Cannot reach backend' }
  }
}
