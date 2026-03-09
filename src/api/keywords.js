import { fetchAPI, safeJson } from './client'

export async function suggestKeywords(asin, imageType, product = {}) {
  const params = new URLSearchParams({
    asin,
    type: imageType,
    title: product.title || '',
    brand: product.brand || '',
    bullets: JSON.stringify(product.bullets || []),
    category: product.category || '',
  })
  const res = await fetchAPI(`/api/keywords/suggest?${params}`)
  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(err?.detail || `Keyword suggestion failed (${res.status})`)
  }
  const data = await safeJson(res)
  return data?.keywords || []
}
