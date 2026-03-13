import { fetchAPI, safeJson } from './client'

export async function generateCopy({ asin, marketplace, language, tone, keywords }) {
  const keywordList = keywords
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)

  const res = await fetchAPI('/api/copywriter/generate', {
    method: 'POST',
    body: JSON.stringify({ asin, marketplace, language, tone, keywords: keywordList }),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(err?.detail || `Copy generation failed (${res.status})`)
  }

  return safeJson(res)
}
