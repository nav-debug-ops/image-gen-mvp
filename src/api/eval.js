import { fetchAPI, safeJson } from './client'

export async function scoreImage(imageUrl, prompt, contentType, imageId = null) {
  const res = await fetchAPI('/api/eval/score', {
    method: 'POST',
    body: JSON.stringify({
      image_url: imageUrl,
      prompt,
      content_type: contentType,
      image_id: imageId,
    }),
  })
  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(err?.detail || `Eval failed (${res.status})`)
  }
  return safeJson(res)
}
