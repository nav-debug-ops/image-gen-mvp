import { fetchAPI, safeJson } from './client'

export async function generateCopy({ asin, marketplace, language, tone, keywords, manualTitle = '', manualBullets = [] }) {
  const keywordList = keywords
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)

  const res = await fetchAPI('/api/copywriter/generate', {
    method: 'POST',
    body: JSON.stringify({
      asin,
      marketplace,
      language,
      tone,
      keywords: keywordList,
      manual_title: manualTitle,
      manual_bullets: manualBullets,
    }),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    const detail = err?.detail
    if (detail && typeof detail === 'object' && detail.code === 'asin_lookup_failed') {
      const e = new Error(detail.message || 'ASIN lookup failed')
      e.code = 'asin_lookup_failed'
      throw e
    }
    throw new Error(typeof detail === 'string' ? detail : `Copy generation failed (${res.status})`)
  }

  return safeJson(res)
}
