import { fetchAPI, safeJson } from './client'

export async function scoreImage(imageUrl, prompt, contentType) {
  const res = await fetchAPI('/api/eval/score', {
    method: 'POST',
    body: JSON.stringify({ image_url: imageUrl, prompt, content_type: contentType }),
  })
  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(err?.detail || `Eval failed (${res.status})`)
  }
  return safeJson(res)
}
