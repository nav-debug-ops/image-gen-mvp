import { fetchAPI, safeJson } from './client'

export async function lookupASIN(asin, marketplace = 'US') {
  const res = await fetchAPI(`/api/asin/${asin}?marketplace=${marketplace}`)
  if (!res.ok) {
    const err = await safeJson(res)
    const detail = err?.detail
    if (detail) throw new Error(detail)
    if (res.status === 404) throw new Error('Product not found')
    if (res.status === 503) throw new Error('Amazon is temporarily unavailable. Try again later.')
    throw new Error(`ASIN lookup failed (HTTP ${res.status}). Please try again.`)
  }
  const data = await safeJson(res)
  if (!data) throw new Error('Empty response from server')
  return data.product
}
