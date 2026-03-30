/**
 * Image Generation API Layer — Backend Proxy
 *
 * All AI provider calls go through the backend.
 * No API keys are exposed in the frontend.
 */

import { fetchAPI, safeJson } from './client'

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
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4', description: 'Best quality — recommended for hero images', supportsImg2Img: false },
    { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast', description: 'Faster Imagen 4', supportsImg2Img: false },
    { id: 'imagen-4.0-ultra-generate-001', name: 'Imagen 4 Ultra', description: 'Highest quality Imagen 4', supportsImg2Img: false },
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', description: 'Native image gen, supports img2img', supportsImg2Img: true },
    { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image', description: 'Latest native image preview', supportsImg2Img: true },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image', description: 'Pro-quality native image gen', supportsImg2Img: true },
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
    reference_image_url: options.referenceImageUrl || undefined,
  }

  onProgress?.({ status: 'processing', progress: 20, message: 'Generating image...' })

  try {
    const response = await fetchAPI('/api/generate/', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (response.status === 429) {
      const err = await safeJson(response)
      throw new Error(err?.detail?.message || 'Rate limit exceeded. Try again later.')
    }

    if (!response.ok) {
      const err = await safeJson(response)
      throw new Error(err?.detail || `Generation failed (${response.status})`)
    }

    onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

    const data = await safeJson(response)
    if (!data) throw new Error('Empty response from server')
    return {
      url: data.image_url,
      imageId: data.image_id,
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
 * Generate an Amazon hero image from an ASIN using dynamic prompt + Imagen 3.
 * Calls POST /api/generate/hero — backend handles ASIN lookup + prompt building.
 */
export async function generateHeroImage({ asin, marketplace = 'US', templateName = 'Plain White Background', aspectRatio = '1:1', promptVariation = 0 }, onProgress = null) {
  onProgress?.({ status: 'starting', progress: 0, message: 'Building product brief...' })

  const body = {
    asin,
    marketplace,
    template_name: templateName,
    aspect_ratio: aspectRatio,
    prompt_variation: promptVariation,
  }

  onProgress?.({ status: 'processing', progress: 20, message: 'Generating professional prompts + image...' })

  try {
    const response = await fetchAPI('/api/generate/hero', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (response.status === 429) {
      const err = await safeJson(response)
      throw new Error(err?.detail?.message || 'Rate limit exceeded. Try again later.')
    }

    if (!response.ok) {
      const err = await safeJson(response)
      throw new Error(err?.detail || `Hero generation failed (${response.status})`)
    }

    onProgress?.({ status: 'completed', progress: 100, message: 'Image ready!' })

    const data = await safeJson(response)
    if (!data) throw new Error('Empty response from server')
    return {
      url: data.image_url,
      imageId: data.image_id,
      provider: data.provider,
      model: data.model,
      generationId: data.generation_id,
      costEstimate: data.cost_estimate,
      allPrompts: data.all_prompts,
      imagePrompts: data.image_prompts,
      activePrompt: data.active_prompt,
    }
  } catch (error) {
    onProgress?.({ status: 'error', message: error.message })
    throw error
  }
}

/**
 * Generate an Amazon hero image with real-time SSE progress streaming.
 * Replaces generateHeroImage() — emits step events before resolving with the final result.
 */
export async function generateHeroImageStream({ asin, marketplace = 'US', templateName = 'Plain White Background', aspectRatio = '1:1', promptVariation = 0 }, onProgress = null) {
  const body = {
    asin,
    marketplace,
    template_name: templateName,
    aspect_ratio: aspectRatio,
    prompt_variation: promptVariation,
  }

  const token = localStorage.getItem('auth_token')
  const response = await fetch('/api/generate/hero/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.detail || `Hero generation failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      let event
      try { event = JSON.parse(line.slice(6)) } catch { continue }

      if (event.step === 'error') throw new Error(event.message)

      if (event.step === 'done') {
        return {
          url: event.image_url,
          imageId: event.image_id,
          provider: event.provider,
          model: event.model,
          generationId: event.generation_id,
          costEstimate: event.cost_estimate,
          allPrompts: event.all_prompts,
          imagePrompts: event.image_prompts,
          activePrompt: event.active_prompt,
        }
      }

      onProgress?.(event)
    }
  }

  throw new Error('Stream ended without a result')
}

/**
 * Generate a single AI-powered image prompt for a template + product combination.
 * Used in upload/manual mode — replaces static buildImagePrompt().
 */
export async function buildAIPrompt({ templateName, productCategory, strategy, productDescription }) {
  const res = await fetchAPI('/api/generate/build-prompt', {
    method: 'POST',
    body: JSON.stringify({
      template_name: templateName,
      product_category: productCategory || null,
      strategy: strategy || 'top-performing',
      product_description: productDescription || null,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || 'AI prompt generation failed')
  }
  const data = await res.json()
  return data.prompt
}

/**
 * Generate image with reference images (convenience wrapper).
 */
export async function generateImageWithReferences(prompt, referenceImages, options = {}, onProgress = null) {
  return generateImage(prompt, { ...options, referenceImages }, onProgress)
}

/**
 * Upload a reference image for img2img generation.
 * Returns the backend-hosted URL to pass as reference_image_url.
 */
export async function uploadReferenceImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  // Use fetch directly — fetchAPI forces Content-Type: application/json which
  // would break multipart. Let the browser set the boundary automatically.
  const token = localStorage.getItem('auth_token')
  const res = await fetch('/api/images/upload-reference', {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || `Upload failed (${res.status})`)
  }
  const data = await res.json()
  return data.url
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
